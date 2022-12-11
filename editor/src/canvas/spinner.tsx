import React, {FC} from "react";
import cn from "classnames";

import {Spinner, useAsync} from "../async";
import cs from "./spinner.module.scss";

export const CanvasSpinner: FC = () => {
  const loading = useAsync();

  return (
    <div className={cn(cs.spinner, {[cs.visible]: loading})}>
      <Spinner color="#0ec2f9" />
    </div>
  );
};

export default CanvasSpinner;
