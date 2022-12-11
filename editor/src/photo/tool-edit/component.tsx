import React, {FC} from "react";
import {fabric} from "fabric";

import {useActiveObj, useCanvas} from "../../canvas";
import Tool from "../../toolbar/tool";
import filestack from "../../filestack";
import {ReactComponent as Icon} from "./icon.svg";

export const EditTool: FC = () => {
  const canvas = useCanvas();
  const activeObj = useActiveObj();

  async function uploadMedia() {
    if (!canvas) return;
    if (!(activeObj instanceof fabric.Image)) return;

    const picker = filestack.getClient().picker({
      minFiles: 1,
      maxFiles: 1,
      lang: window.navigator.language.split("-")[0],
      accept: ["image/*", "video/*", "application/*", "text/plain"],
      onUploadDone: ({filesUploaded}) => {
        const file = filesUploaded[0];
        const nextFiles = [...JSON.parse(localStorage.getItem("files") || "[]"), file];
        localStorage.setItem("files", JSON.stringify(nextFiles));
        activeObj.setSrc(file.url, () => {
          canvas.discardActiveObject();
          canvas.requestRenderAll();
        });
      },
    });

    picker.open();
  }

  return <Tool icon={Icon} onClick={uploadMedia} tooltip="Remplacer l'image" />;
};

export default EditTool;
