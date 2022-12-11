import React, {FC} from "react";

import {DefaultToolbar, Separator} from "../toolbar";
import EditTool from "./tool-edit";

export const PhotoToolbar: FC = () => {
  return (
    <>
      <EditTool />
      <Separator />
      <DefaultToolbar />
    </>
  );
};

export default PhotoToolbar;
