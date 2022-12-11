import React, {FC, useCallback, useEffect, useState} from "react";
import {ChromePicker} from "react-color";
import tinycolor from "tinycolor2";
import cn from "classnames";

import {useCanvas, useActiveTextObj} from "../../canvas";
import Tool, {useTool} from "../../toolbar/tool";
import {ReactComponent as IconColor} from "./icon.svg";
import {ReactComponent as IconColorSelected} from "./icon-selected.svg";
import {ReactComponent as IconForward} from "./icon-forward.svg";
import {ReactComponent as IconBackward} from "./icon-backward.svg";

import cs from "./component.module.scss";

const colors = [
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
];

export type ColorPaletteProps = {
  onClick: (color: string) => void;
  selectedColor?: string;
  className?: string;
  style?: React.CSSProperties;
};

export const ColorPalette: FC<ColorPaletteProps> = props => {
  return (
    <div className={cn(cs.grid, props.className)} style={props.style}>
      {colors.map(color => (
        <button
          key={color}
          className={cs.gridItem}
          onClick={() => props.onClick(color)}
          style={{
            background: color,
            borderColor: tinycolor(color).darken(15).toHexString(),
          }}
        >
          {color === props.selectedColor && (
            <IconColorSelected color={tinycolor(props.selectedColor).isDark() ? "#ffffff" : "#000000"} />
          )}
        </button>
      ))}
      {props.children}
    </div>
  );
};

type TextColorMode = "normal" | "custom";
type TextColorEditToolProps = {
  icon?: FC<React.HtmlHTMLAttributes<SVGSVGElement>>;
  tooltip?: string;
};

export const TextColorEditTool: FC<TextColorEditToolProps> = props => {
  const icon = props.icon || IconColor;
  const canvas = useCanvas();
  const activeTextObj = useActiveTextObj();
  const tool = useTool();
  const [mode, setMode] = useState<TextColorMode>("normal");

  const readColor = useCallback<() => string>(() => {
    if (!activeTextObj) return;
    const globalColor = activeTextObj.fill ? activeTextObj.fill.toString() : undefined;
    if (activeTextObj.getSelectionStyles().length === 0) {
      const selectionStart = Math.max(1, activeTextObj.selectionStart || 1);
      const selectionStyles = activeTextObj.getSelectionStyles(selectionStart - 1, selectionStart);
      const color = (0 in selectionStyles && selectionStyles[0].fill) || undefined;
      return color || globalColor;
    } else {
      const selectionStyles = activeTextObj.getSelectionStyles();
      const color = selectionStyles.reduce((color, style) => {
        const c = style.fill || globalColor;
        return color === c ? color : undefined;
      }, selectionStyles[0].fill || globalColor);
      return color;
    }
  }, [activeTextObj]);

  const [color, setColor] = useState(readColor());

  useEffect(() => {
    if (tool.tooltipVisible) {
      setMode("normal");
    }
  }, [tool.tooltipVisible]);

  useEffect(() => {
    if (!activeTextObj) return;
    const handler = () => setColor(readColor());
    activeTextObj.on("selection:changed", handler);
    return () => {
      activeTextObj.off("selection:changed", handler);
    };
  }, [activeTextObj, readColor]);

  function updateColor(color: string, hide = true) {
    if (!canvas) return;
    if (!activeTextObj) return;
    if (activeTextObj.getSelectionStyles().length > 0) {
      activeTextObj.setSelectionStyles({fill: color});
    } else {
      activeTextObj.removeStyle("fill");
      activeTextObj.set({fill: color});
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

export default TextColorEditTool;
