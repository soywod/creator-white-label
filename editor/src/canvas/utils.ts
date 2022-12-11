export function fitTextboxToContent(obj: fabric.IText) {
  const textLinesMaxWidth = obj.textLines.reduce((max, _, i) => Math.max(max, obj.getLineWidth(i)), 0);
  obj.set({width: textLinesMaxWidth});
}

export default {fitTextboxToContent};
