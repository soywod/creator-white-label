import qs from "query-string";

import request from "../request";
import {Order, orderToStringifiableRecord} from "./model";
import {Fixation, FixationCondition} from "../fixation";

type FetchOrderResponse = {
  discount: number;
  totalTaxIncl: number;
  totalTaxExcl: number;
  unitPriceTaxExclDiscounted: number;
  totalTaxExclDiscounted: number;
  totalTaxInclDiscounted: number;
  fixation: Fixation | null;
  condition: FixationCondition | null;
};

export async function fetchOrder(sig: AbortSignal, order: Order): Promise<FetchOrderResponse> {
  return request.get(sig, qs.stringifyUrl({url: "/public/order/", query: orderToStringifiableRecord(order)}));
}

export default {fetchOrder};
