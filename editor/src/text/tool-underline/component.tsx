import React, {FC, useState} from "react";

import {useCanvas, useActiveTextObj} from "../../canvas";
import Tool from "../../toolbar/tool";
import {ReactComponent as IconUnderline} from "./icon.svg";

type TextUnderlineToolProps = {
  tooltip?: string;
};

export const TextUnderlineTool: FC<TextUnderlineToolProps> = props => {
  const canvas = useCanvas();
  const activeTextObj = useActiveTextObj();
  const [underline, setUnderline] = useState(Boolean(activeTextObj && activeTextObj.underline));

  function toggleUnderline() {
    if (!canvas) return;
    if (!activeTextObj) return;
    activeTextObj.removeStyle("underline");
    activeTextObj.set({underline: !underline});
    canvas.requestRenderAll();
    setUnderline(underline => !underline);
  }

  return <Tool icon={IconUnderline} active={underline} onClick={toggleUnderline} tooltip={props.tooltip} />;
};

export default TextUnderlineTool;
