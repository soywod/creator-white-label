import React, {FC, useCallback, useEffect, useState} from "react";

import {useCanvas, useActiveTextObj} from "../../canvas";
import Tool from "../../toolbar/tool";
import {ReactComponent as IconUnderline} from "./icon.svg";

type TextUnderlineEditToolProps = {
  tooltip?: string;
};

export const TextUnderlineEditTool: FC<TextUnderlineEditToolProps> = props => {
  const canvas = useCanvas();
  const activeTextObj = useActiveTextObj();

  const readUnderline = useCallback<() => boolean>(() => {
    if (!activeTextObj) return;
    const globalUnderline = Boolean(activeTextObj.underline);
    if (activeTextObj.getSelectionStyles().length === 0) {
      const selectionStart = Math.max(1, activeTextObj.selectionStart || 1);
      const selectionStyles = activeTextObj.getSelectionStyles(selectionStart - 1, selectionStart);
      return 0 in selectionStyles && selectionStyles[0].underline !== undefined
        ? selectionStyles[0].underline
        : globalUnderline;
    } else {
      const selectionStyles = activeTextObj.getSelectionStyles();
      const underline = selectionStyles.reduce((underline, style) => {
        const u = style.underline === undefined ? globalUnderline : style.underline;
        return underline === u ? underline : undefined;
      }, selectionStyles[0].underline || globalUnderline);
      return underline;
    }
  }, [activeTextObj]);

  const [underline, setUnderline] = useState(readUnderline());

  useEffect(() => {
    if (!activeTextObj) return;
    const updateUnderline = () => setUnderline(readUnderline());
    activeTextObj.on("selection:changed", updateUnderline);
    return () => {
      activeTextObj.off("selection:changed", updateUnderline);
    };
  }, [activeTextObj, readUnderline]);

  function toggleUnderline() {
    if (!canvas) return;
    if (!activeTextObj) return;
    if (activeTextObj.getSelectionStyles().length > 0) {
      activeTextObj.setSelectionStyles({underline: !underline});
    } else {
      activeTextObj.removeStyle("underline");
      activeTextObj.set({underline: !underline});
    }
    canvas.requestRenderAll();
    setUnderline(underline => !underline);
  }

  return <Tool icon={IconUnderline} active={underline} onClick={toggleUnderline} tooltip={props.tooltip} />;
};

export default TextUnderlineEditTool;
