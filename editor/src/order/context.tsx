import React, {FC, useContext, createContext, useCallback, useEffect, useRef, useState} from "react";
import {fabric} from "fabric";

import {CreatorProps} from "../app.types";
import {useCanvas} from "../canvas";
import {fetchTemplate} from "../template";
import {fetchProducts} from "../product";
import {fetchDimensions} from "../dimension";
import {fetchShapes} from "../shape";
import {fetchFixations} from "../fixation";
import {fetchOrder} from ".";

import {Order as OrderState, newOrder} from "./model";

type OrderUpdater = (update: Partial<OrderState>) => void;
type OrderContext = [OrderState, OrderUpdater];

const context = createContext<OrderContext>([newOrder(), () => {}]);

export type OrderContextProviderProps = Pick<CreatorProps, "templateId" | "config" | "productId">;

export const OrderContextProvider: FC<OrderContextProviderProps> = props => {
  const canvas = useCanvas();
  const abortCtrl = useRef<AbortController>();
  const [state, setState] = useState<OrderState>(newOrder());
  const updateState: OrderUpdater = useCallback(
    update => {
      if (!canvas) return;
      setState(state => {
        abortCtrl.current = new AbortController();
        const nextState = Object.assign({}, state, update);
        const {signal} = abortCtrl.current;
        fetchOrder(signal, nextState).then(order => {
          setState(
            Object.assign({}, nextState, {
              discount: order.discount,
              totalTaxIncl: order.totalTaxIncl,
              totalTaxExcl: order.totalTaxExcl,
              unitPriceTaxExclDiscounted: order.unitPriceTaxExclDiscounted,
              totalTaxExclDiscounted: order.totalTaxExclDiscounted,
              totalTaxInclDiscounted: order.totalTaxInclDiscounted,
              fixation: order.fixation || null,
              condition: order.condition || null,
            }),
          );
        });
        return nextState;
      });
    },
    [canvas],
  );

  useEffect(() => {
    if (!canvas) return;
    const {signal} = new AbortController();
    Promise.all([
      fetchTemplate(signal, props.templateId),
      fetchProducts(signal),
      fetchDimensions(signal),
      fetchShapes(signal),
      fetchFixations(signal),
    ]).then(async ([template, products, dimensions, shapes, fixations]) => {
      const hasConfig = (template && template.config) || props.config;
      const config = {...(template.config ? JSON.parse(template.config) : props.config)};
      const update: Partial<OrderState> = {ready: true};

      const product = products.find(p => p.id === config.productId || p.id === props.productId) || products[0];
      update.product = product;

      const shape = shapes.find(s => s.id === config.shapeId) || shapes[0];
      update.shape = shape;

      const fixation = fixations.find(f => f.id === config.fixationId) || fixations[0];
      update.fixation = fixation;

      const width = config.width || dimensions[0].width;
      update.width = width;

      const height = config.height || dimensions[0].height;
      update.height = height;

      await new Promise<void>(resolve => {
        if (update.shape) {
          fabric.loadSVGFromURL(
            process.env.REACT_APP_API_URL + "/public/" + shape.url,
            (objs, opts) => {
              const overlay =
                shape.tags === "coins-arrondis"
                  ? new fabric.Rect({
                      width: 500,
                      height: 500,
                      rx: 30,
                      ry: (width / height) * 30,
                    })
                  : fabric.util.groupSVGElements(objs, opts);
              const canvasCenter = canvas.getVpCenter();
              overlay.originX = "center";
              overlay.originY = "center";
              overlay.left = canvasCenter.x;
              overlay.top = canvasCenter.y;
              overlay.scaleX = width / height;
              canvas.clipPath = overlay;
              canvas.requestRenderAll();
              resolve();
            },
            undefined,
            {crossOrigin: "anonymous"},
          );
        }
      });

      if (hasConfig) {
        canvas.loadFromJSON(config, () => updateState(update));
      } else {
        updateState(update);
      }
    });
  }, [canvas, updateState, props.templateId, props.config]);

  return <context.Provider value={[state, updateState]}>{props.children}</context.Provider>;
};

export function useOrderContext(): OrderContext {
  return useContext(context);
}

export function useOrder(): OrderState {
  return useContext(context)[0];
}
