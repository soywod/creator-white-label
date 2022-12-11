import {useMemo} from "react";
import {fabric} from "fabric";

import {useCanvas} from ".";

export function useToolbox() {
  const canvas = useCanvas();

  return useMemo(() => {
    let left = canvas ? canvas.getVpCenter().x : 0;
    let top = canvas ? canvas.getVpCenter().y : 0;

    return {
      newTextbox: () =>
        new fabric.Textbox("", {
          lockScalingFlip: true,
          borderColor: "#3240ff",
          fontFamily: "Roboto",
          originX: "center",
          originY: "center",
          left,
          top,
        }),
    };
  }, [canvas]);
}
