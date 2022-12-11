import request from "../request";
import Product from "./model";

type FetchProductsResponse = Product[];
type FetchProductResponse = Product;

export async function fetchProducts(sig: AbortSignal): Promise<FetchProductsResponse> {
  // TODO: rename material to product
  return request.get(sig, "/public/material/");
}

export async function fetchProduct(sig: AbortSignal, id = 0): Promise<FetchProductResponse> {
  // TODO: rename material to product
  return request.get(sig, `/public/material/${id}/`);
}

export default {fetchProducts};
