import React, {FC} from "react";

export type CreatorSubmitComponentCallbackOutput = {
  width: number;
  height: number;
  weight: number;
  quantity: number;
  price: number;
  preview: string;
  config: string;
  svg: string;
  product: string;
  shape?: string;
  fixation?: string;
  isTransparent?: boolean;
};

export type CreatorSubmitComponentCallback = () => Promise<CreatorSubmitComponentCallbackOutput>;

export type CreatorSubmitComponentProps = {
  onSubmit: CreatorSubmitComponentCallback;
};

export type CreatorProps = {
  templateId?: number;
  config?: Record<string, any>;
  step?: number;
  productId?: number;
  submitComponent?: FC<CreatorSubmitComponentProps>;
};
