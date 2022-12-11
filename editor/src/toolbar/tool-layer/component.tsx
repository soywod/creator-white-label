import React, {FC, useCallback} from "react";

import {useCanvas, useActiveObj} from "../../canvas";
import Tool, {useTool} from "../tool";
import {ReactComponent as IconTextLayer} from "./icon.svg";
import {ReactComponent as IconTextLayerBottom} from "./icon-bottom.svg";
import {ReactComponent as IconTextLayerDown} from "./icon-down.svg";
import {ReactComponent as IconTextLayerUp} from "./icon-up.svg";
import {ReactComponent as IconTextLayerTop} from "./icon-top.svg";

type TextLayerKind = "bottom" | "down" | "up" | "top";
type TextLayerFnKind = "sendToBack" | "sendBackwards" | "bringForward" | "bringToFront";
type TextLayerMap = Record<TextLayerKind, TextLayerMapEntry>;
type TextLayerMapEntry = {
  fn: TextLayerFnKind;
  icon: FC<React.HtmlHTMLAttributes<SVGSVGElement>>;
  label: string;
};

const layers: TextLayerKind[] = ["bottom", "down", "up", "top"];
const layerMap: TextLayerMap = {
  bottom: {fn: "sendToBack", icon: IconTextLayerBottom, label: "En bas"},
  down: {fn: "sendBackwards", icon: IconTextLayerDown, label: "En-dessous"},
  up: {fn: "bringForward", icon: IconTextLayerUp, label: "Au-dessus"},
  top: {fn: "bringToFront", icon: IconTextLayerTop, label: "En haut"},
};

type LayerToolProps = {
  className?: string;
  label?: string;
  tooltip?: string;
};

export const LayerTool: FC<LayerToolProps> = props => {
  const canvas = useCanvas();
  const activeObj = useActiveObj();
  const tool = useTool();

  const updateTextLayer = useCallback(
    (layer: TextLayerKind) => {
      if (!canvas) return;
      if (!activeObj) return;
      canvas[layerMap[layer].fn](activeObj);
      canvas.requestRenderAll();
    },
    [canvas, activeObj, tool],
  );

  return (
    <Tool className={props.className} tool={tool} icon={IconTextLayer} label={props.label} tooltip={props.tooltip}>
      {layers.map(layer => (
        <Tool
          key={layer}
          icon={layerMap[layer].icon}
          onClick={() => updateTextLayer(layer)}
          label={layerMap[layer].label}
        />
      ))}
    </Tool>
  );
};

export default LayerTool;
