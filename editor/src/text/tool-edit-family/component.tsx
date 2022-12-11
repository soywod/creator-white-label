import React, {FC, useCallback, useEffect, useState} from "react";
import Select from "react-select";

import {fontFamilies} from "../../font/service";
import {useCanvas, useActiveTextObj, fitTextboxToContent} from "../../canvas";

export const TextFamilyEditTool: FC = () => {
  const canvas = useCanvas();
  const activeTextObj = useActiveTextObj();

  const readFontFamily = useCallback<() => string>(() => {
    if (!activeTextObj) return;
    const globalFontFamily = activeTextObj.fontFamily;
    if (activeTextObj.getSelectionStyles().length === 0) {
      const selectionStart = Math.max(1, activeTextObj.selectionStart || 1);
      const selectionStyles = activeTextObj.getSelectionStyles(selectionStart - 1, selectionStart);
      const fontFamily = (0 in selectionStyles && selectionStyles[0].fontFamily) || undefined;
      return fontFamily || globalFontFamily;
    } else {
      const selectionStyles = activeTextObj.getSelectionStyles();
      const fontFamily = selectionStyles.reduce((family, style) => {
        const f = style.fontFamily || globalFontFamily;
        return family === f ? family : undefined;
      }, selectionStyles[0].fontFamily || globalFontFamily);
      return fontFamily;
    }
  }, [activeTextObj]);

  const [family, setFamily] = useState(readFontFamily());

  useEffect(() => {
    if (!activeTextObj) return;
    const handler = () => setFamily(readFontFamily());
    activeTextObj.on("selection:changed", handler);
    return () => {
      activeTextObj.off("selection:changed", handler);
    };
  }, [activeTextObj, readFontFamily]);

  function updateFontFamily(family: string) {
    if (!canvas) return;
    if (!activeTextObj) return;
    if (activeTextObj.getSelectionStyles().length > 0) {
      activeTextObj.setSelectionStyles({fontFamily: family});
    } else {
      activeTextObj.removeStyle("fontFamily");
      activeTextObj.set({fontFamily: family});
    }
    const prevSelectionStart = activeTextObj.selectionStart || 0;
    const prevSelectionEnd = activeTextObj.selectionEnd || 1;
    activeTextObj.exitEditing();
    fitTextboxToContent(activeTextObj);
    activeTextObj.enterEditing();
    activeTextObj.setSelectionStart(prevSelectionStart);
    activeTextObj.setSelectionEnd(prevSelectionEnd);
    canvas.requestRenderAll();
    setFamily(family);
  }

  return (
    <Select
      value={{value: family, label: family}}
      onChange={(opt: any) => updateFontFamily((opt && opt.value) || "")}
      options={fontFamilies.map(family => ({value: family, label: family}))}
      styles={{
        singleValue: (provided: any) => ({
          ...provided,
          color: "#131021",
        }),
        control: (provided: any, state: any) => ({
          ...provided,
          fontSize: "0.8rem",
          cursor: "pointer",
          width: "8rem",
          borderRadius: "0.25rem",
          height: "100%",
          minHeight: "inherit",
          borderColor: "#d6d6d6",
          boxShadow: state.isFocused ? "0 0 0 1px #d6d6d6" : "none",
          color: "#131021",
          "&:hover": {
            borderColor: "#d6d6d6",
            boxShadow: "0 0 0 1px #d6d6d6",
          },
        }),
        valueContainer: (provided: any) => ({
          ...provided,
          height: "100%",
          boxSizing: "content-box",
        }),
        dropdownIndicator: (provided: any) => ({
          ...provided,
          padding: 0,
        }),
        menu: (provided: any) => ({
          ...provided,
          margin: 1,
          zIndex: 4,
        }),
        option: (provided: any, state: any) => ({
          ...provided,
          fontFamily: state.label,
          fontSize: "0.8rem",
          cursor: "pointer",
          backgroundColor: state.isSelected ? "#3240ff" : state.isFocused ? "#d6d6d6" : "#ffffff",
          color: "#131021",
          "&:active": {
            backgroundColor: state.isSelected ? "#3240ff" : "#d6d6d6",
          },
        }),
      }}
    />
  );
};

export default TextFamilyEditTool;
