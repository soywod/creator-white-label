use actix_web::{
    dev::HttpResponseBuilder,
    error as actix_err,
    http::{header, StatusCode},
    web, HttpRequest, HttpResponse,
};
use error_chain::error_chain;
use log::error;

// Error management

error_chain! {
    errors {
        InvalidContentTypeErr(err: String) {
            description("Le type de contenu est invalide")
            display("Invalid content type header: {}", err)
        }
        DeserializeErr(err: String) {
            description("La requête est mal formatée")
            display("Could not parse JSON: {}", err)
        }
        InvalidReqErr(err: String) {
            description("La requête est invalide")
            display("Invalid request: {}", err)
        }
    }
}

impl actix_err::ResponseError for Error {
    fn error_response(&self) -> HttpResponse {
        error!("{}", self.to_string());
        HttpResponseBuilder::new(self.status_code())
            .set_header(header::CONTENT_TYPE, "text/plain; charset=utf-8")
            .body(self.description().to_owned())
    }

    fn status_code(&self) -> StatusCode {
        match *self.kind() {
            ErrorKind::InvalidContentTypeErr(_) => StatusCode::UNSUPPORTED_MEDIA_TYPE,
            ErrorKind::DeserializeErr(_) => StatusCode::UNPROCESSABLE_ENTITY,
            ErrorKind::InvalidReqErr(_) => StatusCode::BAD_REQUEST,
            _ => StatusCode::INTERNAL_SERVER_ERROR,
        }
    }
}

// Services

fn error_handler(err: actix_err::JsonPayloadError, _req: &HttpRequest) -> actix_err::Error {
    use actix_err::JsonPayloadError::*;

    let detail = err.to_string();
    let err: Error = match &err {
        ContentType => ErrorKind::InvalidContentTypeErr(detail),
        Deserialize(json_err) if json_err.is_data() => ErrorKind::DeserializeErr(detail),
        _ => ErrorKind::InvalidReqErr(detail),
    }
    .into();

    err.into()
}

pub fn payload_error_management(cfg: &mut web::ServiceConfig) {
    cfg.app_data(web::JsonConfig::default().error_handler(error_handler));
}
