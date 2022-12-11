use actix_web::{
    self,
    dev::{HttpResponseBuilder, ServiceRequest},
    get,
    http::{header, StatusCode},
    web, HttpResponse,
};
use actix_web_httpauth::extractors::bearer::BearerAuth;
use error_chain::error_chain;
use jsonwebtoken as jwt;
use log::error;
use serde::{Deserialize, Serialize};
use std::{env, result};

// Error management

error_chain! {
    errors {
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

#[derive(Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
}

impl Claims {
    pub fn new(sub: i32) -> Self {
        Self {
            sub: sub.to_string(),
        }
    }
}

// Utils

pub fn secret() -> String {
    env::var("JWT_SECRET").unwrap_or("SECRET".to_string())
}

pub fn generate_jwt(sub: i32) -> Result<String> {
    jwt::encode(
        &jwt::Header::default(),
        &Claims::new(sub),
        &jwt::EncodingKey::from_secret(secret().as_bytes()),
    )
    .chain_err(|| ErrorKind::CreateJwtErr)
}

// Services

pub async fn bearer_validator(
    req: ServiceRequest,
    credentials: BearerAuth,
) -> result::Result<ServiceRequest, actix_web::Error> {
    let token = credentials.token();
    let mut validation = jwt::Validation::default();
    validation.validate_exp = false;

    jwt::decode::<Claims>(
        &token,
        &jwt::DecodingKey::from_secret(secret().as_bytes()),
        &validation,
    )
    .chain_err(|| ErrorKind::DecodeJwtErr(token.to_owned()))?;

    Ok(req)
}

#[get("/auth-check")]
async fn check_service() -> HttpResponse {
    HttpResponse::NoContent().finish()
}

pub fn services(cfg: &mut web::ServiceConfig) {
    cfg.service(check_service);
}
