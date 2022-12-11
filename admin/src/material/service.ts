import notification from "antd/lib/notification";

import request from "../_shared/request";
import Material from "./model";

export async function get(): Promise<Material[]> {
  return request.get<Material[]>("/public/material").catch(err => {
    notification.error({message: "Erreur", description: err.message});
    return [];
  });
}

export async function set(material: Material): Promise<void> {
  return request
    .put("/material", material)
    .then(() => notification.success({message: "Succès", description: "Matériau enregistré avec succès"}))
    .catch(err => {
      notification.error({message: "Erreur", description: err.message});
      throw err;
    });
}

export async function del(id: number): Promise<void> {
  return request
    .delete(`/material/${id}`)
    .then(() => notification.success({message: "Succès", description: "Matériau supprimé avec succès"}))
    .catch(err => notification.error({message: "Erreur", description: err.message}));
}

const $material = {get, set, del};
export default $material;
