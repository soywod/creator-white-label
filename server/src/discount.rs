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
use crate::schema::discounts;

// Error management

error_chain! {
    errors {
        GetDbConnErr {
            description("Impossible de se connecter à la base de données")
            display("Could not get db conn from pool")
        }
        SelectDiscountsErr {
            description("Impossible de récupérer la liste des remises")
            display("Could not select discounts")
        }
        InsertDiscountErr(id: i32) {
            description("Impossible de créer la remise")
            display("Could not insert discount `{}`", id)
        }
        UpdateDiscountErr(id: i32) {
            description("Impossible de modifier la remise")
            display("Could not update discount `{}`", id)
        }
        DeleteDiscountErr(id: i32) {
            description("Impossible de supprimer la remise")
            display("Could not delete discount `{}`", id)
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

#[derive(
    Debug, Clone, Identifiable, Queryable, Associations, AsChangeset, Serialize, Deserialize,
)]
#[serde(rename_all = "camelCase")]
pub struct Discount {
    pub id: i32,
    pub amount: i16,
    pub quantity: i16,
}

#[derive(Insertable)]
#[table_name = "discounts"]
struct InsertableDiscount<'a> {
    pub amount: &'a i16,
    pub quantity: &'a i16,
}

// Helpers

pub fn find_by_quantity(
    conn: &database::PooledConnection,
    quantity: i16,
) -> Result<Option<Discount>> {
    Ok(get_all(&conn)?
        .iter()
        .fold(None as Option<&Discount>, |matching_discount, curr_discount| {
            let matching_quantity = matching_discount.map(|d| d.quantity).unwrap_or_default();
            if curr_discount.quantity > matching_quantity && curr_discount.quantity <= quantity {
                Some(curr_discount)
            } else {
                matching_discount
            }
        })
        .cloned())
}

pub fn get_all(conn: &database::PooledConnection) -> Result<Vec<Discount>> {
    use crate::schema::discounts::dsl::*;
    let all_discounts = discounts
        .load::<Discount>(conn)
        .chain_err(|| ErrorKind::SelectDiscountsErr)?;
    Ok(all_discounts)
}

// Services

#[get("/discount")]
async fn get(pool: web::Data<database::Pool>) -> Result<HttpResponse> {
    let conn = pool.get().chain_err(|| ErrorKind::GetDbConnErr)?;
    let all_discounts = get_all(&conn)?;
    Ok(HttpResponse::Ok().json(all_discounts))
}

#[put("/discount")]
async fn set(
    pool: web::Data<database::Pool>,
    discount: web::Json<Discount>,
) -> Result<HttpResponse> {
    let conn = pool.get().chain_err(|| ErrorKind::GetDbConnErr)?;
    let discount_id = discount.id;

    if discount_id == 0 {
        web::block(move || {
            let new_discount = InsertableDiscount {
                amount: &discount.amount,
                quantity: &discount.quantity,
            };

            diesel::insert_into(discounts::table)
                .values(&new_discount)
                .execute(&conn)
        })
        .await
        .chain_err(|| ErrorKind::InsertDiscountErr(discount_id))
    } else {
        web::block(move || {
            diesel::update(discount.deref())
                .set(discount.deref())
                .execute(&conn)
        })
        .await
        .chain_err(|| ErrorKind::UpdateDiscountErr(discount_id))
    }?;

    Ok(HttpResponse::NoContent().finish())
}

#[delete("/discount/{id}")]
async fn del(
    pool: web::Data<database::Pool>,
    web::Path(id): web::Path<i32>,
) -> Result<HttpResponse> {
    use crate::schema::discounts::dsl::discounts;
    let conn = pool.get().chain_err(|| ErrorKind::GetDbConnErr)?;

    web::block(move || diesel::delete(discounts.find(id)).execute(&conn))
        .await
        .chain_err(|| ErrorKind::DeleteDiscountErr(id))?;

    Ok(HttpResponse::NoContent().finish())
}

pub fn pub_services(cfg: &mut web::ServiceConfig) {
    cfg.service(get);
}

pub fn priv_services(cfg: &mut web::ServiceConfig) {
    cfg.service(set).service(del);
}
