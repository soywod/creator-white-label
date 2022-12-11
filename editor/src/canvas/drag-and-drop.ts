import {useEffect, useState} from "react";

import {useCanvas} from "./context";

export type UseDragAndDrop = <T>(callback: (params: T) => void) => DragEventsContainer<T>;

export type DragEventsContainer<T> = (params: T) => DragEvents;

export type DragEvents = {
  draggable: true;
  onClick: () => void;
  onDragStart: () => void;
};

export const useDragAndDrop: UseDragAndDrop = <T>(callback: (params: T) => void) => {
  const canvas = useCanvas();
  const [dropTriggered, triggerDrop] = useState(false);
  const [itemDragged, dragItem] = useState<T | null>(null);

  useEffect(() => {
    if (!canvas) {
      return;
    }

    // Because the drop event is triggered first,
    // 2 steps are required to process the img
    canvas.on("drop", () => {
      triggerDrop(true);
    });

    return () => {
      canvas.off("drop");
    };
  }, [canvas]);

  useEffect(() => {
    if (dropTriggered && itemDragged) {
      callback(itemDragged);
      dragItem(null);
      triggerDrop(false);
    }
  }, [callback, dropTriggered, itemDragged]);

  return (params: T) => ({
    draggable: true,
    onDragStart: () => {
      if (!itemDragged && !dropTriggered) {
        dragItem(params);
      }
    },
    onClick: () => {
      callback(params);
      dragItem(null);
      triggerDrop(false);
    },
  });
};
