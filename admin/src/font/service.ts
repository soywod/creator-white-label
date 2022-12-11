import notification from "antd/lib/notification";

import request from "../_shared/request";
import Font from "./model";

export async function get(): Promise<Font[]> {
  return request
    .get<Font[]>("/font")
    .catch(err => {
      notification.error({message: "Erreur", description: err.message});
      return [];
    });
}

export async function set(font: Font): Promise<void> {
  return request
    .put("/font", font)
    .then(() => notification.success({message: "Succès", description: "Police enregistrée avec succès"}))
    .catch(err => {
      notification.error({message: "Erreur", description: err.message});
      throw err;
    });
}

export async function del(id: number): Promise<void> {
  return request
    .delete(`/font/${id}`)
    .then(() => notification.success({message: "Succès", description: "Police supprimée avec succès"}))
    .catch(err => notification.error({message: "Erreur", description: err.message}));
}

const $font = {get, set, del};
export default $font;
