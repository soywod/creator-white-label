import notification from "antd/lib/notification";

import request from "../_shared/request";
import Dimension from "./model";

export async function get(): Promise<Dimension[]> {
  return request.get<Dimension[]>("/public/dimension").catch(err => {
    notification.error({message: "Erreur", description: err.message});
    return [];
  });
}

export async function set(dimension: Dimension, notify = true): Promise<void> {
  return request
    .put("/dimension", dimension)
    .then(() => {
      if (notify) {
        notification.success({message: "Succès", description: "Dimension enregistrée avec succès"});
      }
    })
    .catch(err => {
      if (notify) {
        notification.error({message: "Erreur", description: err.message});
      }
      throw err;
    });
}

export async function del(id: number): Promise<void> {
  return request
    .delete(`/dimension/${id}`)
    .then(() => notification.success({message: "Succès", description: "Dimension supprimée avec succès"}))
    .catch(err => notification.error({message: "Erreur", description: err.message}));
}

const $dimension = {get, set, del};
export default $dimension;
