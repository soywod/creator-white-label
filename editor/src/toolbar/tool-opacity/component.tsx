import React, {FC, useCallback, useEffect, useState} from "react";

import {useCanvas, useActiveObj} from "../../canvas";
import Tool, {useTool} from "../tool";
import {ReactComponent as IconOpacity} from "./icon.svg";

type OpacityToolProps = {
  className?: string;
  label?: string;
  tooltip?: string;
};

export const OpacityTool: FC<OpacityToolProps> = props => {
  const canvas = useCanvas();
  const activeObj = useActiveObj();
  const tool = useTool();
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    if (!activeObj) return;
    setOpacity(activeObj.opacity === undefined ? 1 : activeObj.opacity);
  }, [activeObj]);

  const writeOpacity = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => {
      if (!canvas) return;
      if (!activeObj) return;
      const opacity = Number.parseFloat(evt.target.value);
      activeObj.set({opacity});
      setOpacity(opacity);
      canvas.requestRenderAll();
    },
    [canvas, activeObj],
  );

  return (
    <Tool className={props.className} tool={tool} icon={IconOpacity} label={props.label} tooltip={props.tooltip}>
      <input type="range" min={0} max={1} step={0.05} value={opacity} onChange={writeOpacity} />
    </Tool>
  );
};

export default OpacityTool;
