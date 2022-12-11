import React, {FC, useState, useContext, createContext, useEffect} from "react";
import {fabric} from "fabric";

type CanvasContext = [fabric.Canvas | null, React.Dispatch<React.SetStateAction<fabric.Canvas | null>>];

const context = createContext<CanvasContext>([null, () => {}]);

export const CanvasContextProvider: FC = props => {
  const state = useState<fabric.Canvas | null>(null);
  return <context.Provider value={state}>{props.children}</context.Provider>;
};

export function useCanvasContext(): CanvasContext {
  return useContext(context);
}

export function useCanvas(): fabric.Canvas | null {
  return useContext(context)[0];
}

export function useActiveObj(): fabric.Object | null {
  const canvas = useCanvas();
  const defaultActiveObj = (canvas && canvas.getActiveObject()) || null;
  const [activeObj, setActiveObj] = useState(defaultActiveObj);

  useEffect(() => {
    function handleSelectionUpdated() {
      if (!canvas) return;
      setActiveObj(canvas.getActiveObject());
    }

    function handleSelectionCleared() {
      setActiveObj(null);
    }

    if (canvas) {
      canvas.on("selection:created", handleSelectionUpdated);
      canvas.on("selection:updated", handleSelectionUpdated);
      canvas.on("selection:cleared", handleSelectionCleared);

      return () => {
        canvas.off("selection:created", handleSelectionUpdated);
        canvas.off("selection:updated", handleSelectionUpdated);
        canvas.off("selection:cleared", handleSelectionCleared);
      };
    }
  }, [canvas]);

  return activeObj;
}
export function useActiveObjs(): fabric.Object[] {
  const canvas = useCanvas();
  const defaultActiveObjs = canvas ? canvas.getActiveObjects() : [];
  const [activeObjs, setActiveObjs] = useState(defaultActiveObjs);

  useEffect(() => {
    function handleSelectionUpdated() {
      if (!canvas) return;
      setActiveObjs(canvas.getActiveObjects());
    }

    function handleSelectionCleared() {
      setActiveObjs([]);
    }

    if (canvas) {
      canvas.on("selection:created", handleSelectionUpdated);
      canvas.on("selection:updated", handleSelectionUpdated);
      canvas.on("selection:cleared", handleSelectionCleared);

      return () => {
        canvas.off("selection:created", handleSelectionUpdated);
        canvas.off("selection:updated", handleSelectionUpdated);
        canvas.off("selection:cleared", handleSelectionCleared);
      };
    }
  }, [canvas]);

  return activeObjs;
}

export function useActiveTextObjs(): fabric.IText[] {
  const activeObjs = useActiveObjs();
  return activeObjs.reduce<fabric.IText[]>((texts, obj) => {
    if (obj instanceof fabric.IText) texts.push(obj);
    return texts;
  }, []);
}

export function useActiveTextObj(): fabric.IText | null {
  const activeTextObjs = useActiveTextObjs();
  return activeTextObjs.length === 1 ? activeTextObjs[0] : null;
}
