import request from "../request";
import Shape from "./model";

type FetchShapesResponse = Shape[];
type FetchShapeResponse = Shape;

export async function fetchShapes(sig: AbortSignal): Promise<FetchShapesResponse> {
  return request.get(sig, "/public/shape/");
}

export async function fetchShape(sig: AbortSignal, id = 0): Promise<FetchShapeResponse> {
  return request.get(sig, `/public/shape/${id}/`);
}

export default {fetchShapes};
