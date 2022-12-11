import notification from "antd/lib/notification";

import request from "../_shared/request";
import {TreeNode, Folder} from "../_shared/folder";
import Template from "./model";

export async function get(): Promise<Template[]>;
export async function get(id: number): Promise<Template>;
export async function get(id?: number): Promise<Template[] | Template> {
  if (typeof id === "number") {
    return request.get<Template>(`/public/template/${id}`).catch(err => {
      notification.error({message: "Erreur", description: err.message});
      return new Template(null);
    });
  } else {
    return request.get<Template[]>("/public/template").catch(err => {
      notification.error({message: "Erreur", description: err.message});
      return [];
    });
  }
}

export async function getFolded(): Promise<Folder<Template>> {
  return request
    .get<TreeNode<Template>[]>("/folded-template")
    .catch(err => {
      notification.error({message: "Erreur", description: err.message});
      return [];
    })
    .then(nodes => new Folder("template", null, nodes));
}

export async function set(template: Template): Promise<void> {
  return request.put<void>("/template", template).catch(err => {
    notification.error({message: "Erreur", description: err.message});
    throw err;
  });
}

export async function del(id: number): Promise<void> {
  return request
    .delete(`/template/${id}`)
    .then(() => notification.success({message: "Succès", description: "Template supprimé avec succès."}))
    .catch(err => notification.error({message: "Erreur", description: err.message}));
}

export const templatesTree$ = {get, getFolded, set, del};
export default templatesTree$;
