import React, {FC, useEffect, useState} from "react";

import {useCanvas, useActiveTextObj, usePopover} from "../../canvas";
import Tool from "../../toolbar/tool";
import {ReactComponent as IconBold} from "./icon.svg";

type EditToolProps = {
  tooltip?: string;
};

export const EditTool: FC<EditToolProps> = props => {
  const canvas = useCanvas();
  const activeTextObj = useActiveTextObj();
  const popover = usePopover();
  const defaultEditMode = Boolean(activeTextObj && activeTextObj.isEditing);
  const [editMode, setEditMode] = useState(defaultEditMode);

  function toggleEditMode() {
    if (!canvas) return;
    if (!activeTextObj) return;
    if (activeTextObj.isEditing) {
      activeTextObj.exitEditing();
    } else {
      activeTextObj.enterEditing();
      activeTextObj.selectAll();
    }
    popover.updatePopover(activeTextObj);
    canvas.requestRenderAll();
  }

  useEffect(() => {
    if (!canvas) return;
    const enableEditing = () => setEditMode(true);
    const disableEditing = () => setEditMode(false);
    canvas.on("text:editing:entered", enableEditing);
    canvas.on("text:editing:exited", disableEditing);
    return () => {
      canvas.off("text:editing:entered", enableEditing);
      canvas.off("text:editing:exited", disableEditing);
    };
  }, [canvas]);

  return <Tool icon={IconBold} label="Modifier" active={editMode} onClick={toggleEditMode} tooltip={props.tooltip} />;
};

export default EditTool;
