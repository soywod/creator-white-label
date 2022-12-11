import request from "../../request";
import Badge from "./model";

type FetchBadgesResponse = Badge[];

export async function fetchBadges(sig: AbortSignal): Promise<FetchBadgesResponse> {
  return request.get(sig, "/public/badge/");
}

export default {fetchBadges};
