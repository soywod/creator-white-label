use crate::material::Material;
use std::ops::Deref;

use actix_web::{
    self,
    dev::HttpResponseBuilder,
    get,
    http::{header, StatusCode},
    web, HttpResponse,
};
use error_chain::error_chain;
use log::error;
use serde::{Deserialize, Serialize};

use crate::{
    database, discount,
    fixation::{self, Fixation},
    fixation_condition::FixationCondition,
    material,
};

// Error management

error_chain! {
    links {
        Product(material::Error, material::ErrorKind);
        Fixation(fixation::Error, fixation::ErrorKind);
        Discount(discount::Error, discount::ErrorKind);
    }
    errors {
        GetDbConnErr {
            description("Impossible de se connecter à la base de données")
            display("Could not get db conn from pool")
        }
        SelectOrdersErr {
            description("Impossible de récupérer la liste des matériaux")
            display("Could not select orders")
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

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Order {
    #[serde(default)]
    pub material_id: i32,
    #[serde(default)]
    pub fixation_id: i32,
    #[serde(default)]
    pub shape_id: i32,
    #[serde(default)]
    pub quantity: i16,
    #[serde(default)]
    pub width: f32,
    #[serde(default)]
    pub height: f32,
}

#[derive(Debug, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OrderPrice {
    pub weight: f32,
    pub discount: i16,
    pub total_tax_excl: f32,
    pub total_tax_incl: f32,
    pub unit_price_tax_excl_discounted: f32,
    pub total_tax_excl_discounted: f32,
    pub total_tax_incl_discounted: f32,
    pub product: Material,
    pub fixation: Option<Fixation>,
    pub condition: Option<FixationCondition>,
}

// Services

#[get("/order")]
async fn get(pool: web::Data<database::Pool>, order: web::Query<Order>) -> Result<HttpResponse> {
    let conn = pool.get().chain_err(|| ErrorKind::GetDbConnErr)?;
    let area = order.width * order.height;
    let fixation = fixation::find_by_id(&conn, order.fixation_id)?;
    let discount = discount::find_by_quantity(&conn, order.quantity)?;
    let discount_percent = discount.map(|d| d.amount).unwrap_or_default();
    let discount_factor = ((100 - discount_percent) as f32) / 100.0;
    let condition = if order.fixation_id == 0 {
        None
    } else {
        if order.width <= 10.0 || order.height <= 10.0 {
            fixation::first_min_condition(&conn, order.deref())?
        } else {
            fixation::find_condition_by_area(&conn, order.deref(), area as i32)?
        }
    };
    let fixations_price = (condition
        .as_ref()
        .map(fixation::count_pos)
        .unwrap_or_default() as f32)
        * fixation.as_ref().map(|f| f.price).unwrap_or_default();
    if let Some(product) = material::find_by_id(&conn, order.material_id)? {
        let weight = product.weight * (order.width as f32) * (order.height as f32) * 0.00001;
        let area_price = (area as f32) * 0.000001 * product.surface_price;
        let unit_price_tax_excl = product.fixed_price + area_price + fixations_price;
        let total_tax_excl = (order.quantity as f32) * unit_price_tax_excl;
        let total_tax_incl = total_tax_excl * 1.2;
        let unit_price_tax_excl_discounted = unit_price_tax_excl * discount_factor;
        let total_tax_excl_discounted = total_tax_excl * discount_factor;
        let total_tax_incl_discounted = total_tax_incl * discount_factor;
        Ok(HttpResponse::Ok().json(OrderPrice {
            weight,
            discount: discount_percent,
            total_tax_excl,
            total_tax_incl,
            unit_price_tax_excl_discounted,
            total_tax_excl_discounted,
            total_tax_incl_discounted,
            product,
            fixation,
            condition,
        }))
    } else {
        Ok(HttpResponse::Ok().json(OrderPrice::default()))
    }
}

pub fn services(cfg: &mut web::ServiceConfig) {
    cfg.service(get);
}
