import React, {FC} from "react";

import {Separator} from "../toolbar";
import Align from "./tool-align";
import AlignEdit from "./tool-edit-align";
import Delete from "../toolbar/tool-delete";
import Color from "./tool-color";
import ColorEdit from "./tool-edit-color";
import Bold from "./tool-bold";
import BoldEdit from "./tool-edit-bold";
import Italic from "./tool-italic";
import ItalicEdit from "./tool-edit-italic";
import Underline from "./tool-underline";
import UnderlineEdit from "./tool-edit-underline";
import Family from "./tool-family";
import FamilyEdit from "./tool-edit-family";
import Edit from "./tool-edit";
import More from "./tool-more";

export const TextToolbar: FC = () => {
  return (
    <>
      <Edit tooltip="Modifier le texte" />
      <Separator />
      <Bold tooltip="Gras" />
      <Italic tooltip="Italic" />
      <Underline tooltip="Souligner" />
      <Separator />
      <Align tooltip="Aligner" />
      <Color tooltip="Colorier" />
      <Family />
      <Separator />
      <More />
      <Delete tooltip="Supprimer" />
    </>
  );
};

export const TextEditToolbar: FC = () => {
  return (
    <>
      <Edit tooltip="Modifier le texte" />
      <Separator />
      <BoldEdit tooltip="Gras" />
      <ItalicEdit tooltip="Italic" />
      <UnderlineEdit tooltip="Souligné" />
      <Separator />
      <AlignEdit tooltip="Aligner" />
      <ColorEdit tooltip="Colorier" />
      <FamilyEdit />
    </>
  );
};

export default TextToolbar;
