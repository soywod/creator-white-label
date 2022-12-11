import request from "../request";
import Picto from "./model";

type FetchPictosResponse = {
  pictos: Picto[];
  suggestion: string;
};

export async function fetchPictos(sig: AbortSignal, search?: string): Promise<FetchPictosResponse> {
  return request.get(sig, `/public/picto/?search=${search}`);
}

export default {fetchPictos};
