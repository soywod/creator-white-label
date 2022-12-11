import React, {FC} from "react";

export type DrawerProps = {
  footer?: FC;
  onClose?: () => void;
};
