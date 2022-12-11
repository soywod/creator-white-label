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
use crate::schema::badges;

// Error management

error_chain! {
    errors {
        GetDbConnErr {
            description("Impossible de se connecter à la base de données")
            display("Could not get db conn from pool")
        }
        SelectBadgesErr {
            description("Impossible de récupérer la liste des badges")
            display("Could not select badges")
        }
        InsertBadgeErr(id: i32) {
            description("Impossible de créer le badge")
            display("Could not insert badge `{}`", id)
        }
        UpdateBadgeErr(id: i32) {
            description("Impossible de modifier le badge")
            display("Could not update badge `{}`", id)
        }
        DeleteBadgeErr(id: i32) {
            description("Impossible de supprimer le badge")
            display("Could not delete badge `{}`", id)
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
pub struct Badge {
    pub id: i32,
    pub name: String,
    pub icon_url: String,
}

#[derive(Insertable)]
#[table_name = "badges"]
struct InsertableBadge<'a> {
    pub name: &'a str,
    pub icon_url: &'a str,
}

// Services

#[get("/badge")]
async fn get(pool: web::Data<database::Pool>) -> Result<HttpResponse> {
    use crate::schema::badges::dsl::*;
    let conn = pool.get().chain_err(|| ErrorKind::GetDbConnErr)?;

    let all_badges = web::block(move || badges.load::<Badge>(&conn))
        .await
        .chain_err(|| ErrorKind::SelectBadgesErr)?;

    Ok(HttpResponse::Ok().json(all_badges))
}

#[put("/badge")]
async fn set(pool: web::Data<database::Pool>, badge: web::Json<Badge>) -> Result<HttpResponse> {
    let conn = pool.get().chain_err(|| ErrorKind::GetDbConnErr)?;
    let badge_id = badge.id;

    if badge_id == 0 {
        web::block(move || {
            let new_badge = InsertableBadge {
                name: &badge.name,
                icon_url: &badge.icon_url,
            };

            diesel::insert_into(badges::table)
                .values(&new_badge)
                .execute(&conn)
        })
        .await
        .chain_err(|| ErrorKind::InsertBadgeErr(badge_id))
    } else {
        web::block(move || {
            diesel::update(badge.deref())
                .set(badge.deref())
                .execute(&conn)
        })
        .await
        .chain_err(|| ErrorKind::UpdateBadgeErr(badge_id))
    }?;

    Ok(HttpResponse::NoContent().finish())
}

#[delete("/badge/{id}")]
async fn del(
    pool: web::Data<database::Pool>,
    web::Path(id): web::Path<i32>,
) -> Result<HttpResponse> {
    use crate::schema::badges::dsl::badges;
    let conn = pool.get().chain_err(|| ErrorKind::GetDbConnErr)?;

    web::block(move || diesel::delete(badges.find(id)).execute(&conn))
        .await
        .chain_err(|| ErrorKind::DeleteBadgeErr(id))?;

    Ok(HttpResponse::NoContent().finish())
}

pub fn pub_services(cfg: &mut web::ServiceConfig) {
    cfg.service(get);
}

pub fn priv_services(cfg: &mut web::ServiceConfig) {
    cfg.service(set).service(del);
}
