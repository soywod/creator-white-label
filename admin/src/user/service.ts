import notification from "antd/lib/notification";

import request from "../_shared/request";
import User from "./model";

export async function get(): Promise<User[]> {
  return request
    .get<User[]>("/user")
    .catch(err => {
      notification.error({message: "Erreur", description: err.message});
      return [];
    });
}

export async function set(user: User): Promise<void> {
  return request
    .put("/user", user)
    .then(() => notification.success({message: "Succès", description: "Utilisateur enregistré avec succès"}))
    .catch(err => {
      notification.error({message: "Erreur", description: err.message});
      throw err;
    });
}

export async function del(id: number): Promise<void> {
  return request
    .delete(`/user/${id}`)
    .then(() => notification.success({message: "Succès", description: "Utilisateur supprimé avec succès"}))
    .catch(err => notification.error({message: "Erreur", description: err.message}));
}

const $user = {get, set, del};
export default $user;
