import {loading$} from "./loading";
import tokenStorage from "../auth/token-storage";

type RequestMethod = "get" | "post" | "patch" | "put" | "delete";
type RequestData = FormData | any;
type RequestFn = <T>(path: string, data?: RequestData) => Promise<T>;
type RequestProxy = {[key in RequestMethod]: RequestFn};

const methods: RequestMethod[] = ["get", "post", "patch", "put", "delete"];

const request = <T>(method: RequestMethod) => (path: string, data?: RequestData) => {
  loading$.next(true);

  const headers = new Headers([["Authorization", `Bearer ${tokenStorage.get()}`]]);
  let body = data;

  if (data !== undefined && !(data instanceof FormData)) {
    headers.append("Content-Type", "application/json");
    body = JSON.stringify(data);
  }

  return fetch(process.env.REACT_APP_API_URL + path, {method, credentials: "include", headers, body})
    .then<T>(async res => {
      if (!res.ok) {
        throw new Error(await res.text());
      }

      if (res.status !== 204) {
        return res.json();
      }
    })
    .finally(() => loading$.next(false));
};

const requestMap: RequestProxy = Object.assign({}, ...methods.map(m => ({[m]: request(m)})));

export default requestMap;
