import React, {FC, forwardRef} from "react";
import cn from "classnames";

import cs from "./component.module.scss";

type SpinnerProps = {
  ref?: React.Ref<HTMLDivElement>;
  className?: string;
  color?: string;
};

export const Spinner: FC<SpinnerProps> = forwardRef(({className, color = "#ffffff"}, ref) => {
  const style: React.CSSProperties = {borderColor: `${color} transparent transparent transparent`};
  return (
    <div ref={ref} className={cn(cs.spinner, className)}>
      <div style={style}></div>
      <div style={style}></div>
      <div style={style}></div>
      <div style={style}></div>
    </div>
  );
});

export default Spinner;
