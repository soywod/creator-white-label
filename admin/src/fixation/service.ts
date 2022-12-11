import notification from "antd/lib/notification";

import request from "../_shared/request";
import Fixation, {FixationCondition} from "./model";
import Shape from "../shape/model";

type FixationResponse = {
  fixation: Fixation;
  conditions: FixationCondition[];
  shapes: Shape[];
};

export async function get(): Promise<Fixation[]>;
export async function get(id: number): Promise<FixationResponse>;
export async function get(id?: number): Promise<Fixation[] | FixationResponse> {
  if (typeof id === "number") {
    return request.get<FixationResponse>(`/public/fixation/${id}/conditions`).catch(err => {
      notification.error({message: "Erreur", description: err.message});
      return {fixation: new Fixation(), conditions: [], shapes: []};
    });
  } else {
    return request.get<Fixation[]>("/public/fixation").catch(err => {
      notification.error({message: "Erreur", description: err.message});
      return [];
    });
  }
}

export async function set(fixation: Fixation): Promise<void> {
  return request
    .put("/fixation", fixation)
    .then(() => notification.success({message: "Succès", description: "Fixation enregistrée avec succès"}))
    .catch(err => {
      notification.error({message: "Erreur", description: err.message});
      throw err;
    });
}

export async function del(id: number): Promise<void> {
  return request
    .delete(`/fixation/${id}`)
    .then(() => notification.success({message: "Succès", description: "Fixation supprimée avec succès"}))
    .catch(err => notification.error({message: "Erreur", description: err.message}));
}

const $fixation = {get, set, del};
export default $fixation;
