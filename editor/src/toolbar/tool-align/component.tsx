import React, {FC, useCallback} from "react";
import {fabric} from "fabric";

import {useCanvas, useActiveObj} from "../../canvas";
import Tool, {useTool} from "../tool";
import {ReactComponent as Icon} from "./icon.svg";
import {ReactComponent as IconTop} from "./icon-top.svg";
import {ReactComponent as IconRight} from "./icon-right.svg";
import {ReactComponent as IconBottom} from "./icon-bottom.svg";
import {ReactComponent as IconLeft} from "./icon-left.svg";
import {ReactComponent as IconCenterH} from "./icon-center-h.svg";
import {ReactComponent as IconCenterV} from "./icon-center-v.svg";

type AlignToolProps = {
  className?: string;
  label?: string;
  tooltip?: string;
};

export const AlignTool: FC<AlignToolProps> = props => {
  const canvas = useCanvas();
  const activeObj = useActiveObj();
  const tool = useTool();

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

  const alignTop = useCallback(() => {
    if (!canvas) return;
    if (!canvas.clipPath) return;
    if (!activeObj) return;
    const canvasHeight = canvas.getHeight();
    const overlayHeight = canvas.clipPath.getScaledHeight() * canvas.getZoom();
    const activeObjHeight = activeObj.getScaledHeight() * canvas.getZoom();
    const top = reverseVptY((canvasHeight - overlayHeight + activeObjHeight) * 0.5);
    activeObj.set({top}).setCoords();
    canvas.requestRenderAll();
  }, [activeObj]);

  const alignRight = useCallback(() => {
    if (!canvas) return;
    if (!canvas.clipPath) return;
    if (!activeObj) return;
    const canvasWidth = canvas.getWidth();
    const overlayWidth = canvas.clipPath.getScaledWidth() * canvas.getZoom();
    const activeObjWidth = activeObj.getScaledWidth() * canvas.getZoom();
    const left = reverseVptX((canvasWidth + overlayWidth - activeObjWidth) * 0.5);
    activeObj.set({left}).setCoords();
    canvas.requestRenderAll();
  }, [activeObj]);

  const alignBottom = useCallback(() => {
    if (!canvas) return;
    if (!canvas.clipPath) return;
    if (!activeObj) return;
    const canvasHeight = canvas.getHeight();
    const overlayHeight = canvas.clipPath.getScaledHeight() * canvas.getZoom();
    const activeObjHeight = activeObj.getScaledHeight() * canvas.getZoom();
    const top = reverseVptY((canvasHeight + overlayHeight - activeObjHeight) * 0.5);
    activeObj.set({top}).setCoords();
    canvas.requestRenderAll();
  }, [activeObj]);

  const alignLeft = useCallback(() => {
    if (!canvas) return;
    if (!canvas.clipPath) return;
    if (!activeObj) return;
    const canvasWidth = canvas.getWidth();
    const overlayWidth = canvas.clipPath.getScaledWidth() * canvas.getZoom();
    const activeObjWidth = activeObj.getScaledWidth() * canvas.getZoom();
    const left = reverseVptX((canvasWidth - overlayWidth + activeObjWidth) * 0.5);
    activeObj.set({left}).setCoords();
    canvas.requestRenderAll();
  }, [activeObj]);

  const alignCenterH = useCallback(() => {
    if (!canvas) return;
    if (!canvas.clipPath) return;
    if (!activeObj) return;
    const canvasWidth = canvas.getWidth();
    const left = reverseVptX(canvasWidth * 0.5);
    activeObj.set({left}).setCoords();
    canvas.requestRenderAll();
  }, [activeObj]);

  const alignCenterV = useCallback(() => {
    if (!canvas) return;
    if (!canvas.clipPath) return;
    if (!activeObj) return;
    const canvasHeight = canvas.getHeight();
    const top = reverseVptY(canvasHeight * 0.5);
    activeObj.set({top}).setCoords();
    canvas.requestRenderAll();
  }, [activeObj]);

  return (
    <Tool className={props.className} tool={tool} icon={Icon} label={props.label} tooltip={props.tooltip}>
      <Tool icon={IconTop} onClick={alignTop} label="En haut" />
      <Tool icon={IconRight} onClick={alignRight} label="À droite" />
      <Tool icon={IconBottom} onClick={alignBottom} label="En bas" />
      <Tool icon={IconLeft} onClick={alignLeft} label="À gauche" />
      <Tool icon={IconCenterH} onClick={alignCenterH} label="Centre H" />
      <Tool icon={IconCenterV} onClick={alignCenterV} label="Centre V" />
    </Tool>
  );
};

export default AlignTool;
