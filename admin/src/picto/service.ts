import notification from "antd/lib/notification";

import request from "../_shared/request";
import {TreeNode, Folder} from "../_shared/folder";
import Picto from "./model";

export async function get(): Promise<Folder<Picto>> {
  return request
    .get<TreeNode<Picto>[]>("/public/picto")
    .catch(err => {
      notification.error({message: "Erreur", description: err.message});
      return [];
    })
    .then(nodes => new Folder("picto", null, nodes));
}

export async function set(picto: Picto): Promise<void> {
  return request.put<void>("/picto", picto).catch(err => {
    notification.error({message: "Erreur", description: err.message});
    throw err;
  });
}

export async function del(id: number): Promise<void> {
  return request
    .delete(`/picto/${id}`)
    .then(() => notification.success({message: "Succès", description: "Pictogramme supprimé avec succès."}))
    .catch(err => notification.error({message: "Erreur", description: err.message}));
}

export const pictosTree$ = {get, set, del};
export default pictosTree$;
