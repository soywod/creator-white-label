import React, {FC, forwardRef, useState} from "react";
import cn from "classnames";
import tinycolor from "tinycolor2";

import cs from "./spinner.module.scss";

type SpinnerProps = {
  ref?: React.Ref<HTMLDivElement>;
  className?: string;
  color?: string;
};

export const Spinner: FC<SpinnerProps> = forwardRef(({className, color = "#ffffff"}, ref) => {
  const [animationDuration] = useState(`${Math.round(Math.random() * 1000) + 1000}ms`);

  return (
    <div
      ref={ref}
      className={cn(cs.spinner, className)}
      style={{
        borderColor: tinycolor(color).setAlpha(0.2).toRgbString(),
        borderLeftColor: color,
        animationDuration,
      }}
    />
  );
});

export default Spinner;
