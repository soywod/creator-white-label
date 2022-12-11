import React, {FC, useCallback, useEffect, useState} from "react";

import {useCanvas, useActiveTextObj, fitTextboxToContent} from "../../canvas";
import Tool from "../../toolbar/tool";
import {ReactComponent as IconBold} from "./icon.svg";

type Weight = "normal" | "bold";

type TextBoldEditToolProps = {
  tooltip?: string;
};

export const TextBoldEditTool: FC<TextBoldEditToolProps> = props => {
  const canvas = useCanvas();
  const activeTextObj = useActiveTextObj();

  const readBold = useCallback<() => Weight>(() => {
    if (!activeTextObj) return;
    const globalWeight = activeTextObj.fontWeight === "bold" ? "bold" : "normal";
    if (activeTextObj.getSelectionStyles().length === 0) {
      const selectionStart = Math.max(1, activeTextObj.selectionStart || 1);
      const selectionStyles = activeTextObj.getSelectionStyles(selectionStart - 1, selectionStart);
      return (0 in selectionStyles && selectionStyles[0].fontWeight) || globalWeight;
    } else {
      const selectionStyles = activeTextObj.getSelectionStyles();
      const weight = selectionStyles.reduce((weight, style) => {
        const w = style.fontWeight || globalWeight;
        return weight === w ? weight : undefined;
      }, selectionStyles[0].fontWeight || globalWeight);
      return weight;
    }
  }, [activeTextObj]);

  const [weight, setWeight] = useState(readBold());

  useEffect(() => {
    if (!activeTextObj) return;
    const updateBold = () => setWeight(readBold());
    activeTextObj.on("selection:changed", updateBold);
    return () => {
      activeTextObj.off("selection:changed", updateBold);
    };
  }, [activeTextObj, readBold]);

  function toggleBold() {
    if (!canvas) return;
    if (!activeTextObj) return;
    const nextWeight = weight === "normal" ? "bold" : "normal";
    if (activeTextObj.getSelectionStyles().length > 0) {
      activeTextObj.setSelectionStyles({fontWeight: nextWeight});
    } else {
      activeTextObj.removeStyle("fontWeight");
      activeTextObj.set({fontWeight: nextWeight});
    }
    const prevSelectionStart = activeTextObj.selectionStart || 0;
    const prevSelectionEnd = activeTextObj.selectionEnd || 1;
    activeTextObj.exitEditing();
    fitTextboxToContent(activeTextObj);
    activeTextObj.enterEditing();
    activeTextObj.setSelectionStart(prevSelectionStart);
    activeTextObj.setSelectionEnd(prevSelectionEnd);
    canvas.requestRenderAll();
    setWeight(nextWeight);
  }

  return <Tool icon={IconBold} active={weight === "bold"} onClick={toggleBold} tooltip={props.tooltip} />;
};

export default TextBoldEditTool;
