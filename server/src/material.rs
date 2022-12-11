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

use crate::badge::Badge;
use crate::database;
use crate::dimension::Dimension;
use crate::discount::Discount;
use crate::fixation::Fixation;
use crate::schema::{
    material_badges, material_dimensions, material_discounts, material_fixations, material_shapes,
    materials,
};
use crate::shape::Shape;

// Error management

error_chain! {
    errors {
        GetDbConnErr {
            description("Impossible de se connecter à la base de données")
            display("Could not get db conn from pool")
        }
        FindMaterialErr(id: i32) {
            description("Impossible de récupérer le produit")
            display("Could not find product `{}`", id)
        }
        SelectMaterialsErr {
            description("Impossible de récupérer la liste des matériaux")
            display("Could not select materials")
        }
        InsertMaterialErr(id: i32) {
            description("Impossible de créer le matériau")
            display("Could not insert material `{}`", id)
        }
        UpdateMaterialErr(id: i32) {
            description("Impossible de modifier le matériau")
            display("Could not update material `{}`", id)
        }
        DeleteMaterialErr(id: i32) {
            description("Impossible de supprimer le matériau")
            display("Could not delete material `{}`", id)
        }
        SelectMaterialDimensionsErr {
            description("Impossible de récupérer la liste des dimensions rattachées aux matériaux")
            display("Could not select material_dimensions")
        }
        InsertMaterialDimensionsErr(id: i32) {
            description("Impossible de rattacher les dimensions au matériau")
            display("Could not insert material_dimensions `{}`", id)
        }
        DeleteMaterialDimensionsErr(id: i32) {
            description("Impossible de détacher les dimensions du matériau")
            display("Could not delete material_dimensions `{}`", id)
        }
        SelectMaterialBadgesErr {
            description("Impossible de récupérer la liste des badges rattachés aux matériaux")
            display("Could not select material_badges")
        }
        InsertMaterialBadgesErr(id: i32) {
            description("Impossible de rattacher les badges au matériau")
            display("Could not insert material_badges `{}`", id)
        }
        DeleteMaterialBadgesErr(id: i32) {
            description("Impossible de détacher les badges du matériau")
            display("Could not delete material_badges `{}`", id)
        }
        SelectMaterialDiscountsErr {
            description("Impossible de récupérer la liste des remises rattachées aux matériaux")
            display("Could not select material_discounts")
        }
        InsertMaterialDiscountsErr(id: i32) {
            description("Impossible de rattacher les remises au matériau")
            display("Could not insert material_discounts `{}`", id)
        }
        DeleteMaterialDiscountsErr(id: i32) {
            description("Impossible de détacher les remises du matériau")
            display("Could not delete material_discounts `{}`", id)
        }
        SelectMaterialFixationsErr {
            description("Impossible de récupérer la liste des fixations rattachées aux matériaux")
            display("Could not select material_fixations")
        }
        InsertMaterialFixationsErr(id: i32) {
            description("Impossible de rattacher les fixations au matériau")
            display("Could not insert material_fixations `{}`", id)
        }
        DeleteMaterialFixationsErr(id: i32) {
            description("Impossible de détacher les fixations du matériau")
            display("Could not delete material_fixations `{}`", id)
        }
        SelectMaterialShapesErr {
            description("Impossible de récupérer la liste des formes rattachées aux matériaux")
            display("Could not select material_shapes")
        }
        InsertMaterialShapesErr(id: i32) {
            description("Impossible de rattacher les formes au matériau")
            display("Could not insert material_shapes `{}`", id)
        }
        DeleteMaterialShapesErr(id: i32) {
            description("Impossible de détacher les formes du matériau")
            display("Could not delete material_shapes `{}`", id)
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
    Debug, Default, Identifiable, Queryable, Associations, AsChangeset, Serialize, Deserialize,
)]
#[serde(rename_all = "camelCase")]
pub struct Material {
    pub id: i32,
    pub title: String,
    pub description: String,
    pub preview: String,
    pub background: String,
    pub min_width: f32,
    pub min_height: f32,
    pub max_width: f32,
    pub max_height: f32,
    pub weight: f32,
    pub fixed_price: f32,
    pub surface_price: f32,
    pub manufacturing_time: i16,
    pub more: Option<String>,
    pub transparency: i32,
}

#[derive(Insertable)]
#[table_name = "materials"]
struct InsertableMaterial<'a> {
    pub title: &'a str,
    pub description: &'a str,
    pub preview: &'a str,
    pub background: &'a str,
    pub min_width: &'a f32,
    pub min_height: &'a f32,
    pub max_width: &'a f32,
    pub max_height: &'a f32,
    pub weight: &'a f32,
    pub fixed_price: &'a f32,
    pub surface_price: &'a f32,
    pub manufacturing_time: &'a i16,
    pub more: Option<&'a String>,
    pub transparency: &'a i32,
}

#[derive(Identifiable, AsChangeset)]
#[table_name = "materials"]
struct UpdatableMaterial<'a> {
    pub id: &'a i32,
    pub title: &'a str,
    pub description: &'a str,
    pub preview: &'a str,
    pub background: &'a str,
    pub min_width: &'a f32,
    pub min_height: &'a f32,
    pub max_width: &'a f32,
    pub max_height: &'a f32,
    pub weight: &'a f32,
    pub fixed_price: &'a f32,
    pub surface_price: &'a f32,
    pub manufacturing_time: &'a i16,
    pub more: Option<&'a String>,
    pub transparency: &'a i32,
}

#[derive(Debug, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MaterialJson {
    #[serde(flatten)]
    pub inner: Material,
    #[serde(default)]
    pub dimension_ids: Vec<i32>,
    #[serde(default)]
    pub discount_ids: Vec<i32>,
    #[serde(default)]
    pub fixation_ids: Vec<i32>,
    #[serde(default)]
    pub shape_ids: Vec<i32>,
    #[serde(default)]
    pub badge_ids: Vec<i32>,
}

#[derive(Identifiable, Queryable, Insertable, Associations)]
#[primary_key(material_id, dimension_id)]
#[belongs_to(Material)]
#[belongs_to(Dimension)]
pub struct MaterialDimension {
    pub material_id: i32,
    pub dimension_id: i32,
}

#[derive(Identifiable, Queryable, Insertable, Associations)]
#[primary_key(material_id, discount_id)]
#[belongs_to(Material)]
#[belongs_to(Discount)]
pub struct MaterialDiscount {
    pub material_id: i32,
    pub discount_id: i32,
}

#[derive(Identifiable, Queryable, Insertable, Associations)]
#[primary_key(material_id, fixation_id)]
#[belongs_to(Material)]
#[belongs_to(Fixation)]
pub struct MaterialFixation {
    pub material_id: i32,
    pub fixation_id: i32,
}

#[derive(Identifiable, Queryable, Insertable, Associations)]
#[primary_key(material_id, shape_id)]
#[belongs_to(Material)]
#[belongs_to(Shape)]
pub struct MaterialShape {
    pub material_id: i32,
    pub shape_id: i32,
}

#[derive(Identifiable, Queryable, Insertable, Associations)]
#[primary_key(material_id, badge_id)]
#[belongs_to(Material)]
#[belongs_to(Badge)]
pub struct MaterialBadge {
    pub material_id: i32,
    pub badge_id: i32,
}

// Services

#[get("/material")]
async fn get_all(pool: web::Data<database::Pool>) -> Result<HttpResponse> {
    let conn = pool.get().chain_err(|| ErrorKind::GetDbConnErr)?;

    let materials = {
        use crate::schema::materials::dsl::materials;
        use crate::schema::materials::dsl::title;
        materials.order(title).load::<Material>(&conn)
    }
    .chain_err(|| ErrorKind::SelectMaterialsErr)?;

    let material_fixations = MaterialFixation::belonging_to(&materials)
        .load::<MaterialFixation>(&conn)
        .chain_err(|| ErrorKind::SelectMaterialFixationsErr)?
        .grouped_by(&materials);

    let material_shapes = MaterialShape::belonging_to(&materials)
        .load::<MaterialShape>(&conn)
        .chain_err(|| ErrorKind::SelectMaterialShapesErr)?
        .grouped_by(&materials);

    let material_dimensions = MaterialDimension::belonging_to(&materials)
        .load::<MaterialDimension>(&conn)
        .chain_err(|| ErrorKind::SelectMaterialDimensionsErr)?
        .grouped_by(&materials);

    let material_discounts = MaterialDiscount::belonging_to(&materials)
        .load::<MaterialDiscount>(&conn)
        .chain_err(|| ErrorKind::SelectMaterialDiscountsErr)?
        .grouped_by(&materials);

    let material_badges = MaterialBadge::belonging_to(&materials)
        .load::<MaterialBadge>(&conn)
        .chain_err(|| ErrorKind::SelectMaterialBadgesErr)?
        .grouped_by(&materials);

    let output: Vec<MaterialJson> = materials
        .into_iter()
        .zip(material_dimensions)
        .zip(material_discounts)
        .zip(material_fixations)
        .zip(material_shapes)
        .zip(material_badges)
        .map(
            |(((((inner, dim), disc), fix), shape), badge)| MaterialJson {
                inner,
                dimension_ids: dim.iter().map(|d| d.dimension_id).collect(),
                discount_ids: disc.iter().map(|d| d.discount_id).collect(),
                fixation_ids: fix.iter().map(|f| f.fixation_id).collect(),
                shape_ids: shape.iter().map(|s| s.shape_id).collect(),
                badge_ids: badge.iter().map(|b| b.badge_id).collect(),
            },
        )
        .collect();

    Ok(HttpResponse::Ok().json(output))
}

#[get("/material/{id}")]
async fn get(pool: web::Data<database::Pool>, product_id: web::Path<i32>) -> Result<HttpResponse> {
    let conn = pool.get().chain_err(|| ErrorKind::GetDbConnErr)?;
    let product_id = product_id.into_inner();

    let product = if product_id == 0 {
        MaterialJson::default()
    } else {
        use crate::schema::materials::dsl;
        let inner = dsl::materials
            .filter(dsl::id.eq(product_id))
            .first::<Material>(&conn)
            .chain_err(|| ErrorKind::FindMaterialErr(product_id))?;
        MaterialJson {
            inner,
            ..MaterialJson::default()
        }
    };

    Ok(HttpResponse::Ok().json(product))
}

#[put("/material")]
async fn set(
    pool: web::Data<database::Pool>,
    material: web::Json<MaterialJson>,
) -> Result<HttpResponse> {
    let conn = pool.get().chain_err(|| ErrorKind::GetDbConnErr)?;
    let material = material.into_inner();
    let material_id = material.inner.id;
    let material_id = if material_id == 0 {
        let new_material = InsertableMaterial {
            title: &material.inner.title,
            description: &material.inner.description,
            more: material.inner.more.as_ref(),
            preview: &material.inner.preview,
            background: &material.inner.background,
            min_width: &material.inner.min_width,
            max_width: &material.inner.max_width,
            min_height: &material.inner.min_height,
            max_height: &material.inner.max_height,
            weight: &material.inner.weight,
            fixed_price: &material.inner.fixed_price,
            surface_price: &material.inner.surface_price,
            manufacturing_time: &material.inner.manufacturing_time,
            transparency: &material.inner.transparency,
        };

        diesel::insert_into(materials::table)
            .values(&new_material)
            .get_result::<Material>(&conn)
            .chain_err(|| ErrorKind::InsertMaterialErr(material_id))?
            .id
    } else {
        {
            use crate::schema::material_dimensions::dsl;
            diesel::delete(material_dimensions::table)
                .filter(dsl::material_id.eq(material_id))
                .execute(&conn)
        }
        .chain_err(|| ErrorKind::DeleteMaterialDimensionsErr(material_id))?;

        {
            use crate::schema::material_discounts::dsl;
            diesel::delete(material_discounts::table)
                .filter(dsl::material_id.eq(material_id))
                .execute(&conn)
        }
        .chain_err(|| ErrorKind::DeleteMaterialDiscountsErr(material_id))?;

        {
            use crate::schema::material_fixations::dsl;
            diesel::delete(material_fixations::table)
                .filter(dsl::material_id.eq(material_id))
                .execute(&conn)
        }
        .chain_err(|| ErrorKind::DeleteMaterialFixationsErr(material_id))?;

        {
            use crate::schema::material_shapes::dsl;
            diesel::delete(material_shapes::table)
                .filter(dsl::material_id.eq(material_id))
                .execute(&conn)
        }
        .chain_err(|| ErrorKind::DeleteMaterialShapesErr(material_id))?;

        {
            use crate::schema::material_badges::dsl;
            diesel::delete(material_badges::table)
                .filter(dsl::material_id.eq(material_id))
                .execute(&conn)
        }
        .chain_err(|| ErrorKind::DeleteMaterialBadgesErr(material_id))?;

        let next_material = UpdatableMaterial {
            id: &material.inner.id,
            title: &material.inner.title,
            description: &material.inner.description,
            more: material.inner.more.as_ref(),
            preview: &material.inner.preview,
            background: &material.inner.background,
            min_width: &material.inner.min_width,
            max_width: &material.inner.max_width,
            min_height: &material.inner.min_height,
            max_height: &material.inner.max_height,
            weight: &material.inner.weight,
            fixed_price: &material.inner.fixed_price,
            surface_price: &material.inner.surface_price,
            manufacturing_time: &material.inner.manufacturing_time,
            transparency: &material.inner.transparency,
        };

        diesel::update(&next_material)
            .set(&next_material)
            .execute(&conn)
            .chain_err(|| ErrorKind::UpdateMaterialErr(material_id))?;

        material_id
    };

    let new_material_dimensions = material
        .dimension_ids
        .into_iter()
        .map(|dimension_id| MaterialDimension {
            material_id,
            dimension_id,
        })
        .collect::<Vec<_>>();

    diesel::insert_into(material_dimensions::table)
        .values(&new_material_dimensions)
        .execute(&conn)
        .chain_err(|| ErrorKind::InsertMaterialDimensionsErr(material_id))?;

    let new_material_discounts = material
        .discount_ids
        .into_iter()
        .map(|discount_id| MaterialDiscount {
            material_id,
            discount_id,
        })
        .collect::<Vec<_>>();

    diesel::insert_into(material_discounts::table)
        .values(&new_material_discounts)
        .execute(&conn)
        .chain_err(|| ErrorKind::InsertMaterialDiscountsErr(material_id))?;

    let new_material_fixations = material
        .fixation_ids
        .into_iter()
        .map(|fixation_id| MaterialFixation {
            material_id,
            fixation_id,
        })
        .collect::<Vec<_>>();

    diesel::insert_into(material_fixations::table)
        .values(&new_material_fixations)
        .execute(&conn)
        .chain_err(|| ErrorKind::InsertMaterialFixationsErr(material_id))?;

    let new_material_shapes = material
        .shape_ids
        .into_iter()
        .map(|shape_id| MaterialShape {
            material_id,
            shape_id,
        })
        .collect::<Vec<_>>();

    diesel::insert_into(material_shapes::table)
        .values(&new_material_shapes)
        .execute(&conn)
        .chain_err(|| ErrorKind::InsertMaterialShapesErr(material_id))?;

    let new_material_badges = material
        .badge_ids
        .into_iter()
        .map(|badge_id| MaterialBadge {
            material_id,
            badge_id,
        })
        .collect::<Vec<_>>();

    diesel::insert_into(material_badges::table)
        .values(&new_material_badges)
        .execute(&conn)
        .chain_err(|| ErrorKind::InsertMaterialBadgesErr(material_id))?;

    Ok(HttpResponse::NoContent().finish())
}

#[delete("/material/{id}")]
async fn del(
    pool: web::Data<database::Pool>,
    web::Path(id): web::Path<i32>,
) -> Result<HttpResponse> {
    let conn = pool.get().chain_err(|| ErrorKind::GetDbConnErr)?;

    {
        use crate::schema::materials::dsl::materials;
        diesel::delete(materials.find(id)).execute(&conn)
    }
    .chain_err(|| ErrorKind::DeleteMaterialErr(id))?;

    Ok(HttpResponse::NoContent().finish())
}

pub fn pub_services(cfg: &mut web::ServiceConfig) {
    cfg.service(get_all).service(get);
}

pub fn priv_services(cfg: &mut web::ServiceConfig) {
    cfg.service(set).service(del);
}

// Helpers

pub fn find_by_id(conn: &database::PooledConnection, id: i32) -> Result<Option<Material>> {
    if id == 0 {
        return Ok(None);
    }

    let material = {
        use crate::schema::materials::dsl::materials;
        materials.find(id).first::<Material>(conn)
    }
    .chain_err(|| ErrorKind::FindMaterialErr(id))?;

    Ok(Some(material))
}
