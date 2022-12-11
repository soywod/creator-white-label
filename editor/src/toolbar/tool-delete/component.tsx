import React, {FC, useCallback} from "react";

import {useCanvas, usePopover, useActiveObjs} from "../../canvas";
import Tool from "../../toolbar/tool";
import {ReactComponent as IconDelete} from "./icon.svg";

type DeleteToolProps = {
  className?: string;
  onClick?: () => void;
  label?: string;
  tooltip?: string;
};

export const DeleteTool: FC<DeleteToolProps> = props => {
  const canvas = useCanvas();
  const activeObjs = useActiveObjs();
  const popover = usePopover();
  const broadcastClick = props.onClick || (() => {});

  const deleteObj = useCallback(() => {
    if (!canvas) return;
    popover.hidePopover();
    canvas.discardActiveObject();
    canvas.remove(...activeObjs);
    broadcastClick();
  }, [canvas, activeObjs, popover]);

  return (
    <Tool
      className={props.className}
      icon={IconDelete}
      onClick={deleteObj}
      label={props.label}
      tooltip={props.tooltip}
    />
  );
};

export default DeleteTool;
