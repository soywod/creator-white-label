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
use std::ops::Deref;

use crate::database;
use crate::schema::folders;

// Error management

error_chain! {
    errors {
        GetDbConnErr {
            description("Impossible de se connecter à la base de données")
            display("Could not get db conn from pool")
        }
        SelectFoldersErr {
            description("Impossible de récupérer la liste des remises")
            display("Could not select folders")
        }
        InsertFolderErr(id: i32) {
            description("Impossible de créer la remise")
            display("Could not insert folder `{}`", id)
        }
        UpdateFolderErr(id: i32) {
            description("Impossible de modifier la remise")
            display("Could not update folder `{}`", id)
        }
        DeleteFolderErr(id: i32) {
            description("Impossible de supprimer la remise")
            display("Could not delete folder `{}`", id)
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

pub trait Folderable {
    fn folder_id(&self) -> Option<i32>;
}

#[derive(
    Debug, Clone, Identifiable, Queryable, Associations, AsChangeset, Serialize, Deserialize,
)]
#[serde(rename_all = "camelCase")]
pub struct Folder {
    pub id: i32,
    pub parent_id: Option<i32>,
    pub name: String,
    pub category: String,
}

#[derive(Insertable)]
#[table_name = "folders"]
struct InsertableFolder<'a> {
    pub parent_id: Option<&'a i32>,
    pub name: &'a str,
    pub category: &'a str,
}

#[derive(Debug, Serialize)]
pub struct TreeFolderNode<'a, T: Folderable> {
    #[serde(flatten)]
    pub inner: &'a Folder,
    pub children: Vec<TreeNode<'a, T>>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum TreeNode<'a, T: Folderable> {
    Folder(TreeFolderNode<'a, T>),
    Item(&'a T),
}

// Functions

pub fn get_by_ids(conn: &database::PooledConnection, ids: &[i32]) -> Result<Vec<Folder>> {
    let folders = {
        use crate::schema::folders::dsl::*;
        folders.filter(id.eq_any(ids)).load::<Folder>(conn)
    }
    .chain_err(|| ErrorKind::SelectFoldersErr)?;

    Ok(folders)
}

pub fn build_tree<'a, T: Folderable>(
    folders: &'a [Folder],
    items: &'a [T],
) -> Result<Vec<TreeNode<'a, T>>> {
    Ok(build_children_tree(None, &folders, &items))
}

fn build_children_tree<'a, T: Folderable>(
    id: Option<i32>,
    folders: &'a [Folder],
    items: &'a [T],
) -> Vec<TreeNode<'a, T>> {
    let mut children = vec![];

    children.extend(
        folders
            .iter()
            .filter(|&f| match id {
                None => f.parent_id.is_none(),
                Some(id) => f.parent_id.is_some() && f.parent_id.unwrap() == id,
            })
            .map(|f| {
                TreeNode::Folder(TreeFolderNode {
                    inner: f,
                    children: build_children_tree(Some(f.id), &folders, &items),
                })
            })
            .collect::<Vec<_>>(),
    );

    children.extend(
        items
            .iter()
            .filter(|&i| match id {
                None => i.folder_id().is_none(),
                Some(id) => i.folder_id().is_some() && i.folder_id().unwrap() == id,
            })
            .map(|item| TreeNode::Item(item))
            .collect::<Vec<_>>(),
    );

    children
}

// Services

#[get("/folder")]
async fn get(pool: web::Data<database::Pool>) -> Result<HttpResponse> {
    use crate::schema::folders::dsl::*;
    let conn = pool.get().chain_err(|| ErrorKind::GetDbConnErr)?;

    let all_folders = web::block(move || folders.load::<Folder>(&conn))
        .await
        .chain_err(|| ErrorKind::SelectFoldersErr)?;

    Ok(HttpResponse::Ok().json(all_folders))
}

#[put("/folder")]
async fn set(pool: web::Data<database::Pool>, folder: web::Json<Folder>) -> Result<HttpResponse> {
    let conn = pool.get().chain_err(|| ErrorKind::GetDbConnErr)?;
    let folder_id = folder.id;

    if folder_id == 0 {
        web::block(move || {
            let new_folder = InsertableFolder {
                parent_id: folder.parent_id.as_ref(),
                name: &folder.name,
                category: &folder.category,
            };

            diesel::insert_into(folders::table)
                .values(&new_folder)
                .execute(&conn)
        })
        .await
        .chain_err(|| ErrorKind::InsertFolderErr(folder_id))
    } else {
        web::block(move || {
            diesel::update(folder.deref())
                .set(folder.deref())
                .execute(&conn)
        })
        .await
        .chain_err(|| ErrorKind::UpdateFolderErr(folder_id))
    }?;

    Ok(HttpResponse::NoContent().finish())
}

#[delete("/folder/{id}")]
async fn del(
    pool: web::Data<database::Pool>,
    web::Path(id): web::Path<i32>,
) -> Result<HttpResponse> {
    use crate::schema::folders::dsl::folders;
    let conn = pool.get().chain_err(|| ErrorKind::GetDbConnErr)?;

    web::block(move || diesel::delete(folders.find(id)).execute(&conn))
        .await
        .chain_err(|| ErrorKind::DeleteFolderErr(id))?;

    Ok(HttpResponse::NoContent().finish())
}

pub fn services(cfg: &mut web::ServiceConfig) {
    cfg.service(get).service(set).service(del);
}
