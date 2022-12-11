import request from "../request";
import Fixation from "./model";

type FetchFixationsResponse = Fixation[];
type FetchFixationResponse = Fixation;

export async function fetchFixations(sig: AbortSignal): Promise<FetchFixationsResponse> {
  return request.get(sig, "/public/fixation/");
}

export async function fetchFixation(sig: AbortSignal, id = 0): Promise<FetchFixationResponse> {
  return request.get(sig, `/public/fixation/${id}/`);
}

export default {fetchFixations};
