import React, {FC} from "react";

export type ModalProps = {
  footer?: FC;
  onClose?: () => void;
};
