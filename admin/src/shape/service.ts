import notification from "antd/lib/notification";

import request from "../_shared/request";
import {TreeNode, Folder} from "../_shared/folder";
import Shape from "./model";

export async function get(): Promise<Shape[]> {
  return request.get<Shape[]>("/public/shape").catch(err => {
    notification.error({message: "Erreur", description: err.message});
    return [];
  });
}

export async function getFolded(): Promise<Folder<Shape>> {
  return request
    .get<TreeNode<Shape>[]>("/folded-shape")
    .catch(err => {
      notification.error({message: "Erreur", description: err.message});
      return [];
    })
    .then(nodes => new Folder("shape", null, nodes));
}

export async function set(shape: Shape): Promise<void> {
  return request.put<void>("/shape", shape).catch(err => {
    notification.error({message: "Erreur", description: err.message});
    throw err;
  });
}

export async function del(id: number): Promise<void> {
  return request
    .delete(`/shape/${id}`)
    .then(() => notification.success({message: "Succès", description: "Forme supprimée avec succès."}))
    .catch(err => notification.error({message: "Erreur", description: err.message}));
}

export const shapesTree$ = {get, getFolded, set, del};
export default shapesTree$;
