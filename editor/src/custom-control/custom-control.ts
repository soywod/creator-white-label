import {fabric} from "fabric";

import iconResize from "./resize.svg";
import iconResizeX from "./resize-x.svg";
import iconResizeY from "./resize-y.svg";
import iconRotate from "./rotation.svg";

class CustomControlBuilder {
  private _width = 24;
  private _height = 24;
  private _x = 0;
  private _y = 0;
  private _icon = "";
  private _cursor = "";
  private _offsetX = 0;
  private _offsetY = 0;
  private _withConnection = false;
  private _mouseDownListener: Function | null = null;

  /**
   *  https://github.com/fabricjs/fabric.js/blob/master/src/mixins/default_controls.js
   */
  private _action: string = "";

  size(width: number, height?: number): this {
    this._width = width;
    this._height = height === undefined ? width : height;
    return this;
  }

  pos(x: number, y: number, offsetX = 0, offsetY = 0): this {
    this._x = x;
    this._y = y;
    this._offsetX = offsetX;
    this._offsetY = offsetY;
    return this;
  }

  icon(iconSrc: string): this {
    this._icon = iconSrc;
    return this;
  }

  cursor(cursorStyle: string): this {
    this._cursor = cursorStyle;
    return this;
  }

  action(action: string): this {
    this._action = action;
    return this;
  }

  onMouseDown(listener: Function): this {
    this._mouseDownListener = listener;
    return this;
  }

  connect(): this {
    this._withConnection = true;
    return this;
  }

  register(component: keyof typeof fabric, pos: string): void {
    const icon = document.createElement("img");
    icon.src = this._icon;

    const cursor =
      // @ts-ignore
      this._cursor in fabric.controlsUtils
        ? // @ts-ignore
          {cursorStyleHandler: fabric.controlsUtils[this._cursor]}
        : {cursorStyle: this._cursor};

    // @ts-ignore
    fabric[component].prototype.controls[pos] = new fabric.Control({
      x: this._x,
      y: this._y,
      sizeX: this._width,
      sizeY: this._height,
      touchSizeX: this._width,
      touchSizeY: this._height,
      offsetX: this._offsetX,
      offsetY: this._offsetY,
      withConnection: this._withConnection,
      ...cursor,
      // @ts-ignore
      actionHandler: typeof this._action === "string" ? fabric.controlsUtils[this._action] : this._action,
      // @ts-ignore
      mouseDownHandler: this._mouseDownListener,
      // @ts-ignore
      render: (ctx, left, top, _, obj) => {
        ctx.save();
        ctx.translate(left, top);
        ctx.rotate(fabric.util.degreesToRadians(obj.angle || 0));
        ctx.drawImage(icon, -this._width / 2, -this._height / 2, this._width, this._height);
        ctx.restore();
      },
    });
  }
}

const components: Array<keyof typeof fabric> = ["Object", "Textbox"];
const customControlsMap = {
  tl: new CustomControlBuilder()
    .pos(-0.5, -0.5)
    .icon(iconResize)
    .cursor("scaleCursorStyleHandler")
    .action("scalingEqually"),
  tr: new CustomControlBuilder()
    .pos(0.5, -0.5)
    .icon(iconResize)
    .cursor("scaleCursorStyleHandler")
    .action("scalingEqually"),
  mt: new CustomControlBuilder()
    .pos(0, -0.5)
    .size(24, 8)
    .icon(iconResizeY)
    .cursor("scaleSkewCursorStyleHandler")
    .action("scalingYOrSkewingX"),
  mr: new CustomControlBuilder()
    .pos(0.5, 0)
    .size(8, 24)
    .icon(iconResizeX)
    .cursor("scaleSkewCursorStyleHandler")
    .action("scalingXOrSkewingY"),
  mb: new CustomControlBuilder()
    .pos(0, 0.5)
    .size(24, 8)
    .icon(iconResizeY)
    .cursor("scaleSkewCursorStyleHandler")
    .action("scalingYOrSkewingX"),
  ml: new CustomControlBuilder()
    .pos(-0.5, 0)
    .size(8, 24)
    .icon(iconResizeX)
    .cursor("scaleSkewCursorStyleHandler")
    .action("scalingXOrSkewingY"),
  bl: new CustomControlBuilder()
    .pos(-0.5, 0.5)
    .icon(iconResize)
    .cursor("scaleCursorStyleHandler")
    .action("scalingEqually"),
  br: new CustomControlBuilder()
    .pos(0.5, 0.5)
    .icon(iconResize)
    .cursor("scaleCursorStyleHandler")
    .action("scalingEqually"),
  mtr: new CustomControlBuilder()
    .pos(0, -0.5, 0, -32)
    .size(32)
    .icon(iconRotate)
    .connect()
    .cursor("all-scroll")
    .action("rotationWithSnapping"),
};

export function registerAll() {
  for (const component of components) {
    for (const [pos, control] of Object.entries(customControlsMap)) {
      control.register(component, pos);
    }
  }
}

export default {registerAll};
