import { useState, useRef, useLayoutEffect } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";

export interface TooltipContent {
  title: string;
  description?: string | ReactNode;
}

export type TooltipPosition = "top" | "bottom" | "left" | "right";
export type TooltipAlign = "start" | "center" | "end";

interface TooltipProps {
  children: ReactNode;
  content: TooltipContent;
  position?: TooltipPosition;
  align?: TooltipAlign;
}

const TOOLTIP_GAP = 8;
const VIEWPORT_PADDING = 8;

function calculatePosition(
  triggerRect: DOMRect,
  tooltipRect: DOMRect,
  position: TooltipPosition,
  align: TooltipAlign
): { top: number; left: number } {
  let top = 0;
  let left = 0;

  // Calculate base position
  switch (position) {
    case "top":
      top = triggerRect.top - tooltipRect.height - TOOLTIP_GAP;
      left =
        align === "start"
          ? triggerRect.left
          : align === "end"
            ? triggerRect.right - tooltipRect.width
            : triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
      break;
    case "bottom":
      top = triggerRect.bottom + TOOLTIP_GAP;
      left =
        align === "start"
          ? triggerRect.left
          : align === "end"
            ? triggerRect.right - tooltipRect.width
            : triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
      break;
    case "left":
      top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
      left = triggerRect.left - tooltipRect.width - TOOLTIP_GAP;
      break;
    case "right":
      top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
      left = triggerRect.right + TOOLTIP_GAP;
      break;
  }

  // Clamp to viewport
  if (left < VIEWPORT_PADDING) left = VIEWPORT_PADDING;
  if (left + tooltipRect.width > window.innerWidth - VIEWPORT_PADDING) {
    left = window.innerWidth - tooltipRect.width - VIEWPORT_PADDING;
  }
  if (top < VIEWPORT_PADDING) top = VIEWPORT_PADDING;
  if (top + tooltipRect.height > window.innerHeight - VIEWPORT_PADDING) {
    top = window.innerHeight - tooltipRect.height - VIEWPORT_PADDING;
  }

  return { top, left };
}

const ARROW_BASE = "absolute w-3 h-3 bg-[#1e1e2e] border-[#45475a] rotate-45";

function getArrowClasses(position: TooltipPosition, align: TooltipAlign): string {
  const alignClass =
    align === "start" ? "left-3" : align === "end" ? "right-3" : "left-1/2 -translate-x-1/2";

  switch (position) {
    case "top":
      return `${ARROW_BASE} -bottom-1.5 border-r border-b ${alignClass}`;
    case "bottom":
      return `${ARROW_BASE} -top-1.5 border-l border-t ${alignClass}`;
    case "left":
      return `${ARROW_BASE} -right-1.5 border-r border-t top-1/2 -translate-y-1/2`;
    case "right":
      return `${ARROW_BASE} -left-1.5 border-l border-b top-1/2 -translate-y-1/2`;
  }
}

export function Tooltip({
  children,
  content,
  position = "top",
  align = "center",
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!isVisible || !triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const newCoords = calculatePosition(triggerRect, tooltipRect, position, align);
    setCoords(newCoords);
  }, [isVisible, position, align]);

  const tooltipContent = (
    <div
      ref={tooltipRef}
      className="fixed px-3 py-2 bg-[#1e1e2e] border border-[#45475a] rounded-lg shadow-xl z-[9999] pointer-events-none whitespace-nowrap"
      style={{
        top: coords.top,
        left: coords.left,
        opacity: isVisible ? 1 : 0,
        visibility: isVisible ? "visible" : "hidden",
        transition: "opacity 150ms, visibility 150ms",
      }}
    >
      <p className="text-sm text-[#cdd6f4] font-medium">{content.title}</p>
      {content.description && (
        <div className="text-xs text-[#a6adc8] mt-0.5">{content.description}</div>
      )}
      <div className={getArrowClasses(position, align)} />
    </div>
  );

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="inline-flex"
      >
        {children}
      </div>
      {createPortal(tooltipContent, document.body)}
    </>
  );
}
