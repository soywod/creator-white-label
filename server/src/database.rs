use diesel::{pg::PgConnection, r2d2};
use dotenv::dotenv;
use error_chain::error_chain;
use std::env;

error_chain! {}

pub type Pool = r2d2::Pool<r2d2::ConnectionManager<PgConnection>>;
pub type PooledConnection = r2d2::PooledConnection<r2d2::ConnectionManager<PgConnection>>;

pub fn get_conn_pool() -> Result<Pool> {
    dotenv().chain_err(|| "Could not initialize dotenv")?;
    let url = env::var("DATABASE_URL").chain_err(|| "Could not find `DATABASE_URL` env var")?;
    Ok(Pool::new(r2d2::ConnectionManager::new(url))
        .chain_err(|| "Could not create mysql connection pool")?)
}
