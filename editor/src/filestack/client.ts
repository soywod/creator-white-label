import * as filestack from "filestack-js";

let client: filestack.Client;

export function getClient() {
  if (!client) {
    client = filestack.init(String(process.env.REACT_APP_FILESTACK_API_KEY));
  }

  return client;
}

export default {getClient};
