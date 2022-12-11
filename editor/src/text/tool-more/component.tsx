import React, {FC, useState} from "react";

import Tool from "../../toolbar/tool";
import {ReactComponent as IconMore} from "./icon.svg";
import {DuplicateTool} from "../../toolbar/tool-duplicate";
import {OpacityTool} from "../../toolbar/tool-opacity";
import {AlignTool} from "../../toolbar/tool-align";
import {LayerTool} from "../../toolbar/tool-layer";

type MoreToolProps = {
  className?: string;
  onClick?: () => void;
  label?: string;
};

export const MoreTool: FC<MoreToolProps> = props => {
  const broadcastClick = props.onClick || (() => {});
  const [moreVisible, showMore] = useState(false);

  function handleClick() {
    showMore(true);
    broadcastClick();
  }

  return moreVisible ? (
    <>
      <LayerTool tooltip="Positionner" />
      <AlignTool tooltip="Aligner" />
      <OpacityTool tooltip="Opacifier" />
      <DuplicateTool tooltip="Dupliquer" />
    </>
  ) : (
    <Tool
      className={props.className}
      icon={IconMore}
      onClick={handleClick}
      label={props.label}
      tooltip="Plus d'outils…"
    />
  );
};

export default MoreTool;
