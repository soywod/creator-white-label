import React, {FC, useCallback} from "react";

import {useCanvas, useToolbox} from "../../canvas";
import Tool from "../../toolbar/tool";
import {ReactComponent as IconCreate} from "./icon.svg";

type CreateToolProps = {
  className?: string;
  onClick?: () => void;
  label?: string;
};

export const CreateTool: FC<CreateToolProps> = props => {
  const canvas = useCanvas();
  const toolbox = useToolbox();
  const broadcastClick = props.onClick || (() => {});

  const createObj = useCallback(() => {
    if (!canvas) return;
    if (!toolbox) return;
    const obj = toolbox.newTextbox();
    canvas.add(obj);
    canvas.setActiveObject(obj);
    broadcastClick();
  }, [canvas, toolbox]);

  return <Tool className={props.className} icon={IconCreate} onClick={createObj} label={props.label} />;
};

export default CreateTool;
