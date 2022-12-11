import notification from "antd/lib/notification";

import request from "../../_shared/request";
import Badge from "./model";

export async function get(): Promise<Badge[]> {
  return request.get<Badge[]>("/public/badge").catch(err => {
    notification.error({message: "Erreur", description: err.message});
    return [];
  });
}

export async function set(badge: Badge): Promise<void> {
  return request
    .put("/badge", badge)
    .then(() => notification.success({message: "Succès", description: "Badge enregistré avec succès"}))
    .catch(err => {
      notification.error({message: "Erreur", description: err.message});
      throw err;
    });
}

export async function del(id: number): Promise<void> {
  return request
    .delete(`/badge/${id}`)
    .then(() => notification.success({message: "Succès", description: "Badge supprimé avec succès"}))
    .catch(err => notification.error({message: "Erreur", description: err.message}));
}

const $badge = {get, set, del};
export default $badge;
