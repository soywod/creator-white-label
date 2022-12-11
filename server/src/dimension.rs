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
use crate::schema::dimensions;

// Error management

error_chain! {
    errors {
        GetDbConnErr {
            description("Impossible de se connecter à la base de données")
            display("Could not get db conn from pool")
        }
        SelectDimensionsErr {
            description("Impossible de récupérer la liste des dimensions")
            display("Could not select dimensions")
        }
        InsertDimensionErr(id: i32) {
            description("Impossible de créer les dimensions")
            display("Could not insert dimension `{}`", id)
        }
        UpdateDimensionErr(id: i32) {
            description("Impossible de modifier les dimensions")
            display("Could not update dimension `{}`", id)
        }
        DeleteDimensionErr(id: i32) {
            description("Impossible de supprimer les dimensions")
            display("Could not delete dimension `{}`", id)
        }
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

#[derive(Identifiable, Queryable, Associations, AsChangeset, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Dimension {
    pub id: i32,
    pub name: String,
    pub width: f32,
    pub height: f32,
    pub pos: i32,
}

#[derive(Insertable)]
#[table_name = "dimensions"]
struct InsertableDimension<'a> {
    pub name: &'a str,
    pub width: &'a f32,
    pub height: &'a f32,
    pub pos: &'a i32,
}

// Services

#[get("/dimension")]
async fn get(pool: web::Data<database::Pool>) -> Result<HttpResponse> {
    use crate::schema::dimensions::dsl;
    let conn = pool.get().chain_err(|| ErrorKind::GetDbConnErr)?;

    let all_dimensions =
        web::block(move || dsl::dimensions.order(dsl::pos).load::<Dimension>(&conn))
            .await
            .chain_err(|| ErrorKind::SelectDimensionsErr)?;

    Ok(HttpResponse::Ok().json(all_dimensions))
}

#[put("/dimension")]
async fn set(
    pool: web::Data<database::Pool>,
    dimension: web::Json<Dimension>,
) -> Result<HttpResponse> {
    let conn = pool.get().chain_err(|| ErrorKind::GetDbConnErr)?;
    let dimension_id = dimension.id;

    if dimension_id == 0 {
        web::block(move || {
            let new_dimension = InsertableDimension {
                pos: &dimension.pos,
                name: &dimension.name,
                width: &dimension.width,
                height: &dimension.height,
            };

            diesel::insert_into(dimensions::table)
                .values(&new_dimension)
                .execute(&conn)
        })
        .await
        .chain_err(|| ErrorKind::InsertDimensionErr(dimension_id))
    } else {
        web::block(move || {
            diesel::update(dimension.deref())
                .set(dimension.deref())
                .execute(&conn)
        })
        .await
        .chain_err(|| ErrorKind::UpdateDimensionErr(dimension_id))
    }?;

    Ok(HttpResponse::NoContent().finish())
}

#[delete("/dimension/{id}")]
async fn del(
    pool: web::Data<database::Pool>,
    web::Path(id): web::Path<i32>,
) -> Result<HttpResponse> {
    use crate::schema::dimensions::dsl::dimensions;
    let conn = pool.get().chain_err(|| ErrorKind::GetDbConnErr)?;

    web::block(move || diesel::delete(dimensions.find(id)).execute(&conn))
        .await
        .chain_err(|| ErrorKind::DeleteDimensionErr(id))?;

    Ok(HttpResponse::NoContent().finish())
}

pub fn pub_services(cfg: &mut web::ServiceConfig) {
    cfg.service(get);
}

pub fn priv_services(cfg: &mut web::ServiceConfig) {
    cfg.service(set).service(del);
}
