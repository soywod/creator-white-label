use actix_web::{
    self,
    dev::{HttpResponseBuilder, ServiceRequest},
    get,
    http::{header, StatusCode},
    post, web, HttpResponse,
};
use actix_web_httpauth::extractors::bearer::BearerAuth;
use bcrypt;
use diesel::prelude::*;
use error_chain::error_chain;
use jsonwebtoken as jwt;
use serde::{Deserialize, Serialize};
use std::result;

use crate::database;
use crate::models::User;

error_chain! {
    errors {
        GetDbConnErr {
            description("Impossible de se connecter à la base de données")
            display("Could not get db conn from pool")
        }
        FindUserByUsernameError(username: String) {
            description("Utilisateur introuvable")
            display("Could not find user `{}`", username)
        }
        FindUserPasswdMismatchErr(username: String) {
            description("Utilisateur introuvable")
            display("Could not find user `{}`", username)
        }
        DecodeJwtErr(jwt: String) {
            description("Jeton d'authentification invalide")
            display("Could not decode JWT `{}`", jwt)
        }
        CreateJwtErr {
            description("Impossible de générer le jeton d'authentification")
            display("Could not generate JWT")
        }
    }
}

const JWT_SECRET: &str = "secret";

#[derive(Serialize, Deserialize)]
struct Claims {
    pub sub: String,
}

impl Claims {
    pub fn new(sub: u32) -> Self {
        Self {
            sub: sub.to_string(),
        }
    }
}

impl actix_web::error::ResponseError for Error {
    fn error_response(&self) -> HttpResponse {
        HttpResponseBuilder::new(self.status_code())
            .set_header(header::CONTENT_TYPE, "text/plain; charset=utf-8")
            .body(self.to_string())
    }

    fn status_code(&self) -> StatusCode {
        match *self.kind() {
            _ => StatusCode::INTERNAL_SERVER_ERROR,
        }
    }
}

pub async fn bearer_validator(
    req: ServiceRequest,
    credentials: BearerAuth,
) -> result::Result<ServiceRequest, actix_web::Error> {
    let token = credentials.token();
    let mut validation = jwt::Validation::default();
    validation.validate_exp = false;

    jwt::decode::<Claims>(
        &token,
        &jwt::DecodingKey::from_secret(JWT_SECRET.as_ref()),
        &validation,
    )
    .chain_err(|| ErrorKind::DecodeJwtErr(token.to_owned()))?;

    Ok(req)
}

// #[derive(Deserialize)]
// struct User {
//     pub username: String,
//     pub password: String,
// }

#[get("/auth-check")]
async fn auth_check_service() -> HttpResponse {
    HttpResponse::NoContent().finish()
}

// Sign in

#[derive(Serialize)]
pub struct SignInResponse {
    pub user_id: u32,
    pub token: String,
}

// enum SignInError {
//     GetDatabaseConnectionError(mysql::Error),
//     QueryUserTableError(mysql::Error),
//     FindUserByPasswordHashError(String),
//     VerifyUserPasswordHashError(bcrypt::BcryptError),
//     CreateJwtError(jwt::errors::Error),
// }

// fn sign_in(pool: &mysql::Pool, user: &User) -> Result<SignInResponse, SignInError> {
//     use creator_server::schema::users::dsl::*;

//     let mut conn = get_conn()
//         .map_err(SignInError::GetDatabaseConnectionError)?;

//     let res = users.filter(username.eq(user.username))
//         .limit(1)
//         .load::<Post>(&connection)
//         .expect("Error loading posts");
//     let res: Option<(usize, String)> = conn
//         .exec_first(
//             "
//             SELECT `id`, `password`
//             FROM `user`
//             WHERE `username` = ?
//             ",
//             (&user.username,),
//         )
//         .map_err(SignInError::QueryUserTableError)?;

//     match res {
//         None => Err(SignInError::FindUserByPasswordHashError(
//             user.username.to_owned(),
//         )),
//         Some((user_id, hash)) => match bcrypt::verify(&user.password, &hash) {
//             Err(err) => Err(SignInError::VerifyUserPasswordHashError(err)),
//             Ok(false) => Err(SignInError::FindUserByPasswordHashError(
//                 user.username.to_owned(),
//             )),
//             Ok(true) => Ok(SignInResponse {
//                 user_id,
//                 token: jwt::encode(
//                     &jwt::Header::default(),
//                     &Claims::new(user_id),
//                     &jwt::EncodingKey::from_secret(JWT_SECRET.as_ref()),
//                 )
//                 .map_err(SignInError::CreateJwtError)?,
//             }),
//         },
//     }
//     Ok(())
// }

#[post("/sign-in")]
async fn sign_in_service(
    pool: web::Data<database::Pool>,
    user: web::Json<User>,
) -> Result<HttpResponse> {
    use crate::schema::users::dsl::*;

    let conn = pool.get().chain_err(|| ErrorKind::GetDbConnErr)?;

    let matching_users = users
        .filter(username.eq(&user.username))
        .limit(1)
        .load::<User>(&conn)
        .chain_err(|| ErrorKind::FindUserByUsernameError(user.username.to_owned()))?;

    let matching_user = matching_users
        .iter()
        .next()
        .ok_or_else(|| ErrorKind::FindUserByUsernameError(user.username.to_owned()))?;

    let passwords_match = bcrypt::verify(&user.password, &matching_user.password)
        .chain_err(|| ErrorKind::FindUserPasswdMismatchErr(user.username.to_owned()))?;

    if passwords_match {
        Ok(HttpResponse::Ok().json(SignInResponse {
            user_id: matching_user.id,
            token: jwt::encode(
                &jwt::Header::default(),
                &Claims::new(matching_user.id),
                &jwt::EncodingKey::from_secret(JWT_SECRET.as_ref()),
            )
            .chain_err(|| ErrorKind::CreateJwtErr)?,
        }))
    } else {
        Err(ErrorKind::FindUserPasswdMismatchErr(user.username.to_owned()).into())
    }
}
