import notification from "antd/lib/notification";

import request from "../_shared/request";
import {Application} from "./model";

export async function get(): Promise<Application[]> {
  return request.get<Application[]>("/app").catch(err => {
    notification.error({message: "Error", description: err.message});
    return [];
  });
}

export async function set(app: Application): Promise<void> {
  return request
    .put("/app", app)
    .then(() => notification.success({message: "Succès", description: "Application enregistrée avec succès."}))
    .catch(err => {
      notification.error({message: "Error", description: err.message});
      throw err;
    });
}

export async function del(id: number): Promise<void> {
  return request
    .delete(`/app/${id}`)
    .then(() => notification.success({message: "Succès", description: "Application supprimée avec succès."}))
    .catch(err => notification.error({message: "Error", description: err.message}));
}

export const $app = {get, set, del};
export default $app;
