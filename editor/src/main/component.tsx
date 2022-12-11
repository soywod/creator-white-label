import React, {FC, useCallback, useEffect, useRef, useState} from "react";
import {fabric} from "fabric";

import {useCanvasContext, useActiveObj, useActiveTextObj, fitTextboxToContent, Popover} from "../canvas";
import {useOrder} from "../order";
import {FixationCondition} from "../fixation";
import cs from "./component.module.scss";

const intl = new Intl.NumberFormat("fr-FR", {});
const rem4 = parseFloat(getComputedStyle(document.documentElement).fontSize) * 4;

type StickyState<T> = T & {
  diff: number;
};

type StickyCenterX = {
  x: number;
  src: "canvas" | "object";
};

type StickyCenterY = {
  y: number;
  src: "canvas" | "object";
};

type StickyEdgeX = {
  x: number;
  src: "canvas" | "object";
  pos: "left" | "right";
};

type StickyEdgeY = {
  y: number;
  src: "canvas" | "object";
  pos: "top" | "bottom";
};

function shouldStick(diff: number) {
  return diff < 7;
}

function getStickyCenterX(obj: fabric.Object): StickyCenterX[] {
  return [{x: obj.getPointByOrigin("center", "center").x, src: "object"}];
}

function getStickyCenterY(obj: fabric.Object): StickyCenterY[] {
  return [{y: obj.getPointByOrigin("center", "center").y, src: "object"}];
}

function getStickyEdgeX(obj: fabric.Object): StickyEdgeX[] {
  const {x} = obj.getPointByOrigin("center", "center");
  const r = obj.getScaledWidth() * 0.5;
  return [
    {pos: "left", src: "object", x: x - r},
    {pos: "right", src: "object", x: x + r},
  ];
}

function getStickyEdgeY(obj: fabric.Object): StickyEdgeY[] {
  const {y} = obj.getPointByOrigin("center", "center");
  const r = obj.getScaledHeight() * 0.5;
  return [
    {pos: "top", src: "object", y: y - r},
    {pos: "bottom", src: "object", y: y + r},
  ];
}

function defaultStickyEdgeXState(): StickyState<StickyEdgeX> {
  return {
    pos: "left",
    src: "object",
    x: Infinity,
    diff: Infinity,
  };
}

function defaultStickyCenterXState(): StickyState<StickyCenterX> {
  return {
    x: Infinity,
    src: "object",
    diff: Infinity,
  };
}

function defaultStickyEdgeYState(): StickyState<StickyEdgeY> {
  return {
    pos: "top",
    y: Infinity,
    src: "object",
    diff: Infinity,
  };
}

function defaultStickyCenterYState(): StickyState<StickyCenterY> {
  return {
    y: Infinity,
    src: "object",
    diff: Infinity,
  };
}

// Avoid fabricjs to break lines on space
// eslint-disable-next-line
fabric.Textbox.prototype._wordJoiners = /[]/;

export const Main: FC = () => {
  const [canvas, setCanvas] = useCanvasContext();
  const [widthTrans, setWidthTrans] = useState(0);
  const [heightTrans, setHeightTrans] = useState(0);
  const resizeTimer = useRef<number | undefined>();
  const activeTextObj = useActiveTextObj();
  const order = useOrder();

  const reverseVpt = useCallback(
    (pt: fabric.Point): fabric.Point => {
      if (canvas) {
        const vpt = canvas.viewportTransform || [];
        const invertedVpt = fabric.util.invertTransform(vpt);
        return fabric.util.transformPoint(pt, invertedVpt);
      } else {
        return pt;
      }
    },
    [canvas],
  );

  const reverseVptX = useCallback((x = 0): number => reverseVpt(new fabric.Point(x, 0)).x, [reverseVpt]);
  const reverseVptY = useCallback((y = 0): number => reverseVpt(new fabric.Point(0, y)).y, [reverseVpt]);

  // Init canvas

  const activeObj = useActiveObj();
  const rulerH = useRef<fabric.Line | null>(null);
  const rulerV = useRef<fabric.Line | null>(null);

  const initCanvas = useCallback(
    (canvasEl: HTMLCanvasElement) => {
      if (!canvasEl) return;
      if (canvas) return;
      let parent = canvasEl.parentElement;
      if (!parent) return;
      parent = parent.parentElement;
      if (!parent) return;

      const canvas_ = new fabric.Canvas(canvasEl, {
        backgroundColor: "rgba(255, 255, 255, 1)",
        centeredRotation: true,
        centeredScaling: true,
        controlsAboveOverlay: true,
        enableRetinaScaling: true,
        preserveObjectStacking: true,
        selectionBorderColor: "#3240ff",
        selectionColor: "rgba(50, 64, 255, 0.2)",
        defaultCursor: "default",
        hoverCursor: "pointer",
        moveCursor: "grabbing",
        width: parent.clientWidth,
        height: parent.clientHeight,
      });

      rulerV.current = new fabric.Line([0, 0, 0, canvas_.getHeight()], {
        name: "ruler-v",
        originX: "center",
        originY: "center",
        selectable: false,
        strokeWidth: 2,
        excludeFromExport: true,
        strokeUniform: true,
      });

      rulerH.current = new fabric.Line([0, 0, canvas_.getWidth(), 0], {
        name: "ruler-h",
        originX: "center",
        originY: "center",
        selectable: false,
        strokeWidth: 2,
        excludeFromExport: true,
        strokeUniform: true,
      });

      setCanvas(canvas_);
    },
    [canvas, setCanvas],
  );

  // Canvas resizing

  const resizeWithDebounce = useCallback(
    (evtOrDelay?: any) => {
      const delay = typeof evtOrDelay === "number" ? evtOrDelay : 150;
      if (resizeTimer.current) window.clearTimeout(resizeTimer.current);
      resizeTimer.current = window.setTimeout(async () => {
        if (!canvas) return;
        if (!canvas.clipPath) return;
        if (!rulerV.current) return;
        if (!rulerH.current) return;

        let parentEl = canvas.getElement().parentElement;
        if (!parentEl) return;
        parentEl = parentEl.parentElement;
        if (!parentEl) return;

        canvas.setWidth(parentEl.clientWidth);
        canvas.setHeight(parentEl.clientHeight);

        const canvasCenter = canvas.getCenter();
        let zoom = canvas.getZoom();
        const ratioX = canvas.getWidth() / canvas.clipPath.getScaledWidth();
        const ratioY = canvas.getHeight() / canvas.clipPath.getScaledHeight();

        if (ratioX < ratioY) {
          const ratio = (canvas.getWidth() - rem4) / canvas.getWidth();
          zoom = (canvas.getWidth() / canvas.clipPath.getScaledWidth()) * ratio;
        } else {
          const ratio = (canvas.getHeight() - rem4) / canvas.getHeight();
          zoom = (canvas.getHeight() / canvas.clipPath.getScaledHeight()) * ratio;
        }

        canvas.zoomToPoint(new fabric.Point(canvasCenter.left, canvasCenter.top), zoom);
        const overlayLeft = canvas.clipPath.left || 0;
        const overlayTop = canvas.clipPath.top || 0;
        const panX = overlayLeft * zoom - canvasCenter.left;
        const panY = overlayTop * zoom - canvasCenter.top;
        canvas.absolutePan(new fabric.Point(panX, panY));

        // Needed to prevent rulers not to be visible at first render
        rulerH.current.set(canvasCenter);
        rulerV.current.set(canvasCenter);

        if (order.shape) {
          await new Promise<void>(resolve => {
            fabric.loadSVGFromURL(
              process.env.REACT_APP_API_URL + "/public/" + order.shape!.url,
              (objs, opts) => {
                const overlay =
                  order.shape!.tags === "coins-arrondis"
                    ? new fabric.Rect({
                        width: 500,
                        height: 500,
                        rx: 30,
                        ry: (order.width / order.height) * 30,
                      })
                    : fabric.util.groupSVGElements(objs, opts);
                const canvasCenter = canvas.getVpCenter();
                overlay.originX = "center";
                overlay.originY = "center";
                overlay.left = canvasCenter.x;
                overlay.top = canvasCenter.y;
                overlay.scaleX = order.width / order.height;
                canvas.clipPath = overlay;
                canvas.requestRenderAll();
                resolve();
              },
              undefined,
              {crossOrigin: "anonymous"},
            );
          });
        }

        setWidthTrans(canvas.clipPath.getScaledHeight() * zoom * 0.5);
        setHeightTrans(canvas.clipPath.getScaledWidth() * zoom * 0.5);
      }, delay);
    },
    [canvas, order],
  );

  useEffect(() => {
    resizeWithDebounce(0);
    window.addEventListener("resize", resizeWithDebounce);
    return () => {
      window.removeEventListener("resize", resizeWithDebounce);
    };
  }, [resizeWithDebounce]);

  // Fixations

  const fixationTimeout = useRef<number>();
  useEffect(() => {
    if (fixationTimeout.current) window.clearTimeout(fixationTimeout.current);
    fixationTimeout.current = window.setTimeout(() => {
      if (!canvas) return;

      canvas.remove(
        ...canvas.getObjects().filter(obj => {
          if (obj.name === "fixation") return true;
          if (obj.name === "drill-hole") return true;
          return false;
        }),
      );

      if (!canvas.clipPath) return;
      if (!order) return;
      if (!order.fixation) return;
      if (!order.condition) return;

      const objs: fabric.Object[] = [];
      const overlayCenter = canvas.clipPath.getCenterPoint();
      const overlayWidth = canvas.clipPath.getScaledWidth();
      const overlayHeight = canvas.clipPath.getScaledHeight();

      const fixationIconUrl = process.env.REACT_APP_API_URL + "/public/" + order.fixation.iconUrl;
      fabric.loadSVGFromURL(
        fixationIconUrl,
        async (paths, opts) => {
          if (!canvas) return;
          if (!canvas.clipPath) return;
          if (!order.fixation) return;
          if (!order.condition) return;

          const fixationWidth = (order.fixation.diameter * 0.1 * canvas.clipPath.getScaledWidth()) / order.width;
          const fixationObj = fabric.util.groupSVGElements(paths, opts);

          fixationObj.set({
            name: "fixation",
            selectable: false,
            evented: false,
            excludeFromExport: true,
            originX: "center",
            originY: "center",
            scaleX: fixationWidth / fixationObj.getScaledWidth(),
            scaleY: fixationWidth / fixationObj.getScaledWidth(),
          });
          const fixationOffsetH = fixationWidth * 0.5 + order.condition.paddingH;
          const fixationOffsetV = fixationWidth * 0.5 + order.condition.paddingV;

          const addFixationIfPos = (pos: keyof FixationCondition, left: number, top: number) =>
            new Promise<void>(resolve => {
              if (order.condition && order.condition[pos]) {
                fixationObj.clone(
                  (obj: fabric.Object) => {
                    obj.set({
                      left: overlayCenter.x + left,
                      top: overlayCenter.y + top,
                    });
                    objs.push(obj);
                    resolve();
                  },
                  ["name", "selectable", "evented", "excludeFromExport", "originX", "originY", "scaleX", "scaleY"],
                );
              } else {
                resolve();
              }
            });

          const HOLE_STROKE_WIDTH = 1;
          const holeWidth = (order.fixation.drillDiameter * 0.1 * canvas.clipPath.getScaledWidth()) / order.width;
          const holeRadius = holeWidth * 0.5 + HOLE_STROKE_WIDTH;
          const holeOffsetH = fixationWidth * 0.5 + order.condition.paddingH;
          const holeOffsetV = fixationWidth * 0.5 + order.condition.paddingV;

          const holeObjProps: fabric.ICircleOptions = {
            name: "drill-hole",
            selectable: false,
            evented: false,
            fill: "white",
            stroke: "black",
            strokeWidth: HOLE_STROKE_WIDTH,
            radius: holeRadius - HOLE_STROKE_WIDTH,
            originX: "center",
            originY: "center",
          };

          const addHoleIfPos = (pos: keyof FixationCondition, left: number, top: number) => {
            if (order.condition && order.condition[pos]) {
              objs.push(
                new fabric.Circle({
                  ...holeObjProps,
                  left: overlayCenter.x + left,
                  top: overlayCenter.y + top,
                }),
              );
            }
          };

          addHoleIfPos("posTl", -overlayWidth * 0.5 + holeOffsetH, -overlayHeight * 0.5 + holeOffsetV);
          addHoleIfPos("posTc", 0, -overlayHeight * 0.5 + holeOffsetV);
          addHoleIfPos("posTr", overlayWidth * 0.5 - holeOffsetH, -overlayHeight * 0.5 + holeOffsetV);
          addHoleIfPos("posCl", -overlayWidth * 0.5 + holeOffsetH, 0);
          addHoleIfPos("posCr", overlayWidth * 0.5 - holeOffsetH, 0);
          addHoleIfPos("posBl", -overlayWidth * 0.5 + holeOffsetH, overlayHeight * 0.5 - holeOffsetV);
          addHoleIfPos("posBc", 0, overlayHeight * 0.5 - holeOffsetV);
          addHoleIfPos("posBr", overlayWidth * 0.5 - holeOffsetH, overlayHeight * 0.5 - holeOffsetV);
          canvas.add(...objs);
          objs.forEach(obj => obj.bringToFront());

          await addFixationIfPos(
            "posTl",
            -overlayWidth * 0.5 + fixationOffsetH,
            -overlayHeight * 0.5 + fixationOffsetV,
          );
          await addFixationIfPos("posTc", 0, -overlayHeight * 0.5 + fixationOffsetV);
          await addFixationIfPos("posTr", overlayWidth * 0.5 - fixationOffsetH, -overlayHeight * 0.5 + fixationOffsetV);
          await addFixationIfPos("posCl", -overlayWidth * 0.5 + fixationOffsetH, 0);
          await addFixationIfPos("posCr", overlayWidth * 0.5 - fixationOffsetH, 0);
          await addFixationIfPos("posBl", -overlayWidth * 0.5 + fixationOffsetH, overlayHeight * 0.5 - fixationOffsetV);
          await addFixationIfPos("posBc", 0, overlayHeight * 0.5 - fixationOffsetV);
          await addFixationIfPos("posBr", overlayWidth * 0.5 - fixationOffsetH, overlayHeight * 0.5 - fixationOffsetV);
          canvas.add(...objs);
          objs.forEach(obj => obj.bringToFront());

          canvas.requestRenderAll();
        },
        undefined,
        {crossOrigin: "anonymous"},
      );
    }, 150);
  }, [canvas, order]);

  // Font scaling

  const setFontSize = useCallback(() => {
    if (activeTextObj) {
      let fontSize = activeTextObj.fontSize || 40;
      let scaleX = activeTextObj.scaleX || 1;
      let scaleY = activeTextObj.scaleY || 1;

      fontSize = Math.round(fontSize * scaleX);
      scaleY = scaleY / scaleX;
      scaleX = 1;

      activeTextObj.set({fontSize, scaleX, scaleY});
      fitTextboxToContent(activeTextObj);
    }
  }, [activeTextObj]);

  useEffect(() => {
    if (activeTextObj) {
      activeTextObj.on("scaled", setFontSize);
      return () => {
        activeTextObj.off("scaled", setFontSize);
      };
    }
  }, [activeTextObj, setFontSize]);

  // Objects boundaries

  const setBoundaries = useCallback(
    (evt: fabric.IEvent) => {
      if (!evt.target) return;
      if (!canvas) return;
      if (!canvas.clipPath) return;

      const canvasWidth = canvas.getWidth();
      const canvasHeight = canvas.getHeight();
      const overlayWidth = canvas.clipPath.getScaledWidth() * canvas.getZoom();
      const overlayHeight = canvas.clipPath.getScaledHeight() * canvas.getZoom();

      const maxTop = reverseVptY((canvasHeight - overlayHeight) * 0.5);
      const maxLeft = reverseVptX((canvasWidth - overlayWidth) * 0.5);
      const maxBottom = reverseVptY((canvasHeight + overlayHeight) * 0.5);
      const maxRight = reverseVptX((canvasWidth + overlayWidth) * 0.5);

      const targetLeft = evt.target.left || 0;
      const targetTop = evt.target.top || 0;

      evt.target.left = Math.max(maxLeft, Math.min(maxRight, targetLeft));
      evt.target.top = Math.max(maxTop, Math.min(maxBottom, targetTop));
    },
    [canvas, reverseVptX, reverseVptY],
  );

  // TODO: clean
  const stickToClosestObj = useCallback(
    (evt: fabric.IEvent) => {
      if (!canvas) return;
      if (!canvas.clipPath) return;
      if (!activeObj) return;
      if (!rulerV.current) return;
      if (!rulerH.current) return;

      const zoom = canvas.getZoom();
      const canvasWidth = reverseVptX(canvas.getWidth());
      const canvasHeight = reverseVptY(canvas.getHeight());
      const canvasCenter = canvas.getVpCenter();
      const otherObjs = canvas.getObjects().filter(obj => {
        if (obj.name === "ruler-v") return false;
        if (obj.name === "ruler-h") return false;
        if (obj.name === "drill-hole") return false;
        if (obj.name === "fixation") return false;
        return evt.target instanceof fabric.ActiveSelection
          ? !evt.target.getObjects().includes(obj)
          : evt.target !== obj;
      });

      const activeObjRadiusX = activeObj.getScaledWidth() * 0.5;
      const activeObjStickCenterX = getStickyCenterX(activeObj);
      const activeObjStickEdgeX: StickyEdgeX[] = getStickyEdgeX(activeObj);

      const activeObjRadiusY = activeObj.getScaledHeight() * 0.5;
      const activeObjStickEdgeY = getStickyEdgeY(activeObj);
      const activeObjStickCenterY = getStickyCenterY(activeObj);

      const objsStickyCenterX: StickyCenterX[] = otherObjs
        .flatMap(getStickyCenterX)
        .concat([{src: "canvas", x: canvasCenter.x}]);

      const stickyCenterX = activeObjStickCenterX.reduce<StickyState<StickyCenterX>>((activeObjState, activeObj) => {
        const objState = objsStickyCenterX.reduce<StickyState<StickyCenterX>>((objState, obj) => {
          const diff = Math.abs(obj.x - activeObj.x);
          return diff < objState.diff ? {...obj, diff} : objState;
        }, defaultStickyCenterXState());
        return objState.diff < activeObjState.diff ? objState : activeObjState;
      }, defaultStickyCenterXState());

      const objsStickyEdgesX: StickyEdgeX[] = otherObjs.flatMap(getStickyEdgeX).concat([
        {pos: "left", src: "canvas", x: 1},
        {pos: "left", src: "canvas", x: canvasCenter.x - 2},
      ]);

      const stickyEdgeX = activeObjStickEdgeX.reduce<StickyState<StickyEdgeX>>((activeObjState, activeObj) => {
        const objState = objsStickyEdgesX.reduce<StickyState<StickyEdgeX>>((objState, obj) => {
          const diff = Math.abs(obj.x - activeObj.x);
          return diff < objState.diff ? {...obj, diff} : objState;
        }, defaultStickyEdgeXState());

        return objState.diff < activeObjState.diff ? {...objState, pos: activeObj.pos} : activeObjState;
      }, defaultStickyEdgeXState());

      const objsStickyCenterY: StickyCenterY[] = otherObjs
        .flatMap(getStickyCenterY)
        .concat([{src: "canvas", y: canvasCenter.y}]);

      const stickyCenterY = activeObjStickCenterY.reduce<StickyState<StickyCenterY>>((activeObjState, activeObj) => {
        const objState = objsStickyCenterY.reduce<StickyState<StickyCenterY>>((objState, obj) => {
          const diff = Math.abs(obj.y - activeObj.y);
          return diff < objState.diff ? {...obj, diff} : objState;
        }, defaultStickyCenterYState());

        return objState.diff < activeObjState.diff ? objState : activeObjState;
      }, defaultStickyEdgeYState());

      const objsStickyEdgesY: StickyEdgeY[] = otherObjs.flatMap(getStickyEdgeY).concat([
        {pos: "top", src: "canvas", y: 1},
        {pos: "top", src: "canvas", y: canvasCenter.y - 2},
      ]);

      const stickyEdgeY = activeObjStickEdgeY.reduce<StickyState<StickyEdgeY>>((activeObjState, activeObj) => {
        const objState = objsStickyEdgesY.reduce<StickyState<StickyEdgeY>>((objState, obj) => {
          const diff = Math.abs(obj.y - activeObj.y);
          return diff < objState.diff ? {...obj, diff} : objState;
        }, defaultStickyEdgeYState());

        return objState.diff < activeObjState.diff ? {...objState, pos: activeObj.pos} : activeObjState;
      }, defaultStickyEdgeYState());

      const strokeWidth = Math.max(1, 2 / zoom);

      if (shouldStick(stickyCenterX.diff)) {
        const left = stickyCenterX.x;
        const stroke = stickyCenterX.src === "object" ? "#ff4aff" : "#4affff";
        const strokeDashArray = [8 / zoom, 4 / zoom];
        rulerV.current
          .set({left, top: 0, height: canvasHeight * 2, stroke, strokeWidth, strokeDashArray})
          .bringToFront();
        activeObj.set({left: stickyCenterX.x});
      } else if (shouldStick(stickyEdgeX.diff)) {
        const left = stickyEdgeX.x;
        const stroke = stickyEdgeX.src === "object" ? "#ff4aff" : "#4affff";
        const strokeDashArray = undefined;
        rulerV.current.set({left, top: 0, height: canvasHeight * 2, stroke, strokeWidth, strokeDashArray});
        switch (stickyEdgeX.pos) {
          case "left":
            activeObj.set({left: stickyEdgeX.x + activeObjRadiusX});
            break;
          case "right":
            activeObj.set({left: stickyEdgeX.x - activeObjRadiusX});
            break;
          default:
            break;
        }
      } else {
        rulerV.current.set({strokeWidth: 0});
      }

      if (shouldStick(stickyCenterY.diff)) {
        const top = stickyCenterY.y;
        const stroke = stickyCenterY.src === "object" ? "#ff4aff" : "#4affff";
        const strokeDashArray = [8 / zoom, 4 / zoom];
        rulerH.current.set({left: 0, top, width: canvasWidth * 2, stroke, strokeWidth, strokeDashArray}).bringToFront();
        activeObj.set({top: stickyCenterY.y});
      } else if (shouldStick(stickyEdgeY.diff)) {
        const top = stickyEdgeY.y;
        const stroke = stickyEdgeY.src === "object" ? "#ff4aff" : "#4affff";
        const strokeDashArray = undefined;
        rulerH.current.set({left: 0, top, width: canvasWidth * 2, stroke, strokeWidth, strokeDashArray}).bringToFront();
        switch (stickyEdgeY.pos) {
          case "top":
            activeObj.set({top: stickyEdgeY.y + activeObjRadiusY});
            break;
          case "bottom":
            activeObj.set({top: stickyEdgeY.y - activeObjRadiusY});
            break;
          default:
            break;
        }
      } else {
        rulerH.current.set({strokeWidth: 0});
      }

      // FIXME: rulers are not visible if they are not removed and added back
      // to the canvas. A better implementation is needed.
      canvas.remove(
        ...canvas.getObjects().filter(o => {
          if (!o.name) return false;
          if (o.name === "ruler-v") return true;
          if (o.name === "ruler-h") return true;
          return false;
        }),
      );
      canvas.add(rulerH.current, rulerV.current);
      canvas.requestRenderAll();
    },
    [activeObj],
  );

  const adjustPosition = useCallback(
    (evt: fabric.IEvent) => {
      setBoundaries(evt);
      stickToClosestObj(evt);
    },
    [setBoundaries, stickToClosestObj],
  );

  function hideRulers() {
    if (!rulerH.current) return;
    if (!rulerV.current) return;
    rulerH.current.set({strokeWidth: 0});
    rulerV.current.set({strokeWidth: 0});
  }

  useEffect(() => {
    if (canvas) {
      canvas.on("object:moving", adjustPosition);
      canvas.on("object:moved", hideRulers);
      return () => {
        canvas.off("object:moving", adjustPosition);
        canvas.off("object:moved", hideRulers);
      };
    }
  }, [canvas, adjustPosition]);

  function adjustSelection(evt: fabric.IEvent) {
    if (evt.target instanceof fabric.ActiveSelection) {
      const width = evt.target.getScaledWidth();
      const height = evt.target.getScaledHeight();
      const left = evt.target.left || 0;
      const top = evt.target.top || 0;
      evt.target.set({
        lockScalingFlip: true,
        borderColor: "#3240ff",
        originX: "center",
        originY: "center",
        left: left + width * 0.5,
        top: top + height * 0.5,
      });
    }
  }

  useEffect(() => {
    if (!canvas) return;
    canvas.on("selection:created", adjustSelection);
    return () => {
      canvas.off("selection:created", adjustSelection);
    };
  }, [canvas]);

  useEffect(() => {
    if (!canvas) return;
    if (typeof canvas.backgroundColor === "string" && canvas.backgroundColor.startsWith("#")) return;
    if (!order.product) return;
    canvas.setBackgroundColor(`rgba(255, 255, 255, ${1 - order.product.transparency * 0.01})`, () => {
      canvas.requestRenderAll();
    });
  }, [canvas, order.product]);

  // JSX

  const style: React.CSSProperties =
    order && order.product
      ? {backgroundImage: `url(${process.env.REACT_APP_API_URL + "/public/" + order.product.background})`}
      : {};

  return (
    <main className={cs.main} style={style}>
      <canvas ref={initCanvas} />
      <Popover />
      {order && (
        <span className={cs.width} style={{transform: `translateY(calc(50% + ${widthTrans}px))`}}>
          {intl.format(order.width)} cm
        </span>
      )}
      {order && (
        <span className={cs.height} style={{transform: `rotate(-90deg) translateY(calc(-50% - ${heightTrans}px))`}}>
          {intl.format(order.height)} cm
        </span>
      )}
    </main>
  );
};

export default Main;
