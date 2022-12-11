import request from "../request";
import Template from "./model";

type FetchTemplateResponse = Template;

export async function fetchTemplate(sig: AbortSignal, id = 0): Promise<FetchTemplateResponse> {
  return request.get(sig, `/public/template/${id}/`);
}

export default {fetchTemplate};
