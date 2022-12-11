import React, {FC} from "react";

import Color from "./tool-color";
import Layer from "./tool-layer";
import Align from "./tool-align";
import Opacity from "./tool-opacity";
import Duplicate from "./tool-duplicate";
import Delete from "./tool-delete";

export const DefaultToolbar: FC = () => {
  return (
    <>
      <Color tooltip="Colorier" />
      <Layer tooltip="Positionner" />
      <Align tooltip="Aligner" />
      <Opacity tooltip="Opacifier" />
      <Duplicate tooltip="Dupliquer" />
      <Delete tooltip="Supprimer" />
    </>
  );
};
