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

use crate::database;
use crate::font::Font;
use crate::material::Material;
use crate::schema::{app_fonts, app_materials, app_users, apps};
use crate::user::User;

// Error management

error_chain! {
    errors {
        GetDbConnErr {
            description("Impossible de se connecter à la base de données")
            display("Could not get db conn from pool")
        }
        SelectAppsErr {
            description("Impossible de récupérer la liste des applications")
            display("Could not select apps")
        }
        InsertAppErr(id: i32) {
            description("Impossible de créer l'application")
            display("Could not insert app `{}`", id)
        }
        UpdateAppErr(id: i32) {
            description("Impossible de modifier l'application")
            display("Could not update app `{}`", id)
        }
        DeleteAppErr(id: i32) {
            description("Impossible de supprimer l'applicationt")
            display("Could not delete app `{}`", id)
        }
        SelectAppUsersErr {
            description("Impossible de récupérer la liste des utilisateurs rattachés aux applications")
            display("Could not select app_users")
        }
        InsertAppUsersErr(id: i32) {
            description("Impossible de rattacher les utilisateurs à l'application")
            display("Could not insert app_users `{}`", id)
        }
        DeleteAppUsersErr(id: i32) {
            description("Impossible de détacher les utilisateurs de l'application")
            display("Could not delete app_users `{}`", id)
        }
        SelectAppMaterialsErr {
            description("Impossible de récupérer la liste des matériaux rattachés aux applications")
            display("Could not select app_materials")
        }
        InsertAppMaterialsErr(id: i32) {
            description("Impossible de rattacher les matériaux à l'application")
            display("Could not insert app_materials `{}`", id)
        }
        DeleteAppMaterialsErr(id: i32) {
            description("Impossible de détacher les matériaux de l'application")
            display("Could not delete app_materials `{}`", id)
        }
        SelectAppFontsErr {
            description("Impossible de récupérer la liste des polices rattachées aux applications")
            display("Could not select app_fonts")
        }
        InsertAppFontsErr(id: i32) {
            description("Impossible de rattacher les polices à l'application")
            display("Could not insert app_fonts `{}`", id)
        }
        DeleteAppFontsErr(id: i32) {
            description("Impossible de détacher les polices de l'application")
            display("Could not delete app_fonts `{}`", id)
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

#[derive(Identifiable, Queryable, Associations, Serialize, Deserialize)]
pub struct App {
    pub id: i32,
    pub name: String,
}

#[derive(Insertable)]
#[table_name = "apps"]
pub struct InsertableApp<'a> {
    pub name: &'a str,
}

#[derive(Identifiable, AsChangeset)]
#[table_name = "apps"]
pub struct UpdatableApp<'a> {
    pub id: &'a i32,
    pub name: &'a str,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppJson {
    pub id: i32,
    pub name: String,
    #[serde(default)]
    pub user_ids: Vec<i32>,
    #[serde(default)]
    pub material_ids: Vec<i32>,
    #[serde(default)]
    pub font_ids: Vec<i32>,
}

#[derive(Identifiable, Queryable, Insertable, Associations)]
#[primary_key(app_id, user_id)]
#[belongs_to(App)]
#[belongs_to(User)]
pub struct AppUser {
    pub app_id: i32,
    pub user_id: i32,
}

#[derive(Identifiable, Queryable, Insertable, Associations)]
#[primary_key(app_id, material_id)]
#[belongs_to(App)]
#[belongs_to(Material)]
pub struct AppMaterial {
    pub app_id: i32,
    pub material_id: i32,
}

#[derive(Identifiable, Queryable, Insertable, Associations)]
#[primary_key(app_id, font_id)]
#[belongs_to(App)]
#[belongs_to(Font)]
pub struct AppFont {
    pub app_id: i32,
    pub font_id: i32,
}

// Services

#[get("/app")]
async fn get(pool: web::Data<database::Pool>) -> Result<HttpResponse> {
    let conn = pool.get().chain_err(|| ErrorKind::GetDbConnErr)?;

    let apps = {
        use crate::schema::apps::dsl::apps;
        apps.load::<App>(&conn)
    }
    .chain_err(|| ErrorKind::SelectAppsErr)?;

    let all_app_users = AppUser::belonging_to(&apps)
        .load::<AppUser>(&conn)
        .chain_err(|| ErrorKind::SelectAppUsersErr)?
        .grouped_by(&apps);

    let all_app_materials = AppMaterial::belonging_to(&apps)
        .load::<AppMaterial>(&conn)
        .chain_err(|| ErrorKind::SelectAppMaterialsErr)?
        .grouped_by(&apps);

    let all_app_fonts = AppFont::belonging_to(&apps)
        .load::<AppFont>(&conn)
        .chain_err(|| ErrorKind::SelectAppFontsErr)?
        .grouped_by(&apps);

    let output: Vec<AppJson> = apps
        .into_iter()
        .zip(all_app_users)
        .zip(all_app_materials)
        .zip(all_app_fonts)
        .map(|(((app, u), m), f)| AppJson {
            id: app.id,
            name: app.name,
            user_ids: u.iter().map(|u| u.user_id).collect(),
            material_ids: m.iter().map(|m| m.material_id).collect(),
            font_ids: f.iter().map(|f| f.font_id).collect(),
        })
        .collect();

    Ok(HttpResponse::Ok().json(output))
}

#[put("/app")]
async fn set(pool: web::Data<database::Pool>, app: web::Json<AppJson>) -> Result<HttpResponse> {
    let conn = pool.get().chain_err(|| ErrorKind::GetDbConnErr)?;
    let app_id = app.id;
    let app = app.into_inner();

    let app_id = if app.id == 0 {
        let new_app = InsertableApp { name: &app.name };

        diesel::insert_into(apps::table)
            .values(&new_app)
            .get_result::<App>(&conn)
            .chain_err(|| ErrorKind::InsertAppErr(app_id))?
            .id
    } else {
        {
            use crate::schema::app_users::dsl;
            diesel::delete(app_users::table)
                .filter(dsl::app_id.eq(app.id))
                .execute(&conn)
        }
        .chain_err(|| ErrorKind::DeleteAppUsersErr(app_id))?;

        {
            use crate::schema::app_materials::dsl;
            diesel::delete(app_materials::table)
                .filter(dsl::app_id.eq(app.id))
                .execute(&conn)
        }
        .chain_err(|| ErrorKind::DeleteAppMaterialsErr(app_id))?;

        {
            use crate::schema::app_fonts::dsl;
            diesel::delete(app_fonts::table)
                .filter(dsl::app_id.eq(app.id))
                .execute(&conn)
        }
        .chain_err(|| ErrorKind::DeleteAppFontsErr(app_id))?;

        let next_app = UpdatableApp {
            id: &app.id,
            name: &app.name,
        };

        diesel::update(&next_app)
            .set(&next_app)
            .execute(&conn)
            .chain_err(|| ErrorKind::UpdateAppErr(app_id))?;

        app.id
    };

    let new_app_users: &[AppUser] = &app
        .user_ids
        .into_iter()
        .map(|user_id| AppUser { app_id, user_id })
        .collect::<Vec<_>>();

    diesel::insert_into(app_users::table)
        .values(new_app_users)
        .execute(&conn)
        .chain_err(|| ErrorKind::InsertAppUsersErr(app_id))?;

    let new_app_materials: &[AppMaterial] = &app
        .material_ids
        .into_iter()
        .map(|material_id| AppMaterial {
            app_id,
            material_id,
        })
        .collect::<Vec<_>>();

    diesel::insert_into(app_materials::table)
        .values(new_app_materials)
        .execute(&conn)
        .chain_err(|| ErrorKind::InsertAppMaterialsErr(app_id))?;

    let new_app_fonts: &[AppFont] = &app
        .font_ids
        .into_iter()
        .map(|font_id| AppFont { app_id, font_id })
        .collect::<Vec<_>>();

    diesel::insert_into(app_fonts::table)
        .values(new_app_fonts)
        .execute(&conn)
        .chain_err(|| ErrorKind::InsertAppFontsErr(app_id))?;

    Ok(HttpResponse::NoContent().finish())
}

#[delete("/app/{id}")]
async fn del(
    pool: web::Data<database::Pool>,
    web::Path(id): web::Path<i32>,
) -> Result<HttpResponse> {
    use crate::schema::apps::dsl::apps;
    let conn = pool.get().chain_err(|| ErrorKind::GetDbConnErr)?;

    diesel::delete(apps.find(id))
        .execute(&conn)
        .chain_err(|| ErrorKind::DeleteAppErr(id))?;

    Ok(HttpResponse::NoContent().finish())
}

pub fn services(cfg: &mut web::ServiceConfig) {
    cfg.service(get).service(set).service(del);
}
