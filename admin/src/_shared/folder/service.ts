import notification from "antd/lib/notification";

import request from "../request";
import Folder from "./model";

export async function get(): Promise<Folder<any>[]> {
  return request.get<Folder<any>[]>("/folder").catch(err => {
    notification.error({message: "Erreur", description: err.message});
    return [];
  });
}

export async function set<T>(folder: Folder<T>): Promise<void> {
  return request.put<void>("/folder", folder).catch(err => {
    notification.error({message: "Erreur", description: err.message});
    throw err;
  });
}

export async function del(id: number): Promise<void> {
  return request
    .delete(`/folder/${id}`)
    .then(() => notification.success({message: "Succès", description: "Dossier supprimé avec succès"}))
    .catch(err => notification.error({message: "Erreur", description: err.message}));
}

export const $folder = {get, set, del};
export default $folder;
