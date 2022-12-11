import notification from "antd/lib/notification";

import request from "../_shared/request";
import Discount from "./model";

export async function get(): Promise<Discount[]> {
  return request.get<Discount[]>("/public/discount").catch(err => {
    notification.error({message: "Erreur", description: err.message});
    return [];
  });
}

export async function set(discount: Discount): Promise<void> {
  return request
    .put("/discount", discount)
    .then(() => notification.success({message: "Succès", description: "Remise enregistrée avec succès"}))
    .catch(err => {
      notification.error({message: "Erreur", description: err.message});
      throw err;
    });
}

export async function del(id: number): Promise<void> {
  return request
    .delete(`/discount/${id}`)
    .then(() => notification.success({message: "Succès", description: "Remise supprimée avec succès"}))
    .catch(err => notification.error({message: "Erreur", description: err.message}));
}

const $discount = {get, set, del};
export default $discount;
