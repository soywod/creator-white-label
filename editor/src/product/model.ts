export type Product = {
  id: number;
  title: string;
  description: string;
  background: string;
  preview: string;
  more?: string;
  transparency: number;
  minWidth: number;
  maxWidth: number;
  minHeight: number;
  maxHeight: number;
  badgeIds: number[];
  fixationIds: number[];
};

export function hasMore(product: Product) {
  if (product.more === undefined) return false;
  if (product.more === "") return false;
  if (product.more === "<p><br></p>") return false;
  return true;
}

export default Product;
