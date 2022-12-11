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

use crate::{
    database,
    fixation_condition::{self, FixationCondition},
    order::Order,
    schema::fixations,
    shape::Shape,
};

// Error management

error_chain! {
    errors {
        GetDbConnErr {
            description("Impossible de se connecter à la base de données")
            display("Could not get db conn from pool")
        }
        SelectFixationsErr {
            description("Impossible de récupérer la liste des fixations")
            display("Could not select fixations")
        }
        FindFixationErr(id: i32) {
            description("Impossible de récupérer la fixation")
            display("Could not find fixation `{}`", id)
        }
        SelectShapeIdsErr {
            description("Impossible de récupérer la liste des formes")
            display("Could not select shape ids")
        }
        InsertFixationErr {
            description("Impossible de créer la fixation")
            display("Could not insert fixation")
        }
        UpdateFixationErr(id: i32) {
            description("Impossible de modifier la fixation")
            display("Could not update fixation `{}`", id)
        }
        DeleteFixationErr(id: i32) {
            description("Impossible de supprimer la fixation")
            display("Could not delete fixation `{}`", id)
        }
    }
    links {
        FixationCondition(fixation_condition::Error, fixation_condition::ErrorKind);
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

#[derive(Debug, Default, Identifiable, Queryable, Associations, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Fixation {
    pub id: i32,
    pub name: String,
    pub preview_url: String,
    pub icon_url: String,
    pub video_url: Option<String>,
    pub price: f32,
    pub diameter: f32,
    pub drill_diameter: f32,
}

#[derive(Insertable)]
#[table_name = "fixations"]
struct InsertableFixation<'f> {
    pub name: &'f str,
    pub preview_url: &'f str,
    pub icon_url: &'f str,
    pub video_url: Option<&'f String>,
    pub price: &'f f32,
    pub diameter: &'f f32,
    pub drill_diameter: &'f f32,
}

#[derive(Identifiable, AsChangeset)]
#[table_name = "fixations"]
struct UpdatableFixation<'f> {
    pub id: &'f i32,
    pub name: &'f str,
    pub preview_url: &'f str,
    pub icon_url: &'f str,
    pub video_url: Option<&'f String>,
    pub price: &'f f32,
    pub diameter: &'f f32,
    pub drill_diameter: &'f f32,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct GetFixationResponse {
    fixation: Fixation,
    conditions: Vec<FixationCondition>,
    shapes: Vec<Shape>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SetFixationRequest {
    pub id: i32,
    pub name: String,
    pub preview_url: String,
    pub icon_url: String,
    pub video_url: Option<String>,
    pub price: f32,
    pub diameter: f32,
    pub drill_diameter: f32,
    #[serde(default)]
    pub conditions: Vec<FixationCondition>,
}

// Services

#[get("/fixation")]
async fn get_all(pool: web::Data<database::Pool>) -> Result<HttpResponse> {
    use crate::schema::fixations::dsl::*;
    let conn = pool.get().chain_err(|| ErrorKind::GetDbConnErr)?;

    let all_fixations = web::block(move || fixations.load::<Fixation>(&conn))
        .await
        .chain_err(|| ErrorKind::SelectFixationsErr)?;

    Ok(HttpResponse::Ok().json(all_fixations))
}

#[get("/fixation/{id}")]
async fn get(pool: web::Data<database::Pool>, fixation_id: web::Path<i32>) -> Result<HttpResponse> {
    let conn = pool.get().chain_err(|| ErrorKind::GetDbConnErr)?;
    let fixation_id = fixation_id.into_inner();

    let fixation = if fixation_id == 0 {
        Fixation::default()
    } else {
        use crate::schema::fixations::dsl;
        dsl::fixations
            .filter(dsl::id.eq(fixation_id))
            .first::<Fixation>(&conn)
            .chain_err(|| ErrorKind::FindFixationErr(fixation_id))?
    };

    Ok(HttpResponse::Ok().json(fixation))
}

#[get("/fixation/{id}/conditions")]
async fn get_conditions(
    pool: web::Data<database::Pool>,
    fixation_id: web::Path<i32>,
) -> Result<HttpResponse> {
    let conn = pool.get().chain_err(|| ErrorKind::GetDbConnErr)?;
    let fixation_id = fixation_id.into_inner();

    let fixation = if fixation_id == 0 {
        Fixation {
            id: 0,
            name: String::new(),
            preview_url: String::new(),
            icon_url: String::new(),
            video_url: None,
            price: 0.0,
            diameter: 0.0,
            drill_diameter: 0.0,
        }
    } else {
        use crate::schema::fixations::dsl;
        dsl::fixations
            .filter(dsl::id.eq(fixation_id))
            .first::<Fixation>(&conn)
            .chain_err(|| ErrorKind::FindFixationErr(fixation_id))?
    };

    let conditions = if fixation_id == 0 {
        Vec::new()
    } else {
        fixation_condition::get(&conn, fixation_id)?
    };

    let shapes = {
        use crate::schema::shapes::dsl;
        dsl::shapes.load::<Shape>(&conn)
    }
    .chain_err(|| ErrorKind::SelectShapeIdsErr)?;

    Ok(HttpResponse::Ok().json(GetFixationResponse {
        fixation,
        conditions,
        shapes,
    }))
}

#[put("/fixation")]
async fn set(
    pool: web::Data<database::Pool>,
    fixation: web::Json<SetFixationRequest>,
) -> Result<HttpResponse> {
    let conn = pool.get().chain_err(|| ErrorKind::GetDbConnErr)?;
    let mut fixation_id = fixation.id;

    if fixation_id == 0 {
        let new_fixation = InsertableFixation {
            name: &fixation.name,
            preview_url: &fixation.preview_url,
            icon_url: &fixation.icon_url,
            video_url: fixation.video_url.as_ref(),
            price: &fixation.price,
            diameter: &fixation.diameter,
            drill_diameter: &fixation.drill_diameter,
        };

        fixation_id = diesel::insert_into(fixations::table)
            .values(&new_fixation)
            .get_result::<Fixation>(&conn)
            .chain_err(|| ErrorKind::InsertFixationErr)?
            .id;
    } else {
        fixation_condition::del(&conn, fixation_id)?;

        let next_fixation = UpdatableFixation {
            id: &fixation.id,
            name: &fixation.name,
            preview_url: &fixation.preview_url,
            icon_url: &fixation.icon_url,
            video_url: fixation.video_url.as_ref(),
            price: &fixation.price,
            diameter: &fixation.diameter,
            drill_diameter: &fixation.drill_diameter,
        };

        diesel::update(&next_fixation)
            .set(&next_fixation)
            .execute(&conn)
            .chain_err(|| ErrorKind::UpdateFixationErr(fixation_id))?;
    };

    fixation_condition::set(&conn, fixation_id, &fixation.conditions)?;

    Ok(HttpResponse::NoContent().finish())
}

#[delete("/fixation/{id}")]
async fn del(
    pool: web::Data<database::Pool>,
    web::Path(id): web::Path<i32>,
) -> Result<HttpResponse> {
    use crate::schema::fixations::dsl::fixations;
    let conn = pool.get().chain_err(|| ErrorKind::GetDbConnErr)?;

    web::block(move || diesel::delete(fixations.find(id)).execute(&conn))
        .await
        .chain_err(|| ErrorKind::DeleteFixationErr(id))?;

    Ok(HttpResponse::NoContent().finish())
}

pub fn pub_services(cfg: &mut web::ServiceConfig) {
    cfg.service(get_all).service(get_conditions).service(get);
}

pub fn priv_services(cfg: &mut web::ServiceConfig) {
    cfg.service(set).service(del);
}

// Helpers

pub fn find_by_id(conn: &database::PooledConnection, id: i32) -> Result<Option<Fixation>> {
    if id == 0 {
        return Ok(None);
    }

    let fixation = {
        use crate::schema::fixations::dsl::fixations;
        fixations.find(id).first::<Fixation>(conn)
    }
    .chain_err(|| ErrorKind::FindFixationErr(id))?;

    Ok(Some(fixation))
}

pub fn count_pos(cond: &FixationCondition) -> i32 {
    let mut count = 0;

    if let Some(true) = cond.pos_tl {
        count += 1
    };
    if let Some(true) = cond.pos_tc {
        count += 1
    };
    if let Some(true) = cond.pos_tr {
        count += 1
    };
    if let Some(true) = cond.pos_cl {
        count += 1
    };
    if let Some(true) = cond.pos_cr {
        count += 1
    };
    if let Some(true) = cond.pos_bl {
        count += 1
    };
    if let Some(true) = cond.pos_bc {
        count += 1
    };
    if let Some(true) = cond.pos_bc {
        count += 1
    };

    count
}

pub fn first_min_condition(
    conn: &database::PooledConnection,
    order: &Order,
) -> Result<Option<FixationCondition>> {
    if order.fixation_id == 0 {
        return Ok(None);
    }

    if order.shape_id == 0 {
        return Ok(None);
    }

    let condition = {
        use crate::schema::fixation_conditions::dsl::{
            area_min, fixation_conditions, fixation_id, shape_id,
        };
        fixation_conditions
            .filter(fixation_id.eq(order.fixation_id))
            .filter(shape_id.eq(order.shape_id))
            .order(area_min)
            .first::<FixationCondition>(conn)
            .optional()
    }
    .chain_err(|| ErrorKind::FindFixationErr(order.fixation_id))?;

    Ok(condition)
}

pub(crate) fn find_condition_by_area(
    conn: &database::PooledConnection,
    order: &Order,
    area: i32,
) -> Result<Option<FixationCondition>> {
    if order.fixation_id == 0 {
        return Ok(None);
    }

    if order.shape_id == 0 {
        return Ok(None);
    }

    let condition = {
        use crate::schema::fixation_conditions::dsl::{
            area_max, area_min, fixation_conditions, fixation_id, shape_id,
        };
        fixation_conditions
            .filter(fixation_id.eq(order.fixation_id))
            .filter(shape_id.eq(order.shape_id))
            .filter(
                area_min
                    .eq(0)
                    .and(area_max.eq(0))
                    .or(area_min.eq(0).and(area_max.ge(area)))
                    .or(area_min.gt(area).and(area_max.le(area)))
                    .or(area_min.lt(area).and(area_max.eq(0))),
            )
            .order(area_min)
            .first::<FixationCondition>(conn)
            .optional()
    }
    .chain_err(|| ErrorKind::FindFixationErr(order.fixation_id))?;

    Ok(condition)
}
