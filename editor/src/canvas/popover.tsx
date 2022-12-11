import React, {FC, createContext, useCallback, useContext, useEffect, useState} from "react";
import {usePopper} from "react-popper";
import {fabric} from "fabric";

import {DefaultToolbar} from "../toolbar";
import {TextToolbar, TextEditToolbar} from "../text";
import {PhotoToolbar} from "../photo";
import {useCanvas, useActiveObj, useActiveTextObj, fitTextboxToContent} from ".";
import cs from "./popover.module.scss";

type PopoverInstance = {
  popoverStyles: React.CSSProperties;
  popoverProps?: {[key: string]: string};
  setPopoverEl: React.Dispatch<React.SetStateAction<HTMLDivElement | null>>;
  showPopover: (obj: fabric.Object) => void;
  hidePopover: () => void;
  updatePopover: (obj: fabric.Object) => void;
};

const context = createContext<PopoverInstance>({
  popoverStyles: {},
  setPopoverEl: () => {},
  showPopover: () => {},
  hidePopover: () => {},
  updatePopover: () => {},
});

export const PopoverContextProvider: FC = props => {
  const canvas = useCanvas();
  const activeObj = useActiveObj();
  const activeTextObj = useActiveTextObj();
  const [popoverEl, setPopoverEl] = useState<HTMLDivElement | null>(null);
  const popover = usePopper(virtualEl, popoverEl, {
    placement: "bottom",
    modifiers: [
      {
        name: "offset",
        options: {
          offset: [0, 16],
        },
      },
    ],
  });

  const updatePopover = useCallback(
    (obj: fabric.Object) => {
      if (!canvas) return;
      if (!popoverEl) return;

      if (obj instanceof fabric.IText) {
        fitTextboxToContent(obj);
      }

      if (obj instanceof fabric.Object) {
        const targetBoundingRect = obj.getBoundingRect();
        const canvasBoundingClientRect = canvas.getElement().getBoundingClientRect();
        const boundingRect = {
          width: targetBoundingRect.width,
          height: targetBoundingRect.height,
          top: canvasBoundingClientRect.y + targetBoundingRect.top,
          right: 0,
          bottom: 0,
          left: canvasBoundingClientRect.x + targetBoundingRect.left,
        };

        virtualEl.getBoundingClientRect = () => boundingRect;
        popover.update && popover.update();
      }
    },
    [canvas, popover, popoverEl],
  );

  const showPopover = useCallback(
    (obj: fabric.Object) => {
      if (!popoverEl) return;
      updatePopover(obj);
      popoverEl.setAttribute("data-visible", "");
    },
    [popoverEl, updatePopover],
  );

  const hidePopover = useCallback(() => {
    if (!popoverEl) return;
    if (activeTextObj && activeTextObj.isEditing) return;
    popoverEl.removeAttribute("data-visible");
  }, [popoverEl, activeTextObj]);

  useEffect(() => {
    if (!canvas) return;
    const togglePopover = () => (activeObj ? showPopover(activeObj) : hidePopover());
    canvas.on("mouse:up", togglePopover);
    canvas.on("mouse:down", hidePopover);
    return () => {
      canvas.off("mouse:up", togglePopover);
      canvas.off("mouse:down", hidePopover);
    };
  }, [canvas, activeObj, showPopover, hidePopover]);

  return (
    <context.Provider
      value={{
        popoverStyles: popover.styles.popper,
        popoverProps: popover.attributes.popper,
        setPopoverEl,
        showPopover,
        hidePopover,
        updatePopover,
      }}
    >
      {props.children}
    </context.Provider>
  );
};

const virtualEl = {
  getBoundingClientRect() {
    return {
      width: 0,
      height: 0,
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    };
  },
};

export function usePopover(): PopoverInstance {
  return useContext(context);
}

export const Popover: FC = () => {
  const canvas = useCanvas();
  const activeObj = useActiveObj();
  const popover = usePopover();
  const [isEditingText, setEditingText] = useState(false);

  function closePopover() {
    if (!canvas) return;
    popover.hidePopover();
    canvas.discardActiveObject();
    canvas.requestRenderAll();
  }

  useEffect(() => {
    if (!canvas) return;
    const enableEditing = () => setEditingText(true);
    const updatePopover = (evt: fabric.IEvent) => evt.target && popover.updatePopover(evt.target);
    const disableEditing = () => setEditingText(false);
    canvas.on("text:editing:entered", enableEditing);
    canvas.on("text:changed", updatePopover);
    canvas.on("text:editing:exited", disableEditing);
    return () => {
      canvas.off("text:editing:entered", enableEditing);
      canvas.off("text:changed", updatePopover);
      canvas.off("text:editing:exited", disableEditing);
    };
  }, [canvas, popover]);

  const Toolbar = (() => {
    if (activeObj instanceof fabric.IText) return isEditingText ? TextEditToolbar : TextToolbar;
    if (activeObj instanceof fabric.Image) return PhotoToolbar;
    return DefaultToolbar;
  })();

  useEffect(() => {
    if (!activeObj) {
      popover.hidePopover();
    }
  }, [activeObj, popover]);

  return (
    <div ref={popover.setPopoverEl} className={cs.container} style={popover.popoverStyles} {...popover.popoverProps}>
      <div className={cs.content}>
        <Toolbar />
        <button className={cs.close} onClick={closePopover}>
          ×
        </button>
      </div>
    </div>
  );
};
