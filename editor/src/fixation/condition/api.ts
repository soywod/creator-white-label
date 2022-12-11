import request from "../../request";
import Fixation from "../model";
import FixationCondition from "./model";

type FetchFixationConditionsResponse = {
  fixation: Fixation;
  conditions: FixationCondition[];
};

export async function fetchFixationConditions(sig: AbortSignal, id: number): Promise<FetchFixationConditionsResponse> {
  return request.get(sig, `/public/fixation/${id}/conditions/`);
}

export default {fetchFixationConditions};
