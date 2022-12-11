import request from "./request";

export async function upload<T>(file: File) {
  const data = new FormData();
  data.append("file", file);
  return request.put<T>("/upload", data);
}
