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

use crate::database;
use crate::schema::shapes;
use crate::shared::{self, folder::Folderable};

// Error management

error_chain! {
    errors {
        GetDbConnErr {
            description("Impossible de se connecter à la base de données")
            display("Could not get db conn from pool")
        }
        SelectShapesErr {
            description("Impossible de récupérer la liste des formes")
            display("Could not select shapes")
        }
        FindShapeErr(id: i32) {
            description("Impossible de récupérer la forme")
            display("Could not find shape `{}`", id)
        }
        InsertShapeErr(id: i32) {
            description("Impossible d'ajouter la forme")
            display("Could not insert shape `{}`", id)
        }
        UpdateShapeErr(id: i32) {
            description("Impossible de modifier la forme")
            display("Could not update shape `{}`", id)
        }
        DeleteShapeErr(id: i32) {
            description("Impossible de supprimer le shapegramme")
            display("Could not delete shape `{}`", id)
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
    Debug,
    Default,
    Clone,
    Identifiable,
    Queryable,
    Associations,
    AsChangeset,
    Serialize,
    Deserialize,
)]
#[serde(rename_all = "camelCase")]
pub struct Shape {
    pub id: i32,
    pub folder_id: Option<i32>,
    pub tags: String,
    pub url: String,
}

impl Folderable for Shape {
    fn folder_id(&self) -> Option<i32> {
        self.folder_id
    }
}

#[derive(Insertable)]
#[table_name = "shapes"]
struct InsertableShape<'a> {
    pub folder_id: Option<&'a i32>,
    pub tags: &'a str,
    pub url: &'a str,
}

// Services

#[get("/shape")]
async fn get_all(pool: web::Data<database::Pool>) -> Result<HttpResponse> {
    let conn = pool.get().chain_err(|| ErrorKind::GetDbConnErr)?;

    let shapes = {
        use crate::schema::shapes::dsl::*;
        shapes.load::<Shape>(&conn)
    }
    .chain_err(|| ErrorKind::SelectShapesErr)?;

    Ok(HttpResponse::Ok().json(shapes))
}

#[get("/shape/{id}")]
async fn get(pool: web::Data<database::Pool>, shape_id: web::Path<i32>) -> Result<HttpResponse> {
    let conn = pool.get().chain_err(|| ErrorKind::GetDbConnErr)?;
    let shape_id = shape_id.into_inner();

    let shape = if shape_id == 0 {
        Shape::default()
    } else {
        use crate::schema::shapes::dsl;
        dsl::shapes
            .filter(dsl::id.eq(shape_id))
            .first::<Shape>(&conn)
            .chain_err(|| ErrorKind::FindShapeErr(shape_id))?
    };

    Ok(HttpResponse::Ok().json(shape))
}

#[get("/folded-shape")]
async fn get_folded(pool: web::Data<database::Pool>) -> Result<HttpResponse> {
    let conn = pool.get().chain_err(|| ErrorKind::GetDbConnErr)?;

    let shapes = {
        use crate::schema::shapes::dsl::*;
        shapes.load::<Shape>(&conn)
    }
    .chain_err(|| ErrorKind::SelectShapesErr)?;

    let folder_ids = {
        use crate::schema::folders::dsl::*;
        folders
            .select(id)
            .filter(category.eq("shape"))
            .load::<i32>(&conn)
    }
    .chain_err(|| ErrorKind::SelectShapesErr)?;

    let folders = shared::folder::get_by_ids(&conn, &folder_ids)?;
    let tree = shared::folder::build_tree(&folders, &shapes)?;

    Ok(HttpResponse::Ok().json(tree))
}

#[put("/shape")]
async fn set(pool: web::Data<database::Pool>, shape: web::Json<Shape>) -> Result<HttpResponse> {
    let conn = pool.get().chain_err(|| ErrorKind::GetDbConnErr)?;
    let shape_id = shape.id;

    if shape_id == 0 {
        web::block(move || {
            let new_shape = InsertableShape {
                folder_id: shape.folder_id.as_ref(),
                tags: &shape.tags,
                url: &shape.url,
            };

            diesel::insert_into(shapes::table)
                .values(&new_shape)
                .execute(&conn)
        })
        .await
        .chain_err(|| ErrorKind::InsertShapeErr(shape_id))
    } else {
        web::block(move || {
            diesel::update(shape.deref())
                .set(shape.deref())
                .execute(&conn)
        })
        .await
        .chain_err(|| ErrorKind::UpdateShapeErr(shape_id))
    }?;

    Ok(HttpResponse::NoContent().finish())
}

#[delete("/shape/{id}")]
async fn del(
    pool: web::Data<database::Pool>,
    web::Path(id): web::Path<i32>,
) -> Result<HttpResponse> {
    use crate::schema::shapes::dsl::shapes;
    let conn = pool.get().chain_err(|| ErrorKind::GetDbConnErr)?;

    web::block(move || diesel::delete(shapes.find(id)).execute(&conn))
        .await
        .chain_err(|| ErrorKind::DeleteShapeErr(id))?;

    Ok(HttpResponse::NoContent().finish())
}

pub fn pub_services(cfg: &mut web::ServiceConfig) {
    cfg.service(get_all).service(get);
}

pub fn priv_services(cfg: &mut web::ServiceConfig) {
    cfg.service(get_folded).service(set).service(del);
}
