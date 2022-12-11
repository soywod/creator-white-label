use crate::schema::users;
use serde::Deserialize;

#[derive(Debug, Queryable, Deserialize)]
pub struct User {
    pub id: u32,
    pub username: String,
    pub password: String,
    pub token: Option<String>,
    pub is_admin: u8,
}

#[derive(Insertable)]
#[table_name = "users"]
pub struct NewUser<'a> {
    pub username: &'a str,
    pub password: &'a str,
}
