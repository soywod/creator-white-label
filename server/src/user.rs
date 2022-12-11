use actix_web::{
    self, delete,
    dev::HttpResponseBuilder,
    get,
    http::{header, StatusCode},
    post, put, web, HttpResponse,
};
use bcrypt;
use diesel::prelude::*;
use error_chain::error_chain;
use log::error;
use serde::{Deserialize, Serialize};
use serde_json::json;

use crate::database;
use crate::schema::users;
use crate::shared::auth;

// TODO: make use of `web::block`

// Error management

error_chain! {
    errors {
        GetDbConnErr {
            description("Impossible de se connecter à la base de données")
            display("Could not get db conn from pool")
        }
        EncryptPasswdErr(u: String) {
            description("Impossible de chiffrer le mot de passe de l'utilisateur")
            display("Could not encrypt user password `{}`", u)
        }
        FindUserByUsernameErr(u: String) {
            description("Utilisateur introuvable")
            display("Could not find user by username `{}`", u)
        }
        FindUserPasswdMismatchErr(u: String) {
            description("Mot de passe incorrect")
            display("Invalid password for user `{}`", u)
        }
        SelectUsersErr {
            description("Impossible de récupérer la liste des utilisateurs")
            display("Could not select users")
        }
        InsertUserErr(u: String) {
            description("Impossible de créer l'utilisateur")
            display("Could not insert user `{}`", u)
        }
        UpdateUserWithoutPasswdErr(u: String) {
            description("Impossible de modifier l'utilisateur")
            display("Could not update user without password `{}`", u)
        }
        UpdateUserErr(u: String) {
            description("Impossible de modifier l'utilisateur")
            display("Could not update user `{}`", u)
        }
        DeleteUserErr(id: i32) {
            description("Impossible de supprimer l'utilisateur")
            display("Could not delete user `{}`", id)
        }
    }
    links {
        Jwt(auth::Error, auth::ErrorKind);
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
#[serde(rename_all = "camelCase")]
pub struct User {
    pub id: i32,
    pub username: String,
    #[serde(default, skip_serializing)]
    pub password: String,
    #[serde(skip_serializing, skip_deserializing)]
    pub token: Option<String>,
    pub is_admin: bool,
}

#[derive(Deserialize)]
struct SigningInUser {
    pub username: String,
    pub password: String,
}

#[derive(Insertable)]
#[table_name = "users"]
struct InsertableUser<'a> {
    pub username: &'a str,
    pub password: &'a str,
    pub is_admin: &'a bool,
}

#[derive(Identifiable, AsChangeset)]
#[table_name = "users"]
struct UpdatableUser<'a> {
    pub id: &'a i32,
    pub username: &'a str,
    pub password: &'a str,
    pub is_admin: &'a bool,
}

#[derive(Identifiable, AsChangeset)]
#[table_name = "users"]
struct UpdatablePasswordlessUser<'a> {
    pub id: &'a i32,
    pub username: &'a str,
    pub is_admin: &'a bool,
}

// Public services

#[post("/sign-in")]
async fn sign_in(
    pool: web::Data<database::Pool>,
    user: web::Json<SigningInUser>,
) -> Result<HttpResponse> {
    use crate::schema::users::dsl::*;
    let conn = pool.get().chain_err(|| ErrorKind::GetDbConnErr)?;

    let matching_user = users
        .filter(username.eq(&user.username))
        .first::<User>(&conn)
        .chain_err(|| ErrorKind::FindUserByUsernameErr(user.username.to_owned()))?;

    let passwords_match = bcrypt::verify(&user.password, &matching_user.password)
        .chain_err(|| ErrorKind::FindUserPasswdMismatchErr(user.username.to_owned()))?;

    if passwords_match {
        Ok(HttpResponse::Ok().json(json!({
            "userId": matching_user.id,
            "token": auth::generate_jwt(matching_user.id)?,
        })))
    } else {
        Err(ErrorKind::FindUserPasswdMismatchErr(user.username.to_owned()).into())
    }
}

pub fn sign_in_service(cfg: &mut web::ServiceConfig) {
    cfg.service(sign_in);
}

// Private services

#[get("/user")]
async fn get(pool: web::Data<database::Pool>) -> Result<HttpResponse> {
    use crate::schema::users::dsl::*;
    let conn = pool.get().chain_err(|| ErrorKind::GetDbConnErr)?;

    let all_users = users
        .load::<User>(&conn)
        .chain_err(|| ErrorKind::SelectUsersErr)?;

    Ok(HttpResponse::Ok().json(all_users))
}

#[put("/user")]
async fn set(pool: web::Data<database::Pool>, user: web::Json<User>) -> Result<HttpResponse> {
    let conn = pool.get().chain_err(|| ErrorKind::GetDbConnErr)?;
    let username = user.username.to_owned();
    let password = user.password.to_owned();

    if user.id == 0 {
        let hash = bcrypt::hash(&password, bcrypt::DEFAULT_COST)
            .chain_err(|| ErrorKind::EncryptPasswdErr(username.to_owned()))?;

        let new_user = InsertableUser {
            username: &user.username,
            password: &hash,
            is_admin: &user.is_admin,
        };

        diesel::insert_into(users::table)
            .values(&new_user)
            .execute(&conn)
            .chain_err(|| ErrorKind::InsertUserErr(username.to_owned()))
    } else {
        if password.is_empty() {
            let next_user = UpdatablePasswordlessUser {
                id: &user.id,
                username: &user.username,
                is_admin: &user.is_admin,
            };

            diesel::update(&next_user)
                .set(&next_user)
                .execute(&conn)
                .chain_err(|| ErrorKind::UpdateUserWithoutPasswdErr(username.to_owned()))
        } else {
            let hash = bcrypt::hash(&password, bcrypt::DEFAULT_COST)
                .chain_err(|| ErrorKind::EncryptPasswdErr(username.to_owned()))?;

            let next_user = UpdatableUser {
                id: &user.id,
                username: &user.username,
                password: &hash,
                is_admin: &user.is_admin,
            };

            diesel::update(&next_user)
                .set(&next_user)
                .execute(&conn)
                .chain_err(|| ErrorKind::UpdateUserErr(username.to_owned()))
        }
    }?;

    Ok(HttpResponse::NoContent().finish())
}

#[delete("/user/{id}")]
async fn del(
    pool: web::Data<database::Pool>,
    web::Path(id): web::Path<i32>,
) -> Result<HttpResponse> {
    use crate::schema::users::dsl::users;
    let conn = pool.get().chain_err(|| ErrorKind::GetDbConnErr)?;

    diesel::delete(users.find(id))
        .execute(&conn)
        .chain_err(|| ErrorKind::DeleteUserErr(id))?;

    Ok(HttpResponse::NoContent().finish())
}

pub fn services(cfg: &mut web::ServiceConfig) {
    cfg.service(get).service(set).service(del);
}
