import React, {FC, useEffect, useState} from "react";
import {fabric} from "fabric";
import Tippy from "@tippyjs/react";
import cn from "classnames";

import {CreatorProps, CreatorSubmitComponentCallbackOutput} from "../app.types";
import {useCanvas} from "../canvas";
import {useOrderContext} from "../order";
import {Discount, fetchDiscounts} from "../discount";
import cs from "./component.module.scss";

const intl = new Intl.NumberFormat("fr-FR", {style: "currency", currency: "EUR"});
export type FooterProps = Pick<CreatorProps, "submitComponent">;

export const Footer: FC<FooterProps> = props => {
  const canvas = useCanvas();
  const SubmitComponent =
    props.submitComponent ||
    (props => <button onClick={() => props.onSubmit().then(res => console.log(res.svg))}>SUBMIT</button>);
  const [order, setOrder] = useOrderContext();
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [quantityStr, setQuantityStr] = useState(order && order.quantity ? order.quantity.toString() : "1");

  useEffect(() => {
    const {signal} = new AbortController();
    fetchDiscounts(signal).then(setDiscounts);
  }, []);

  function quantityDec() {
    if (!order) return;
    const quantity = Math.max(1, order.quantity - 1);
    setQuantityStr(quantity.toString());
  }

  function quantityInc() {
    if (!order) return;
    const quantity = order.quantity + 1;
    setQuantityStr(quantity.toString());
  }

  useEffect(() => {
    const quantity = parseInt(quantityStr);
    if (quantity) setOrder({quantity});
  }, [quantityStr]);

  async function handleSubmit(): Promise<CreatorSubmitComponentCallbackOutput> {
    if (!canvas) throw new Error("Canvas required");
    if (!canvas.clipPath) throw new Error("Canvas clipPath required");
    if (!order) throw new Error("Order required");

    const preview = canvas.toDataURL({format: "png", multiplier: 3, ...canvas.clipPath.getBoundingRect()});
    // var image = new Image();
    // image.src = preview;
    // window.open("")!.document.write(image.outerHTML);

    const config = {
      ...canvas.toDatalessObject(["name", "selectable", "evented"]),
      width: order.width,
      height: order.height,
      productId: order.product ? order.product.id : 0,
      shapeId: order.shape ? order.shape.id : 0,
      fixationId: order.fixation ? order.fixation.id : 0,
    };
    const overlayBoundaries = canvas.clipPath.getBoundingRect();
    canvas.relativePan(
      new fabric.Point(
        -(canvas.getWidth() - overlayBoundaries.width) / 2,
        -(canvas.getHeight() - overlayBoundaries.height) / 2,
      ),
    );
    canvas.setWidth(overlayBoundaries.width);
    canvas.setHeight(overlayBoundaries.height);

    const unit = "cm";
    const width = order.width;
    const height = order.height;
    const x = -canvas.viewportTransform![4] / canvas.getZoom();
    const y = -canvas.viewportTransform![5] / canvas.getZoom();
    const svg = canvas
      .toSVG({
        width: `${width}${unit}`,
        height: `${height}${unit}`,
      })
      .replaceAll('<rect x="0" y="0"', `<rect x="${x}" y="${y}"`)
      .replaceAll(/@font-face \{[\n\t ]*font-family: '.*?';[\n\t ]*src: (url\('.*?'\));[\n\t ]*\}/g, "@import $1;");

    let data: CreatorSubmitComponentCallbackOutput = {
      width: order.width,
      height: order.height,
      weight: order.weight,
      quantity: order.quantity,
      price: order.unitPriceTaxExclDiscounted,
      preview,
      config: JSON.stringify(config),
      svg,
      product: order.product ? order.product.title : "",
    };

    if (order.shape) {
      data.shape = order.shape.tags;
    }

    if (order.fixation) {
      data.fixation = order.fixation.name;
    }

    if (order.product && order.product.transparency > 0) {
      data.isTransparent = true;
    }

    return data;
  }

  const discountsTooltipContent = (
    <>
      <div>Remise quantité :</div>
      <hr />
      {discounts
        .sort((a, b) => a.quantity - b.quantity)
        .map(d => (
          <div key={d.id}>
            {d.quantity} exemplaires -{d.amount}%
          </div>
        ))}
    </>
  );

  return (
    <footer className={cs.container}>
      <div className={cs.product}>{order && order.product ? order.product.title : "-"}</div>
      <div className={cs.fixation}>Fixation : {order && order.fixation ? order.fixation.name : "aucune"}</div>
      <Tippy content={discountsTooltipContent} placement="top" offset={[0, 32]}>
        <div className={cs.quantity}>
          <button className={cs.quantitySubBtn} onClick={quantityDec}>
            -
          </button>
          <input
            className={cs.quantityInput}
            type="number"
            value={quantityStr}
            onChange={evt => setQuantityStr(evt.target.value)}
          />
          <button className={cs.quantityAddBtn} onClick={quantityInc}>
            +
          </button>
        </div>
      </Tippy>
      {order && (
        <div className={cn(cs.totalTaxExcl, {[cs.totalDiscounted]: order.discount > 0})}>
          {intl.format(order.totalTaxExcl)}
        </div>
      )}
      {order && (
        <div className={cn(cs.totalTaxIncl, {[cs.totalDiscounted]: order.discount > 0})}>
          {intl.format(order.totalTaxIncl)} TTC
        </div>
      )}
      {order && order.discount > 0 && (
        <div className={cs.totalTaxExclDiscounted}>
          <span className={cs.totalDiscountAmount}>-{order.discount}%</span>
          {intl.format(order.totalTaxExclDiscounted)}
        </div>
      )}
      {order && order.discount > 0 && (
        <div className={cs.totalTaxInclDiscounted}>{intl.format(order.totalTaxInclDiscounted)} TTC</div>
      )}
      <div className={cs.submitContainer}>
        <SubmitComponent onSubmit={handleSubmit} />
      </div>
    </footer>
  );
};

export default Footer;
