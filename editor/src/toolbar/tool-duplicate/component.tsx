import React, {FC, useCallback} from "react";

import {useCanvas, useActiveObj, usePopover} from "../../canvas";
import Tool from "../../toolbar/tool";
import {ReactComponent as IconDuplicate} from "./icon.svg";

type DuplicateToolProps = {
  className?: string;
  label?: string;
  tooltip?: string;
};

export const DuplicateTool: FC<DuplicateToolProps> = props => {
  const canvas = useCanvas();
  const activeObj = useActiveObj();
  const popover = usePopover();

  const duplicate = useCallback(() => {
    if (!activeObj) return;
    activeObj.clone(
      (obj: typeof activeObj) => {
        if (!canvas) return;
        obj.left = (obj.left || 0) * 1.05;
        obj.top = (obj.top || 0) * 1.05;
        canvas.add(obj);
        canvas.setActiveObject(obj);
        canvas.requestRenderAll();
        popover.updatePopover(obj);
      },
      ["borderColor"],
    );
  }, [canvas, activeObj]);

  return (
    <Tool
      className={props.className}
      icon={IconDuplicate}
      onClick={duplicate}
      label={props.label}
      tooltip={props.tooltip}
    />
  );
};

export default DuplicateTool;
