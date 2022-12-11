use diesel::prelude::*;
use error_chain::error_chain;
use serde::{Deserialize, Serialize};

use crate::database;
use crate::schema::fixation_conditions;

// Error management

error_chain! {
    errors {
        SelectFixationConditionsErr(id: i32) {
            description("Impossible de récupérer la liste des conditions associées à la fixation")
            display("Could not select fixation_conditions `{}`", id)
        }
        InsertFixationConditionsErr(id: i32) {
            description("Impossible de rattacher les conditions à la fixation")
            display("Could not select fixation_conditions `{}`", id)
        }
        DeleteFixationConditionsErr(id: i32) {
            description("Impossible de supprimer les conditions associées à la fixation")
            display("Could not select fixation_conditions `{}`", id)
        }
    }
}

// Models

#[derive(
    Debug, Clone, Identifiable, Queryable, Associations, AsChangeset, Serialize, Deserialize,
)]
#[serde(rename_all = "camelCase")]
pub struct FixationCondition {
    pub id: i32,
    pub fixation_id: i32,
    pub shape_id: i32,
    pub area_min: Option<i32>,
    pub area_max: Option<i32>,
    pub padding_h: Option<f32>,
    pub padding_v: Option<f32>,
    pub pos_tl: Option<bool>,
    pub pos_tc: Option<bool>,
    pub pos_tr: Option<bool>,
    pub pos_cl: Option<bool>,
    pub pos_cr: Option<bool>,
    pub pos_bl: Option<bool>,
    pub pos_bc: Option<bool>,
    pub pos_br: Option<bool>,
}

#[derive(Insertable)]
#[table_name = "fixation_conditions"]
struct InsertableFixationCondition<'a> {
    pub fixation_id: &'a i32,
    pub shape_id: &'a i32,
    pub area_min: Option<&'a i32>,
    pub area_max: Option<&'a i32>,
    pub padding_h: Option<&'a f32>,
    pub padding_v: Option<&'a f32>,
    pub pos_tl: Option<&'a bool>,
    pub pos_tc: Option<&'a bool>,
    pub pos_tr: Option<&'a bool>,
    pub pos_cl: Option<&'a bool>,
    pub pos_cr: Option<&'a bool>,
    pub pos_bl: Option<&'a bool>,
    pub pos_bc: Option<&'a bool>,
    pub pos_br: Option<&'a bool>,
}

// Services

pub fn get(conn: &database::PooledConnection, fixation_id: i32) -> Result<Vec<FixationCondition>> {
    use crate::schema::fixation_conditions::dsl;

    let fixation_conditions = dsl::fixation_conditions
        .filter(dsl::fixation_id.eq(fixation_id))
        .load::<FixationCondition>(conn)
        .chain_err(|| ErrorKind::SelectFixationConditionsErr(fixation_id))?;

    Ok(fixation_conditions)
}

pub fn set(
    conn: &database::PooledConnection,
    fixation_id: i32,
    conditions: &[FixationCondition],
) -> Result<()> {
    let conditions: Vec<InsertableFixationCondition> = conditions
        .iter()
        .map(|condition| InsertableFixationCondition {
            fixation_id: &fixation_id,
            shape_id: &condition.shape_id,
            area_min: condition.area_min.as_ref(),
            area_max: condition.area_max.as_ref(),
            padding_h: condition.padding_h.as_ref(),
            padding_v: condition.padding_v.as_ref(),
            pos_tl: condition.pos_tl.as_ref(),
            pos_tc: condition.pos_tc.as_ref(),
            pos_tr: condition.pos_tr.as_ref(),
            pos_cl: condition.pos_cl.as_ref(),
            pos_cr: condition.pos_cr.as_ref(),
            pos_bl: condition.pos_bl.as_ref(),
            pos_bc: condition.pos_bc.as_ref(),
            pos_br: condition.pos_br.as_ref(),
        })
        .collect();

    diesel::insert_into(fixation_conditions::table)
        .values(&conditions)
        .execute(conn)
        .chain_err(|| ErrorKind::InsertFixationConditionsErr(fixation_id))?;

    Ok(())
}

pub fn del(conn: &database::PooledConnection, fixation_id: i32) -> Result<()> {
    use crate::schema::fixation_conditions::dsl;

    diesel::delete(fixation_conditions::table)
        .filter(dsl::fixation_id.eq(fixation_id))
        .execute(conn)
        .chain_err(|| ErrorKind::DeleteFixationConditionsErr(fixation_id))?;

    Ok(())
}
