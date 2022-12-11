import React, {FC, useEffect, useMemo, useRef, useState} from "react";
import cn from "classnames";

import {useAsyncContext} from "../async";
import {ModalProps} from "../modal";
import {useOrderContext} from "../order";
import {Shape, fetchShapes} from "../shape";
import {Dimension} from ".";
import {fetchDimensions} from "./api";
import {ReactComponent as IconPortrait} from "./portrait.svg";
import {ReactComponent as IconLandscape} from "./landscape.svg";
import patrick from "./legend.jpeg";
import cs from "./modal.module.scss";

type ShapeComponentProps = {
  shape: Shape;
};

const ShapeComponent: FC<ShapeComponentProps> = props => {
  const {shape} = props;
  const [order, setOrder] = useOrderContext();
  const [__html, setHtml] = useState("");

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL + "/public/" + shape.url}`)
      .then(data => data.text())
      .then(setHtml);
  }, []);

  return (
    <button
      className={cn(cs.shapeBtn, {[cs.active]: order && order.shape && order.shape.id === shape.id})}
      onClick={() => setOrder({shape})}
      dangerouslySetInnerHTML={{__html}}
    />
  );
};

export const DimensionModal: FC<ModalProps> = props => {
  const Footer = props.footer;
  const abortCtrl = useRef<AbortController>();
  const [_, setLoading] = useAsyncContext();
  const [order, setOrder] = useOrderContext();
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [dimensions, setDimensions] = useState<Dimension[]>([]);
  const [moreShapes, showMoreShapes] = useState(false);
  const [moreDimensions, showMoreDimensions] = useState(false);
  const [heightStr, setHeightStr] = useState("");
  const [heightErr, setHeightErr] = useState<string>();
  const [widthStr, setWidthStr] = useState("");
  const [widthErr, setWidthErr] = useState<string>();

  async function fetchData(evt?: React.FormEvent<HTMLFormElement>) {
    evt && evt.preventDefault();
    setLoading(true);

    try {
      abortCtrl.current = new AbortController();
      const {signal} = abortCtrl.current;
      await fetchShapes(signal).then(setShapes);
      await fetchDimensions(signal).then(setDimensions);
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error(err.message);
      }
    }

    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!order) return;
    if (order.width > 0 || order.height > 0) {
      setWidthStr(order.width.toString());
      setHeightStr(order.height.toString());
      setOrder({width: order.width, height: order.height});
    } else if (dimensions.length > 0) {
      const width = dimensions[0].width;
      const height = dimensions[0].height;
      setWidthStr(width.toString());
      setHeightStr(height.toString());
      setOrder({width, height});
    }
  }, [dimensions]);

  function updateHeight(evt: React.ChangeEvent<HTMLInputElement>) {
    const heightStr = evt.target.value.trim().replaceAll(",", ".");
    setHeightStr(heightStr);

    const nextHeight = parseFloat(heightStr);
    if (Number.isNaN(nextHeight) || heightStr !== nextHeight.toString()) {
      setHeightErr("Hauteur invalide");
    } else if (order.product && nextHeight < order.product.minHeight * 0.1) {
      setHeightErr(`Hauteur inf. à ${order.product.minHeight * 0.1}cm`);
    } else if (order.product && nextHeight > order.product.maxHeight * 0.1) {
      setHeightErr(`Hauteur sup. à ${order.product.maxHeight * 0.1}cm`);
    } else {
      setHeightErr(undefined);
      const height = Math.round(nextHeight * 10) / 10;
      setOrder({height});
    }
  }

  function updateWidth(evt: React.ChangeEvent<HTMLInputElement>) {
    const widthStr = evt.target.value.trim().replaceAll(",", ".");
    setWidthStr(widthStr);

    const nextWidth = parseFloat(widthStr);
    if (Number.isNaN(nextWidth) || widthStr !== nextWidth.toString()) {
      setWidthErr("Largeur invalide");
    } else if (order.product && nextWidth < order.product.minWidth * 0.1) {
      setWidthErr(`Largeur inf. à ${order.product.minWidth * 0.1}cm`);
    } else if (order.product && nextWidth > order.product.maxWidth * 0.1) {
      setWidthErr(`Largeur sup. à ${order.product.maxWidth * 0.1}cm`);
    } else {
      setWidthErr(undefined);
      const width = Math.round(nextWidth * 10) / 10;
      setOrder({width});
    }
  }

  function updateDimension(dimension: Dimension) {
    return () => {
      setOrder({width: dimension.width, height: dimension.height});
      setWidthErr(undefined);
      setWidthStr(dimension.width.toString());
      setHeightErr(undefined);
      setHeightStr(dimension.height.toString());
    };
  }

  const previewContainer = useRef<HTMLDivElement>(null);
  const preview = useRef<HTMLImageElement>(null);
  const legend = useRef<HTMLImageElement>(null);

  const previewHeight = useMemo(() => {
    if (!order) return 0;
    if (!legend.current) return 0;
    // TODO: improve algo
    if (order.height > 180) {
      legend.current.style.transform = `scale(${180 / order.height})`;
      return legend.current.height;
    } else {
      legend.current.style.transform = "none";
      return (legend.current.getBoundingClientRect().height * order.height) / 180;
    }
  }, [order]);

  useEffect(() => {
    if (!order) return;
    if (!preview.current) return;
    if (!previewContainer.current) return;
    const width = (previewHeight * order.height) / order.width;
    preview.current.style.transform = `scaleX(${preview.current.clientWidth / width})`;
    if (previewContainer.current.clientWidth < previewContainer.current.scrollWidth) {
      previewContainer.current.style.transform = `scale(${
        previewContainer.current.clientWidth / previewContainer.current.scrollWidth
      })`;
    } else {
      previewContainer.current.style.transform = `none`;
    }
  }, [previewHeight, order]);

  function setOrientationLandscape() {
    if (!order) return;
    if (order.width < order.height) {
      setOrder({width: order.height, height: order.width});
      setWidthStr(order.height.toString());
      setHeightStr(order.width.toString());
    }
  }

  function setOrientationPortrait() {
    if (!order) return;
    if (order.width > order.height) {
      setOrder({width: order.height, height: order.width});
      setWidthStr(order.height.toString());
      setHeightStr(order.width.toString());
    }
  }

  const orientationStr = (() => {
    if (!order) return;
    if (order.width > order.height) return " (paysage)";
    else if (order.width < order.height) return " (portrait)";
    else return;
  })();

  return (
    <>
      <div className={cs.modal}>
        <h2 className={cs.title}>Choisissez votre format</h2>
        <div className={cs.container}>
          <div className={cs.shapes}>
            <h3 className={cs.subtitle}>Forme de découpe</h3>
            <div className={cs.card}>
              <div className={cs.shapesGrid}>
                {shapes.slice(0, 5).map(shape => (
                  <ShapeComponent key={shape.id} shape={shape} />
                ))}
                {moreShapes && shapes.slice(5).map(shape => <ShapeComponent key={shape.id} shape={shape} />)}
              </div>
              {!moreShapes && (
                <div className={cs.moreContainer}>
                  <button className={cs.more} onClick={() => showMoreShapes(true)}>
                    Voir plus
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className={cs.dimensions}>
            <h3 className={cs.subtitle}>Dimension</h3>
            <div className={cs.card}>
              <form className={cs.dimensionForm}>
                <label htmlFor="width" className={cn(cs.dimensionFormLabel, {[cs.dimensionFormLabelErr]: widthErr})}>
                  {widthErr || "Largeur"}
                </label>
                <input
                  className={cn(cs.dimensionFormInput, {[cs.dimensionFormInputErr]: widthErr})}
                  id="width"
                  type="text"
                  onChange={updateWidth}
                  value={widthStr}
                  min={order.product ? order.product.minWidth : undefined}
                  max={order.product ? order.product.maxWidth : undefined}
                />
                <span className={cs.dimensionFormTimes}>&times;</span>
                <label htmlFor="height" className={cn(cs.dimensionFormLabel, {[cs.dimensionFormLabelErr]: heightErr})}>
                  {heightErr || "Hauteur"}
                </label>
                <input
                  className={cn(cs.dimensionFormInput, {[cs.dimensionFormInputErr]: heightErr})}
                  id="height"
                  type="text"
                  onChange={updateHeight}
                  value={heightStr}
                  min={order.product ? order.product.minHeight : undefined}
                  max={order.product ? order.product.maxHeight : undefined}
                />
                <span className={cs.dimensionFormUnit}>cm</span>
              </form>
              <div className={cs.dimensionSeparator}>
                <span className={cs.dimensionSeparatorBar} />
                <span className={cs.dimensionSeparatorText}>ou</span>
              </div>
              <div className={cs.dimensionSeparatorSubtext}>Formats prédéfinis</div>
              <div className={cs.dimensionsGrid}>
                {dimensions
                  .sort((a, b) => a.pos - b.pos)
                  .slice(0, 4)
                  .map(dimension => (
                    <button
                      key={dimension.id}
                      className={cn(cs.dimensionBtn, {
                        [cs.active]:
                          (order && order.width === dimension.width && order.height === dimension.height) ||
                          (order && order.width === dimension.height && order.height === dimension.width),
                      })}
                      onClick={updateDimension(dimension)}
                    >
                      <h4 className={cs.dimensionBtnTitle}>{dimension.name}</h4>
                      <p className={cs.dimensionBtnDesc}>
                        {dimension.width} &times; {dimension.height} cm
                      </p>
                    </button>
                  ))}
                {moreDimensions &&
                  dimensions
                    .sort((a, b) => a.pos - b.pos)
                    .slice(4)
                    .map(dimension => (
                      <button
                        key={dimension.id}
                        className={cn(cs.dimensionBtn, {
                          [cs.active]: order && order.width === dimension.width && order.height === dimension.height,
                        })}
                        onClick={updateDimension(dimension)}
                      >
                        <h4 className={cs.dimensionBtnTitle}>{dimension.name}</h4>
                        <p className={cs.dimensionBtnDesc}>
                          {dimension.width} &times; {dimension.height} cm
                        </p>
                      </button>
                    ))}
              </div>
              {!moreDimensions && (
                <div className={cs.moreContainer}>
                  <button className={cs.more} onClick={() => showMoreDimensions(true)}>
                    Voir plus
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className={cs.previewContainer}>
            <h3 className={cs.subtitle}>Orientation</h3>
            <div className={cs.orientationContainer}>
              <button
                className={cn(cs.orientationLandscapeBtn, {[cs.active]: order && order.width > order.height})}
                onClick={setOrientationLandscape}
              >
                <IconLandscape className={cs.orientationIcon} />
              </button>
              <button
                className={cn(cs.orientationPortraitBtn, {[cs.active]: order && order.width < order.height})}
                onClick={setOrientationPortrait}
              >
                <IconPortrait className={cs.orientationIcon} />
              </button>
            </div>
            <h3 className={cs.subtitle}>Aperçu</h3>
            <div ref={previewContainer} className={cs.legendContainer}>
              <img ref={legend} className={cs.legend} src={patrick} alt="Légende" />
              <div className={cs.preview}>
                {order && order.shape && (
                  <img
                    ref={preview}
                    className={cs.previewImg}
                    src={process.env.REACT_APP_API_URL + "/public/" + order.shape.url}
                    alt=""
                    height={previewHeight}
                  />
                )}
                <span
                  className={cs.previewWidth}
                  style={{
                    transform: `translateY(calc(-50% - 0.5rem - ${
                      preview.current && preview.current.getBoundingClientRect().height * 0.5
                    }px))`,
                  }}
                >
                  {order && (
                    <>
                      <strong>{order.width}</strong> cm
                    </>
                  )}
                </span>
                <span
                  className={cs.previewHeight}
                  style={{
                    transform: `translateX(calc(50% + 0.5rem + ${
                      preview.current && preview.current.getBoundingClientRect().width * 0.5
                    }px))`,
                  }}
                >
                  {order && (
                    <>
                      <strong>{order.height}</strong> cm
                    </>
                  )}
                </span>
              </div>
              <span />
            </div>
          </div>
        </div>
      </div>
      <div className={cs.footer}>
        {Footer ? (
          <Footer />
        ) : (
          <>
            {order && (
              <span className={cs.footerProduct}>
                Dimensions :{" "}
                <strong>
                  {widthStr} &times; {heightStr} cm{orientationStr}
                </strong>
              </span>
            )}
            <button className={cs.footerSubmit} onClick={props.onClose}>
              Valider
            </button>
          </>
        )}
      </div>
    </>
  );
};

export default DimensionModal;
