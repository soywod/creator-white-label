import React, {FC, useState} from "react";
import cn from "classnames";

import {useOrder} from "../order";
import {ProductModal} from "../product";
import {DimensionModal} from "../dimension";
import {FixationModal} from "../fixation";
import {ReactComponent as IconProduct} from "../nav/material.svg";
import {ReactComponent as IconDimension} from "../nav/dimension.svg";
import {ReactComponent as IconFixation} from "../nav/fixation.svg";
import {ReactComponent as IconPrev} from "./prev.svg";
import {ReactComponent as IconNext} from "./next.svg";
import cs from "./component.module.scss";

export type StepperProps = {
  enable: boolean;
  step?: number;
};

export const Stepper: FC<StepperProps> = props => {
  const [enable, setEnable] = useState(props.enable);
  const [stepIdx, setStepIdx] = useState(props.step || 0);
  const order = useOrder();

  if (!enable) {
    return null;
  }

  const currentStep = (() => {
    switch (stepIdx) {
      case 0: {
        return (
          <ProductModal
            footer={() => {
              return (
                <>
                  <span>
                    Produit : <strong>{order.product && order.product.title}</strong>
                  </span>
                  <button className={cs.btnNext} onClick={() => setStepIdx(1)}>
                    Étape suivante
                    <IconNext className={cs.btnNextIcon} />
                  </button>
                </>
              );
            }}
          />
        );
      }
      case 1: {
        const orientationStr = (() => {
          if (!order) return;
          if (order.width > order.height) return " (paysage)";
          else if (order.width < order.height) return " (portrait)";
          else return;
        })();

        return (
          <DimensionModal
            footer={() => {
              return (
                <>
                  <button className={cs.btnPrev} onClick={() => setStepIdx(0)}>
                    <IconPrev className={cs.btnPrevIcon} />
                  </button>
                  <span>
                    Dimensions :{" "}
                    <strong>
                      {order.width} &times; {order.height} cm{orientationStr}
                    </strong>
                  </span>
                  <button className={cs.btnNext} onClick={() => setStepIdx(2)}>
                    Étape suivante
                    <IconNext className={cs.btnNextIcon} />
                  </button>
                </>
              );
            }}
          />
        );
      }
      case 2: {
        return (
          <FixationModal
            footer={() => {
              return (
                <>
                  <button className={cs.btnPrev} onClick={() => setStepIdx(1)}>
                    <IconPrev className={cs.btnPrevIcon} />
                  </button>
                  <span>
                    Fixation : <strong>{order.fixation && order.fixation.name}</strong>
                  </span>
                  <button className={cs.btnNext} onClick={() => setEnable(false)}>
                    Commencer la création
                    <IconNext className={cs.btnNextIcon} />
                  </button>
                </>
              );
            }}
          />
        );
      }
    }
  })();

  return (
    <div className={cs.container}>
      <div className={cs.stepper}>
        <Step
          idx={0}
          stepIdx={stepIdx}
          setStepIdx={() => setStepIdx(0)}
          label="Produits"
          icon={IconProduct}
          separator
        />
        <Step
          idx={1}
          stepIdx={stepIdx}
          setStepIdx={() => setStepIdx(1)}
          label="Dimensions"
          icon={IconDimension}
          separator
        />
        <Step idx={2} stepIdx={stepIdx} setStepIdx={() => setStepIdx(2)} label="Fixations" icon={IconFixation} />
      </div>
      {currentStep}
    </div>
  );
};

type StepProps = {
  idx: number;
  stepIdx: number;
  setStepIdx: () => void;
  label: string;
  icon: FC<React.SVGProps<SVGSVGElement>>;
  separator?: boolean;
};

const Step: FC<StepProps> = props => {
  const {idx, stepIdx, setStepIdx, label, icon: Icon, separator = false} = props;
  return (
    <>
      <button
        className={cn(cs.stepBtn, {
          [cs.stepBtnDone]: stepIdx >= idx,
          [cs.stepBtnActive]: stepIdx === idx,
        })}
        onClick={() => stepIdx >= idx && setStepIdx()}
      >
        <Icon className={cs.stepIcon} />
      </button>
      <span
        className={cn(cs.stepLabel, {
          [cs.stepLabelDone]: stepIdx >= idx,
          [cs.stepLabelActive]: stepIdx === idx,
        })}
      >
        {label}
      </span>
      {separator && (
        <>
          <span className={cn(cs.stepSeparator, {[cs.stepSeparatorActive]: stepIdx > idx})} />
          <span />
        </>
      )}
    </>
  );
};

export default Stepper;
