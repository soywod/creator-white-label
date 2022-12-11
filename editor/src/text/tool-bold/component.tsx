import React, {FC, useState} from "react";

import {useCanvas, useActiveTextObj, fitTextboxToContent} from "../../canvas";
import Tool from "../../toolbar/tool";
import {ReactComponent as IconBold} from "./icon.svg";

type Weight = "normal" | "bold";

type TextBoldToolProps = {
  tooltip?: string;
};

export const TextBoldTool: FC<TextBoldToolProps> = props => {
  const canvas = useCanvas();
  const activeTextObj = useActiveTextObj();
  const [weight, setWeight] = useState<Weight>(
    activeTextObj && activeTextObj.fontWeight === "bold" ? "bold" : "normal",
  );

  function toggleBold() {
    if (!canvas) return;
    if (!activeTextObj) return;
    const nextWeight = weight === "normal" ? "bold" : "normal";
    activeTextObj.removeStyle("fontWeight");
    activeTextObj.set({fontWeight: nextWeight});
    fitTextboxToContent(activeTextObj);
    canvas.requestRenderAll();
    setWeight(nextWeight);
  }

  return <Tool icon={IconBold} active={weight === "bold"} onClick={toggleBold} tooltip={props.tooltip} />;
};

export default TextBoldTool;
