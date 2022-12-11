use actix_files;
use actix_multipart::Multipart;
use actix_web::{self, put, web, Error, HttpResponse};
use futures::{StreamExt, TryStreamExt};
use sanitize_filename;
use serde::ser::{Serialize, SerializeMap, Serializer};
use std::{
    env, fs,
    io::{self, Write},
    path::{Path, PathBuf},
};
use uuid::Uuid;

struct UploadMap(Vec<(String, String)>);

// Public services

pub fn dir() -> PathBuf {
    let mut dir = env::current_exe().unwrap();
    dir.pop();
    dir.push("uploads");
    dir
}

pub fn init() -> io::Result<()> {
    match fs::create_dir(dir()) {
        Err(err) => match err.kind() {
            io::ErrorKind::AlreadyExists => Ok(()),
            _ => Err(err),
        },
        _ => Ok(()),
    }
}

pub fn pub_services(cfg: &mut web::ServiceConfig) {
    cfg.service(actix_files::Files::new("/", dir()));
}

// Private services

impl UploadMap {
    pub fn new() -> Self {
        Self(vec![])
    }

    pub fn add(&mut self, filename: &str) -> String {
        let ext = Path::new(filename)
            .extension()
            .and_then(|ext| ext.to_str())
            .unwrap_or("txt");
        let uuid = format!("{}.{}", Uuid::new_v4(), ext);
        self.0.push((filename.to_owned(), uuid.to_owned()));
        uuid
    }
}

impl Serialize for UploadMap {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut map = serializer.serialize_map(Some(self.0.len()))?;

        for (k, v) in &self.0 {
            map.serialize_entry(k, v)?;
        }

        map.end()
    }
}

#[put("/upload")]
async fn upload(mut form: Multipart) -> Result<HttpResponse, Error> {
    let mut upload_map = UploadMap::new();

    while let Ok(Some(mut field)) = form.try_next().await {
        let content_type = field.content_disposition().unwrap();
        let filename = sanitize_filename::sanitize(content_type.get_filename().unwrap());
        let filename = upload_map.add(&filename);

        let mut filepath = dir();
        filepath.push(&filename);

        let mut f = web::block(|| fs::File::create(filepath)).await.unwrap();
        while let Some(chunk) = field.next().await {
            let data = chunk.unwrap();
            f = web::block(move || f.write_all(&data).map(|_| f)).await?;
        }
    }

    Ok(HttpResponse::Ok().json(upload_map))
}

pub fn priv_services(cfg: &mut web::ServiceConfig) {
    cfg.service(upload);
}
