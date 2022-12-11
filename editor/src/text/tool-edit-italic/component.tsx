import React, {FC, useCallback, useEffect, useState} from "react";

import {useCanvas, useActiveTextObj, fitTextboxToContent} from "../../canvas";
import Tool from "../../toolbar/tool";
import {ReactComponent as IconItalic} from "./icon.svg";

type Style = "normal" | "italic";

type TextItalicEditToolProps = {
  tooltip?: string;
};

export const TextItalicEditTool: FC<TextItalicEditToolProps> = props => {
  const canvas = useCanvas();
  const activeTextObj = useActiveTextObj();

  const readItalic = useCallback<() => Style>(() => {
    if (!activeTextObj) return;
    const globalStyle = activeTextObj.fontStyle === "italic" ? "italic" : "normal";
    if (activeTextObj.getSelectionStyles().length === 0) {
      const selectionStart = Math.max(1, activeTextObj.selectionStart || 1);
      const selectionStyles = activeTextObj.getSelectionStyles(selectionStart - 1, selectionStart);
      return (0 in selectionStyles && selectionStyles[0].fontStyle) || globalStyle;
    } else {
      const selectionStyles = activeTextObj.getSelectionStyles();
      const style = selectionStyles.reduce((style, currStyle) => {
        const s = currStyle.fontStyle || globalStyle;
        return s === style ? style : undefined;
      }, selectionStyles[0].fontStyle || globalStyle);
      return style;
    }
  }, [activeTextObj]);

  const [style, setStyle] = useState(readItalic());

  useEffect(() => {
    if (!activeTextObj) return;
    const handler = () => setStyle(readItalic());
    activeTextObj.on("selection:changed", handler);
    return () => {
      activeTextObj.off("selection:changed", handler);
    };
  }, [activeTextObj, readItalic]);

  function toggleItalic() {
    if (!canvas) return;
    if (!activeTextObj) return;
    const nextStyle = style === "normal" ? "italic" : "normal";
    if (activeTextObj.getSelectionStyles().length > 0) {
      activeTextObj.setSelectionStyles({fontStyle: nextStyle});
    } else {
      activeTextObj.removeStyle("fontStyle");
      activeTextObj.set({fontStyle: nextStyle});
    }
    const prevSelectionStart = activeTextObj.selectionStart || 0;
    const prevSelectionEnd = activeTextObj.selectionEnd || 1;
    activeTextObj.exitEditing();
    fitTextboxToContent(activeTextObj);
    activeTextObj.enterEditing();
    activeTextObj.setSelectionStart(prevSelectionStart);
    activeTextObj.setSelectionEnd(prevSelectionEnd);
    canvas.requestRenderAll();
    setStyle(nextStyle);
  }

  return <Tool icon={IconItalic} active={style === "italic"} onClick={toggleItalic} tooltip={props.tooltip} />;
};

export default TextItalicEditTool;
