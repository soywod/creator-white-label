import React, {FC, useState} from "react";

import {useCanvas, useActiveTextObj, fitTextboxToContent} from "../../canvas";
import Tool from "../../toolbar/tool";
import {ReactComponent as IconItalic} from "./icon.svg";

type Style = "normal" | "italic";

type TextItalicToolProps = {
  tooltip?: string;
};

export const TextItalicTool: FC<TextItalicToolProps> = props => {
  const canvas = useCanvas();
  const activeTextObj = useActiveTextObj();
  const [style, setStyle] = useState<Style>(
    activeTextObj && activeTextObj.fontStyle === "italic" ? "italic" : "normal",
  );

  function toggleItalic() {
    if (!canvas) return;
    if (!activeTextObj) return;
    const nextStyle = style === "normal" ? "italic" : "normal";
    activeTextObj.removeStyle("fontStyle");
    activeTextObj.set({fontStyle: nextStyle});
    fitTextboxToContent(activeTextObj);
    canvas.requestRenderAll();
    setStyle(nextStyle);
  }

  return <Tool icon={IconItalic} active={style === "italic"} onClick={toggleItalic} tooltip={props.tooltip} />;
};

export default TextItalicTool;
