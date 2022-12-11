import request from "../request";
import {Discount} from "./model";

export async function fetchDiscounts(sig: AbortSignal): Promise<Discount[]> {
  return request.get(sig, "/public/discount/");
}

export default {fetchDiscounts};
