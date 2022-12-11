import React, {FC, useCallback, useEffect, useMemo, useRef, useState} from "react";
import {usePopper} from "react-popper";
import Tippy from "@tippyjs/react";
import cn from "classnames";
import {v4 as uuid} from "uuid";

import cs from "./tool.module.scss";

function isOutside(target: EventTarget | null, source: EventTarget | null) {
  if (!(target instanceof Node)) return false;
  if (!(source instanceof Node)) return false;
  if (source.isEqualNode(target)) return false;
  if (source.contains(target)) return false;
  return true;
}

export type ToolInstance = {
  id: string;
  toolEl: HTMLButtonElement | null;
  setToolEl: (ref: HTMLButtonElement) => void;
  tooltipEl: HTMLDivElement | null;
  setTooltipEl: (ref: HTMLDivElement) => void;
  tooltipVisible: boolean;
  showTooltip: () => void;
  hideTooltip: () => void;
  toggleTooltip: () => void;
  tooltipStyles: React.CSSProperties;
  tooltipProps?: {[key: string]: string};
};

export function useTool(): ToolInstance {
  const [toolEl, setToolEl] = useState<HTMLButtonElement | null>(null);
  const [tooltipEl, setTooltipEl] = useState<HTMLDivElement | null>(null);
  const [tooltipVisible, showTooltip] = useState(false);
  const [refreshRequested, requestRefresh] = useState(false);

  const id = useRef(uuid());
  const tooltip = usePopper(toolEl, tooltipEl, {
    placement: "bottom",
    modifiers: [
      {
        name: "offset",
        options: {
          offset: [0, 8],
        },
      },
    ],
  });
  const instance = useMemo<ToolInstance>(
    () => ({
      id: id.current,
      toolEl,
      setToolEl,
      tooltipEl,
      setTooltipEl,
      showTooltip: () => {
        showTooltip(true);
        requestRefresh(true);
      },
      hideTooltip: () => {
        showTooltip(false);
        requestRefresh(true);
      },
      toggleTooltip: () => {
        showTooltip(v => !v);
        requestRefresh(true);
      },
      tooltipVisible,
      tooltipStyles: tooltip.styles.popper,
      tooltipProps: tooltip.attributes.popper,
    }),
    [tooltip.styles.popper, tooltip.attributes.popper, tooltipVisible],
  );

  useEffect(() => {
    if (!tooltip) return;
    if (!tooltipEl) return;
    if (!refreshRequested) return;
    if (tooltipVisible) {
      tooltip.update && tooltip.update();
      tooltipEl.setAttribute("data-visible", "");
    } else {
      tooltipEl.removeAttribute("data-visible");
    }
    requestRefresh(false);
  }, [tooltipVisible, tooltipEl, tooltip, instance.id, refreshRequested]);

  return instance;
}

type BasicToolProps = {
  className?: string;
  active?: boolean;
  onClick: () => void;
  icon: FC<React.HtmlHTMLAttributes<SVGSVGElement>>;
  iconStyle?: React.CSSProperties;
  iconClassName?: string;
  label?: string;
  tooltip?: string | JSX.Element;
};

type TooltipedToolProps = Omit<BasicToolProps, "onClick"> & {
  onClick?: () => void;
  tool: ToolInstance;
  tooltipClassName?: string;
  tooltipStyle?: React.CSSProperties;
  tooltipContentClassName?: string;
  tooltipContentStyle?: React.CSSProperties;
};

function isTooltipedToolProps(props: ToolProps): props is TooltipedToolProps {
  return "tool" in props;
}

type ToolProps = BasicToolProps | TooltipedToolProps;

export const Tool: FC<ToolProps> = props => {
  const state = isTooltipedToolProps(props)
    ? {
        toolEl: props.tool.toolEl,
        setToolEl: props.tool.setToolEl,
        handleToolClick: () => {
          props.tool.toggleTooltip();
          props.onClick && props.onClick();
        },
        tooltipEl: props.tool.tooltipEl,
        tooltip: (
          <div
            ref={props.tool.setTooltipEl}
            className={cn(cs.tooltip, props.tooltipClassName)}
            style={{...props.tool.tooltipStyles, ...props.tooltipStyle}}
            {...props.tool.tooltipProps}
          >
            <div className={cn(cs.tooltipContent, props.tooltipContentClassName)} style={props.tooltipContentStyle}>
              {props.children}
            </div>
          </div>
        ),
        hideTooltip: props.tool.hideTooltip,
        active: props.tool.tooltipVisible,
      }
    : {
        toolEl: null,
        setToolEl: null,
        handleToolClick: props.onClick,
        tooltipEl: null,
        tooltip: null,
        hideTooltip: () => undefined,
        active: props.active,
      };

  const handleClickOutside = useCallback(
    evt => {
      if (!state.tooltipEl) return;
      if (!state.toolEl) return;
      const isBetweenDocumentAndTarget = [state.tooltipEl, state.toolEl].every(el => {
        const isInsideDocument = !isOutside(evt.target, document);
        const isOutsideOfTarget = isOutside(evt.target, el);
        return isInsideDocument && isOutsideOfTarget;
      });
      if (isBetweenDocumentAndTarget) {
        state.hideTooltip();
      }
    },
    [state.toolEl, state.tooltipEl, state.hideTooltip],
  );

  useEffect(() => {
    if (!state.active) return;
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [state.active, handleClickOutside]);

  return (
    <>
      <Tippy
        content={props.tooltip}
        disabled={Boolean(!props.tooltip || (state.toolEl && state.active))}
        reference={state.toolEl}
        placement="bottom"
        offset={[0, 16]}
      >
        <button
          ref={state.setToolEl}
          className={cn(cs.button, props.className, {[cs.active]: state.active})}
          onClick={state.handleToolClick}
        >
          <props.icon className={cn(cs.icon, props.iconClassName)} style={props.iconStyle} />
          {props.label}
        </button>
      </Tippy>
      {state.tooltip}
    </>
  );
};

export default Tool;
