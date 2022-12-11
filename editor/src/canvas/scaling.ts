import {fabric} from "fabric";

export function scaleObjToCanvas<T extends fabric.Object | fabric.Image>(canvas: fabric.Canvas, obj: T): T {
  const vpt = canvas.viewportTransform || [];
  const invertedVpt = fabric.util.invertTransform(vpt);
  const canvasRatio = canvas.getWidth() / canvas.getHeight();
  const imgRatio = (obj.width || 0) / (obj.height || 1);

  if (imgRatio < canvasRatio) {
    let pt = new fabric.Point(canvas.getWidth(), 0);
    pt = fabric.util.transformPoint(pt, invertedVpt);
    obj.scaleToWidth(pt.x);
  } else {
    let pt = new fabric.Point(0, canvas.getHeight());
    pt = fabric.util.transformPoint(pt, invertedVpt);
    obj.scaleToHeight(pt.y);
  }

  let centerPt = new fabric.Point(canvas.getWidth() * 0.5, canvas.getHeight() * 0.5);
  centerPt = fabric.util.transformPoint(centerPt, invertedVpt);
  obj.set({left: centerPt.x, top: centerPt.y, originX: "center", originY: "center"});

  return obj;
}
