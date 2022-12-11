import React, {FC, useCallback, useEffect, useState} from "react";

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

type TextAlignEditToolProps = {
  tooltip?: string;
};

export const TextAlignEditTool: FC<TextAlignEditToolProps> = props => {
  const canvas = useCanvas();
  const activeTextObj = useActiveTextObj();
  const tool = useTool();

  const readAlign = useCallback<() => Align>(() => {
    if (!activeTextObj) return;
    const globalTextAlign = getAlignFromStr(activeTextObj.textAlign);
    if (activeTextObj.getSelectionStyles().length === 0) {
      const selectionStart = Math.max(1, activeTextObj.selectionStart || 1);
      const selectionStyles = activeTextObj.getSelectionStyles(selectionStart - 1, selectionStart);
      const textAlign = (0 in selectionStyles && selectionStyles[0].textAlign) || undefined;
      return textAlign || globalTextAlign;
    } else {
      const selectionStyles = activeTextObj.getSelectionStyles();
      const align = selectionStyles.reduce((align, style) => {
        const a = style.textAlign || globalTextAlign;
        return align === a ? align : undefined;
      }, selectionStyles[0].textAlign || globalTextAlign);
      return align;
    }
  }, [activeTextObj]);

  const [align, setAlign] = useState<Align>();

  useEffect(() => {
    if (!activeTextObj) return;
    const handler = () => setAlign(readAlign());
    activeTextObj.on("selection:changed", handler);
    return () => {
      activeTextObj.off("selection:changed", handler);
    };
  }, [activeTextObj, readAlign]);

  function updateAlign(align: Align) {
    if (!canvas) return;
    if (!activeTextObj) return;
    if (activeTextObj.getSelectionStyles().length > 0) {
      activeTextObj.setSelectionStyles({textAlign: align});
    } else {
      activeTextObj.removeStyle("textAlign");
      activeTextObj.set({textAlign: align});
    }
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

export default TextAlignEditTool;
