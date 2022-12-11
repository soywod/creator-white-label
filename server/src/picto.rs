use actix_web::{
    self, delete,
    dev::HttpResponseBuilder,
    get,
    http::{header, StatusCode},
    put, web, HttpResponse,
};
use diesel::prelude::*;
use error_chain::error_chain;
use log::error;
use serde::{Deserialize, Serialize};
use std::ops::Deref;
use strsim::damerau_levenshtein;

use crate::database;
use crate::schema::pictos;
use crate::shared::{self, folder::Folderable};

// Error management

error_chain! {
    errors {
        GetDbConnErr {
            description("Impossible de se connecter à la base de données")
            display("Could not get db conn from pool")
        }
        SelectPictosErr {
            description("Impossible de récupérer la liste des pictogrammes")
            display("Could not select pictos")
        }
        SelectPictoTagsErr {
            description("Impossible de récupérer la liste des tags liés aux pictogrammes")
            display("Could not select picto tags")
        }
        InsertPictoErr(id: i32) {
            description("Impossible d'ajouter le pictogramme")
            display("Could not insert picto `{}`", id)
        }
        UpdatePictoErr(id: i32) {
            description("Impossible de modifier le pictogramme")
            display("Could not update picto `{}`", id)
        }
        DeletePictoErr(id: i32) {
            description("Impossible de supprimer le pictogramme")
            display("Could not delete picto `{}`", id)
        }
    }
    links {
        Folder(shared::folder::Error, shared::folder::ErrorKind);
    }
}

impl actix_web::error::ResponseError for Error {
    fn error_response(&self) -> HttpResponse {
        error!("{}", self.to_string());
        HttpResponseBuilder::new(self.status_code())
            .set_header(header::CONTENT_TYPE, "text/plain; charset=utf-8")
            .body(self.description().to_owned())
    }

    fn status_code(&self) -> StatusCode {
        match *self.kind() {
            _ => StatusCode::INTERNAL_SERVER_ERROR,
        }
    }
}

// Models

#[derive(
    Debug, Clone, Identifiable, Queryable, Associations, AsChangeset, Serialize, Deserialize,
)]
#[serde(rename_all = "camelCase")]
pub struct Picto {
    pub id: i32,
    pub folder_id: Option<i32>,
    pub tags: String,
    pub url: String,
}

#[derive(Debug, Clone, Queryable)]
pub struct PictoTags {
    pub tags: String,
}

impl Folderable for Picto {
    fn folder_id(&self) -> Option<i32> {
        self.folder_id
    }
}

#[derive(Insertable)]
#[table_name = "pictos"]
struct InsertablePicto<'a> {
    pub folder_id: Option<&'a i32>,
    pub tags: &'a str,
    pub url: &'a str,
}

// Services

#[derive(Deserialize)]
struct GetPictoQuery {
    search: Option<String>,
}

#[derive(Serialize)]
struct GetPictoResponse<'a> {
    pictos: Vec<&'a Picto>,
    suggestion: Option<String>,
}

#[get("/picto")]
async fn get(
    pool: web::Data<database::Pool>,
    query: web::Query<GetPictoQuery>,
) -> Result<HttpResponse> {
    let conn = pool.get().chain_err(|| ErrorKind::GetDbConnErr)?;

    if let Some(ref pattern) = query.search {
        let pictos = {
            use crate::schema::pictos::dsl::*;
            pictos.load::<Picto>(&conn)
        }
        .chain_err(|| ErrorKind::SelectPictosErr)?;
        let tags: Vec<&str> = pictos.iter().flat_map(|p| p.tags.split(",")).collect();
        let matching_pictos: Vec<_> = pictos
            .iter()
            .filter(|picto| picto.tags.contains(pattern))
            .collect();
        if matching_pictos.is_empty() {
            let (closest_tag, _) = tags.iter().fold(("", 2), |(best_tag, best_score), &tag| {
                let score = damerau_levenshtein(pattern, tag);
                if score < best_score {
                    (tag, score)
                } else {
                    (best_tag, best_score)
                }
            });
            let suggestion = if closest_tag.is_empty() {
                None
            } else {
                Some(closest_tag.to_owned())
            };

            Ok(HttpResponse::Ok().json(GetPictoResponse {
                pictos: Vec::new(),
                suggestion,
            }))
        } else {
            Ok(HttpResponse::Ok().json(GetPictoResponse {
                pictos: matching_pictos,
                suggestion: None,
            }))
        }
    } else {
        let pictos = {
            use crate::schema::pictos::dsl::*;
            pictos.load::<Picto>(&conn)
        }
        .chain_err(|| ErrorKind::SelectPictosErr)?;
        let folder_ids = {
            use crate::schema::folders::dsl::*;
            folders
                .select(id)
                .filter(category.eq("picto"))
                .load::<i32>(&conn)
        }
        .chain_err(|| ErrorKind::SelectPictosErr)?;

        let folders = shared::folder::get_by_ids(&conn, &folder_ids)?;
        let tree = shared::folder::build_tree(&folders, &pictos)?;

        Ok(HttpResponse::Ok().json(tree))
    }
}

#[put("/picto")]
async fn set(pool: web::Data<database::Pool>, picto: web::Json<Picto>) -> Result<HttpResponse> {
    let conn = pool.get().chain_err(|| ErrorKind::GetDbConnErr)?;
    let picto_id = picto.id;

    if picto_id == 0 {
        web::block(move || {
            let new_picto = InsertablePicto {
                folder_id: picto.folder_id.as_ref(),
                tags: &picto.tags,
                url: &picto.url,
            };

            diesel::insert_into(pictos::table)
                .values(&new_picto)
                .execute(&conn)
        })
        .await
        .chain_err(|| ErrorKind::InsertPictoErr(picto_id))
    } else {
        web::block(move || {
            diesel::update(picto.deref())
                .set(picto.deref())
                .execute(&conn)
        })
        .await
        .chain_err(|| ErrorKind::UpdatePictoErr(picto_id))
    }?;

    Ok(HttpResponse::NoContent().finish())
}

#[delete("/picto/{id}")]
async fn del(
    pool: web::Data<database::Pool>,
    web::Path(id): web::Path<i32>,
) -> Result<HttpResponse> {
    use crate::schema::pictos::dsl::pictos;
    let conn = pool.get().chain_err(|| ErrorKind::GetDbConnErr)?;

    web::block(move || diesel::delete(pictos.find(id)).execute(&conn))
        .await
        .chain_err(|| ErrorKind::DeletePictoErr(id))?;

    Ok(HttpResponse::NoContent().finish())
}

pub fn pub_services(cfg: &mut web::ServiceConfig) {
    cfg.service(get);
}

pub fn priv_services(cfg: &mut web::ServiceConfig) {
    cfg.service(set).service(del);
}
