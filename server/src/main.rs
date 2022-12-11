#[macro_use]
extern crate diesel;

use actix_cors::Cors;
use actix_web::{
    middleware::{normalize::TrailingSlash, Logger, NormalizePath},
    web, App, HttpServer,
};
use actix_web_httpauth::middleware::HttpAuthentication;
use env_logger;
use std::{env, io};

mod app;
mod badge;
mod database;
mod dimension;
mod discount;
mod fixation;
mod fixation_condition;
mod font;
mod material;
mod order;
mod picto;
mod schema;
mod shape;
mod shared;
mod template;
mod user;

#[actix_web::main]
async fn main() -> io::Result<()> {
    env::set_var("RUST_LOG", "actix_web=info,warn,error");
    env_logger::init();
    shared::upload::init()?;

    let mut server = HttpServer::new(move || {
        let cors = if cfg!(debug_assertions) {
            Cors::permissive()
        } else {
            Cors::default()
                .allow_any_header()
                .allow_any_method()
                .allowed_origin_fn(|orig, _| {
                    orig.as_bytes().ends_with(b"admin.pictosigns.io")
                        || orig.as_bytes().ends_with(b"picto-test.com")
                        || orig.as_bytes().ends_with(b"pictosigns.com")
                })
                .supports_credentials()
        };

        App::new()
            .wrap(NormalizePath::new(TrailingSlash::Trim))
            .wrap(Logger::default())
            .data(database::get_conn_pool().expect("Could not initialize database pool"))
            .configure(shared::json::payload_error_management)
            .service(
                web::scope("/public")
                    .wrap(Cors::permissive())
                    .configure(user::sign_in_service)
                    .configure(picto::pub_services)
                    .configure(material::pub_services)
                    .configure(badge::pub_services)
                    .configure(fixation::pub_services)
                    .configure(shape::pub_services)
                    .configure(discount::pub_services)
                    .configure(template::pub_services)
                    .configure(dimension::pub_services)
                    .configure(order::services)
                    .configure(shared::upload::pub_services),
            )
            .service(
                web::scope("/")
                    .wrap(HttpAuthentication::bearer(shared::auth::bearer_validator))
                    .wrap(cors)
                    .configure(shared::auth::services)
                    .configure(user::services)
                    .configure(app::services)
                    .configure(discount::priv_services)
                    .configure(font::services)
                    .configure(material::priv_services)
                    .configure(badge::priv_services)
                    .configure(dimension::priv_services)
                    .configure(picto::priv_services)
                    .configure(shape::priv_services)
                    .configure(template::priv_services)
                    .configure(fixation::priv_services)
                    .configure(shared::folder::services)
                    .configure(shared::upload::priv_services),
            )
    });

    if cfg!(debug_assertions) {
        server = server.workers(1);
    }

    server
        .bind((
            "localhost",
            env::var("PORT")
                .ok()
                .and_then(|port| port.parse::<u16>().ok())
                .unwrap_or(3001),
        ))?
        .run()
        .await
}
