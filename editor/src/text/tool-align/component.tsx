import React, {FC, useState} from "react";

import {useCanvas, useActiveTextObj} from "../../canvas";
import Tool, {useTool} from "../../toolbar/tool";
import {ReactComponent as IconLeft} from "./icon-left.svg";
import {ReactComponent as IconCenter} from "./icon-center.svg";
import {ReactComponent as IconJustify} from "./icon-justify.svg";
import {ReactComponent as IconRight} from "./icon-right.svg";

type Align = "left" | "center" | "justify" | "right";

function getAlignFromStr(s?: string): Align | undefined {
  switch (s) {
    case "left":
    case "center":
    case "justify":
    case "right":
      return s;
    default:
      return undefined;
  }
}

function getIconFromAlign(align?: Align) {
  switch (align) {
    case "left":
    default:
      return IconLeft;
    case "center":
      return IconCenter;
    case "justify":
      return IconJustify;
    case "right":
      return IconRight;
  }
}

type TextAlignToolProps = {
  tooltip?: string;
};

export const TextAlignTool: FC<TextAlignToolProps> = props => {
  const canvas = useCanvas();
  const activeTextObj = useActiveTextObj();
  const tool = useTool();
  const [align, setAlign] = useState(getAlignFromStr((activeTextObj && activeTextObj.textAlign) || undefined));

  function updateAlign(align: Align) {
    if (!canvas) return;
    if (!activeTextObj) return;
    activeTextObj.removeStyle("textAlign");
    activeTextObj.set({textAlign: align});
    canvas.requestRenderAll();
    setAlign(align);
  }

  return (
    <Tool tool={tool} icon={getIconFromAlign(align)} tooltip={props.tooltip}>
      <Tool icon={IconLeft} active={align === "left"} tooltip="À gauche" onClick={() => updateAlign("left")} />
      <Tool icon={IconCenter} active={align === "center"} tooltip="Centré" onClick={() => updateAlign("center")} />
      <Tool icon={IconJustify} active={align === "justify"} tooltip="Justifié" onClick={() => updateAlign("justify")} />
      <Tool icon={IconRight} active={align === "right"} tooltip="À droite" onClick={() => updateAlign("right")} />
    </Tool>
  );
};

export default TextAlignTool;
