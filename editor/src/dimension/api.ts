import request from "../request";
import Dimension from "./model";

type FetchDimensionsResponse = Dimension[];

export async function fetchDimensions(sig: AbortSignal): Promise<FetchDimensionsResponse> {
  return request
    .get<FetchDimensionsResponse>(sig, "/public/dimension/")
    .then(dimensions => dimensions.map(d => ({...d, width: d.width / 10, height: d.height / 10})));
}

export default {fetchDimensions};
