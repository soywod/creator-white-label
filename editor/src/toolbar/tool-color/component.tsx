import React, {FC, useEffect, useState} from "react";
import {ChromePicker} from "react-color";
import tinycolor from "tinycolor2";
import cn from "classnames";

import {useCanvas, useActiveObj} from "../../canvas";
import Tool, {useTool} from "../../toolbar/tool";
import {ReactComponent as IconColor} from "./icon.svg";
import {ReactComponent as IconColorSelected} from "./icon-selected.svg";
import {ReactComponent as IconForward} from "./icon-forward.svg";
import {ReactComponent as IconBackward} from "./icon-backward.svg";

import cs from "./component.module.scss";
import {fabric} from "fabric";

type Color = {
  value: string;
  className?: string;
  style?: React.CSSProperties;
};

const colors: Color[] = [
  "#ffffff",
  "#a0a0a0",
  "#68676b",
  "#434343",
  "#000000",
  "#5673be",
  "#5c6b99",
  "#603384",
  "#400c6d",
  "#2c004d",
  "#2c3f76",
  "#354d6b",
  "#006186",
  "#204763",
  "#0b2344",
  "#e3f3f7",
  "#a8d9e5",
  "#5598a5",
  "#45a4e0",
  "#1750a4",
  "#bad4a5",
  "#82c54b",
  "#008c68",
  "#027236",
  "#064500",
  "#fef78e",
  "#fff300",
  "#fcaf14",
  "#f4821d",
  "#ef6a3f",
  "#fcd6cb",
  "#dbcacd",
  "#f289a5",
  "#f37a68",
  "#de3576",
  "#ec381a",
  "#b50736",
  "#ba0b1b",
  "#cebea9",
  "#8c7a72",
  "#4b4338",
  "#f6be00",
].map(value => ({
  value,
  style: {
    background: value,
    borderColor: tinycolor(value).darken(15).toHexString(),
  },
}));

export type ColorPaletteProps = {
  onClick: (color: string) => void;
  selectedColor?: string;
  className?: string;
  style?: React.CSSProperties;
  colors?: Color[];
};

export const ColorPalette: FC<ColorPaletteProps> = props => {
  const customColors = props.colors || [];
  return (
    <div className={cn(cs.grid, props.className)} style={props.style}>
      {colors.concat(customColors).map(({value: color, className, style}) => (
        <button key={color} className={cn(cs.gridItem, className)} onClick={() => props.onClick(color)} style={style}>
          {color === props.selectedColor && (
            <IconColorSelected color={tinycolor(props.selectedColor).isDark() ? "#ffffff" : "#000000"} />
          )}
        </button>
      ))}
      {props.children}
    </div>
  );
};

type ColorMode = "normal" | "custom";
type ColorToolProps = {
  icon?: FC<React.HtmlHTMLAttributes<SVGSVGElement>>;
  tooltip?: string;
};

export const ColorTool: FC<ColorToolProps> = props => {
  const icon = props.icon || IconColor;
  const canvas = useCanvas();
  const activeObj = useActiveObj();
  const tool = useTool();
  const [mode, setMode] = useState<ColorMode>("normal");
  const [color, setColor] = useState(activeObj && activeObj.fill ? activeObj.fill.toString() : undefined);

  useEffect(() => {
    if (tool.tooltipVisible) {
      setMode("normal");
    }
  }, [tool.tooltipVisible]);

  function updateColor(color: string, hide = true) {
    if (!canvas) return;
    if (!activeObj) return;
    if (activeObj instanceof fabric.Group) {
      activeObj.forEachObject(obj => obj.set({fill: color}));
    } else {
      activeObj.set({fill: color});
    }
    setColor(color);
    hide && tool.hideTooltip();
    canvas.requestRenderAll();
  }

  return (
    <Tool
      tool={tool}
      icon={icon}
      iconStyle={{color: color}}
      tooltipClassName={cs.tooltip}
      tooltipContentClassName={cs.tooltipContent}
      tooltip={props.tooltip}
    >
      {mode === "normal" ? (
        <>
          <ColorPalette onClick={updateColor} selectedColor={color} style={{background: "#ffffff"}} />
          <button className={cs.customColor} onClick={() => setMode("custom")}>
            Couleur personnalisée
            <IconForward className={cs.customColorIcon} />
          </button>
        </>
      ) : (
        <>
          <ChromePicker
            disableAlpha
            color={color}
            onChange={c => updateColor(c.hex, false)}
            styles={{
              default: {
                picker: {
                  width: "calc(12rem - 2px)",
                  border: "none",
                  borderRadius: "0.25rem 0.25rem 0 0",
                  boxShadow: "none",
                },
              },
            }}
          />
          <button className={cs.predefinedColor} onClick={() => setMode("normal")}>
            <IconBackward className={cs.customColorIcon} />
            Couleur prédéfinie
          </button>
        </>
      )}
    </Tool>
  );
};

export default ColorTool;
