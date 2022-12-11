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
use crate::schema::fonts;

// Error management

error_chain! {
    errors {
        GetDbConnErr {
            description("Impossible de se connecter à la base de données")
            display("Could not get db conn from pool")
        }
        SelectFontsErr {
            description("Impossible de récupérer la liste des polices")
            display("Could not select fonts")
        }
        InsertFontErr(id: i32) {
            description("Impossible de créer la police")
            display("Could not insert font `{}`", id)
        }
        UpdateFontErr(id: i32) {
            description("Impossible de modifier la police")
            display("Could not update font `{}`", id)
        }
        DeleteFontErr(id: i32) {
            description("Impossible de supprimer la police")
            display("Could not delete font `{}`", id)
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
pub struct Font {
    pub id: i32,
    pub name: String,
    pub url: String,
}

#[derive(Insertable)]
#[table_name = "fonts"]
struct InsertableFont<'a> {
    pub name: &'a str,
    pub url: &'a str,
}

// Services

#[get("/font")]
async fn get(pool: web::Data<database::Pool>) -> Result<HttpResponse> {
    use crate::schema::fonts::dsl::*;
    let conn = pool.get().chain_err(|| ErrorKind::GetDbConnErr)?;

    let all_fonts = web::block(move || fonts.load::<Font>(&conn))
        .await
        .chain_err(|| ErrorKind::SelectFontsErr)?;

    Ok(HttpResponse::Ok().json(all_fonts))
}

#[put("/font")]
async fn set(pool: web::Data<database::Pool>, font: web::Json<Font>) -> Result<HttpResponse> {
    let conn = pool.get().chain_err(|| ErrorKind::GetDbConnErr)?;
    let font_id = font.id;

    if font_id == 0 {
        web::block(move || {
            let new_font = InsertableFont {
                name: &font.name,
                url: &font.url,
            };

            diesel::insert_into(fonts::table)
                .values(&new_font)
                .execute(&conn)
        })
        .await
        .chain_err(|| ErrorKind::InsertFontErr(font_id))
    } else {
        web::block(move || {
            diesel::update(font.deref())
                .set(font.deref())
                .execute(&conn)
        })
        .await
        .chain_err(|| ErrorKind::UpdateFontErr(font_id))
    }?;

    Ok(HttpResponse::NoContent().finish())
}

#[delete("/font/{id}")]
async fn del(
    pool: web::Data<database::Pool>,
    web::Path(id): web::Path<i32>,
) -> Result<HttpResponse> {
    use crate::schema::fonts::dsl::fonts;
    let conn = pool.get().chain_err(|| ErrorKind::GetDbConnErr)?;

    web::block(move || diesel::delete(fonts.find(id)).execute(&conn))
        .await
        .chain_err(|| ErrorKind::DeleteFontErr(id))?;

    Ok(HttpResponse::NoContent().finish())
}

pub fn services(cfg: &mut web::ServiceConfig) {
    cfg.service(get).service(set).service(del);
}
