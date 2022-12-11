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
use std::fs;

use crate::database;
use crate::schema::templates;
use crate::shared::upload::dir;
use crate::shared::{self, folder::Folderable};

// Error management

error_chain! {
    errors {
        GetDbConnErr {
            description("Impossible de se connecter à la base de données")
            display("Could not get db conn from pool")
        }
        SelectTemplatesErr {
            description("Impossible de récupérer la liste des templates")
            display("Could not select templates")
        }
        FindTemplateErr(id: i32) {
            description("Impossible de récupérer le template")
            display("Could not find template `{}`", id)
        }
        InsertTemplateErr(id: i32) {
            description("Impossible d'ajouter le template")
            display("Could not insert template `{}`", id)
        }
        UpdateTemplateErr(id: i32) {
            description("Impossible de modifier le template")
            display("Could not update template `{}`", id)
        }
        ReadTemplateConfigErr {
            description("Impossible de lire la config liée au template")
            display("Could not read template config")
        }
        DeleteTemplateErr(id: i32) {
            description("Impossible de supprimer le template")
            display("Could not delete template `{}`", id)
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
pub struct Template {
    pub id: i32,
    pub folder_id: Option<i32>,
    pub name: String,
    pub tags: String,
    pub preview_url: Option<String>,
    pub config: Option<String>,
}

impl Folderable for Template {
    fn folder_id(&self) -> Option<i32> {
        self.folder_id
    }
}

#[derive(Insertable)]
#[table_name = "templates"]
struct InsertableTemplate<'a> {
    pub folder_id: Option<&'a i32>,
    pub name: &'a str,
    pub tags: &'a str,
    pub preview_url: Option<&'a String>,
    pub config: Option<&'a String>,
}

// Services

#[get("/template")]
async fn get_all(pool: web::Data<database::Pool>) -> Result<HttpResponse> {
    let conn = pool.get().chain_err(|| ErrorKind::GetDbConnErr)?;

    let templates = {
        use crate::schema::templates::dsl::*;
        templates.order_by(name).load::<Template>(&conn)
    }
    .chain_err(|| ErrorKind::SelectTemplatesErr)?;

    Ok(HttpResponse::Ok().json(templates))
}

#[get("/folded-template")]
async fn get_folded(pool: web::Data<database::Pool>) -> Result<HttpResponse> {
    let conn = pool.get().chain_err(|| ErrorKind::GetDbConnErr)?;

    let templates = {
        use crate::schema::templates::dsl::*;
        templates.load::<Template>(&conn)
    }
    .chain_err(|| ErrorKind::SelectTemplatesErr)?;

    let folder_ids = {
        use crate::schema::folders::dsl::*;
        folders
            .select(id)
            .filter(category.eq("template"))
            .load::<i32>(&conn)
    }
    .chain_err(|| ErrorKind::SelectTemplatesErr)?;

    let folders = shared::folder::get_by_ids(&conn, &folder_ids)?;
    let tree = shared::folder::build_tree(&folders, &templates)?;

    Ok(HttpResponse::Ok().json(tree))
}

#[get("/template/{id}")]
async fn get(pool: web::Data<database::Pool>, template_id: web::Path<i32>) -> Result<HttpResponse> {
    let conn = pool.get().chain_err(|| ErrorKind::GetDbConnErr)?;
    let template_id = template_id.into_inner();

    let template = if template_id == 0 {
        Template {
            id: 0,
            folder_id: None,
            name: String::new(),
            tags: String::new(),
            preview_url: None,
            config: None,
        }
    } else {
        use crate::schema::templates::dsl;
        dsl::templates
            .filter(dsl::id.eq(template_id))
            .first::<Template>(&conn)
            .chain_err(|| ErrorKind::FindTemplateErr(template_id))?
    };

    Ok(HttpResponse::Ok().json(template))
}

#[put("/template")]
async fn set(
    pool: web::Data<database::Pool>,
    template: web::Json<Template>,
) -> Result<HttpResponse> {
    let conn = pool.get().chain_err(|| ErrorKind::GetDbConnErr)?;
    let template_id = template.id;

    if template_id == 0 {
        let config = String::from("{}");
        web::block(move || {
            let new_template = InsertableTemplate {
                folder_id: template.folder_id.as_ref(),
                name: &template.name,
                tags: &template.tags,
                config: Some(&config),
                preview_url: template.preview_url.as_ref(),
            };

            diesel::insert_into(templates::table)
                .values(&new_template)
                .execute(&conn)
        })
        .await
        .chain_err(|| ErrorKind::InsertTemplateErr(template_id))
    } else {
        let config = match template.config.as_ref().map(|name| dir().join(name)) {
            Some(path) => {
                fs::read_to_string(path).chain_err(|| ErrorKind::ReadTemplateConfigErr)?
            }
            None => String::from("{}"),
        };

        web::block(move || {
            let next_template = Template {
                id: template.id,
                folder_id: template.folder_id,
                name: template.name.to_owned(),
                tags: template.tags.to_owned(),
                config: Some(config),
                preview_url: template.preview_url.to_owned(),
            };

            diesel::update(&next_template)
                .set(&next_template)
                .execute(&conn)
        })
        .await
        .chain_err(|| ErrorKind::UpdateTemplateErr(template_id))
    }?;

    Ok(HttpResponse::NoContent().finish())
}

#[delete("/template/{id}")]
async fn del(
    pool: web::Data<database::Pool>,
    web::Path(id): web::Path<i32>,
) -> Result<HttpResponse> {
    use crate::schema::templates::dsl::templates;
    let conn = pool.get().chain_err(|| ErrorKind::GetDbConnErr)?;

    web::block(move || diesel::delete(templates.find(id)).execute(&conn))
        .await
        .chain_err(|| ErrorKind::DeleteTemplateErr(id))?;

    Ok(HttpResponse::NoContent().finish())
}

pub fn pub_services(cfg: &mut web::ServiceConfig) {
    cfg.service(get_all).service(get);
}

pub fn priv_services(cfg: &mut web::ServiceConfig) {
    cfg.service(get_folded).service(set).service(del);
}
