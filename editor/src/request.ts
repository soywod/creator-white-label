type RequestMethod = "get" | "post" | "patch" | "put" | "delete";
type RequestData = FormData | any;
type RequestFn = <T>(sig: AbortSignal, path: string, data?: RequestData) => Promise<T>;
type RequestProxy = {[key in RequestMethod]: RequestFn};

const methods: RequestMethod[] = ["get", "post", "patch", "put", "delete"];

const request =
  <T>(method: RequestMethod) =>
  async (signal: AbortSignal, path: string, data?: RequestData) => {
    const headers = new Headers();
    let body = data;

    if (data !== undefined && !(data instanceof FormData)) {
      headers.append("Content-Type", "application/json");
      body = JSON.stringify(data);
    }

    return fetch(process.env.REACT_APP_API_URL + path, {
      method,
      credentials: "include",
      headers,
      body,
      signal,
    }).then<T>(async res => {
      if (!res.ok) {
        throw new Error(await res.text());
      }

      if (res.status !== 204) {
        return res.json();
      }
    });
  };

const requestMap: RequestProxy = Object.assign({}, ...methods.map(m => ({[m]: request(m)})));

export default requestMap;
