import React, {FC, useState} from "react";
import Select from "react-select";

import {useCanvas, useActiveTextObj, fitTextboxToContent} from "../../canvas";
import {fontFamilies} from "../../font/service";

export const TextFamilyTool: FC = () => {
  const canvas = useCanvas();
  const activeTextObj = useActiveTextObj();
  const [family, setFamily] = useState(activeTextObj && activeTextObj.fontFamily);

  function updateFontFamily(family: string) {
    if (!canvas) return;
    if (!activeTextObj) return;
    activeTextObj.removeStyle("fontFamily");
    activeTextObj.set({fontFamily: family});
    fitTextboxToContent(activeTextObj);
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
          backgroundColor: state.isSelected ? "#0ec2f9" : state.isFocused ? "#d6d6d6" : "#ffffff",
          color: "#131021",
          "&:active": {
            backgroundColor: state.isSelected ? "#0ec2f9" : "#d6d6d6",
          },
        }),
      }}
    />
  );
};

export default TextFamilyTool;
