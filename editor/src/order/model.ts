import {Product} from "../product";
import {Fixation, FixationCondition} from "../fixation";
import {Shape} from "../shape";

export type Order = {
  ready: boolean;
  quantity: number;
  discount: number;
  totalTaxExcl: number;
  totalTaxIncl: number;
  unitPriceTaxExclDiscounted: number;
  totalTaxExclDiscounted: number;
  totalTaxInclDiscounted: number;
  width: number;
  height: number;
  weight: number;
  product?: Product;
  fixation?: Fixation;
  condition?: FixationCondition;
  shape?: Shape;
};

export function newOrder(): Order {
  return {
    ready: false,
    quantity: 1,
    totalTaxExcl: 0,
    totalTaxIncl: 0,
    discount: 0,
    unitPriceTaxExclDiscounted: 0,
    totalTaxExclDiscounted: 0,
    totalTaxInclDiscounted: 0,
    width: 0,
    height: 0,
    weight: 0,
  };
}

export function orderToStringifiableRecord(order: Order) {
  return {
    materialId: order.product ? order.product.id : 0,
    fixationId: order.fixation ? order.fixation.id : 0,
    shapeId: order.shape ? order.shape.id : 0,
    quantity: order.quantity,
    totalTaxExcl: order.totalTaxExcl,
    totalTaxIncl: order.totalTaxIncl,
    width: Math.round(order.width * 10),
    height: Math.round(order.height * 10),
  };
}
