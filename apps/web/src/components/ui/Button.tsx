import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Tooltip, type TooltipContent, type TooltipPosition, type TooltipAlign } from "./Tooltip";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg";
}

export interface IconButtonProps {
  icon: ReactNode;
  onClick?: () => void;
  size?: "xss" | "xs" | "sm" | "lg";
  variant?: "default" | "ghost" | "danger" | "success" | "primary" | "white" | "twiced" | "toolr";
  active?: boolean;
  disabled?: boolean;
  tooltip?: TooltipContent;
  tooltipPosition?: TooltipPosition;
  tooltipAlign?: TooltipAlign;
  className?: string;
}

const baseStyles =
  "inline-flex items-center justify-center font-medium transition-colors rounded-md disabled:opacity-50 disabled:cursor-not-allowed";

const buttonVariants = {
  primary: "bg-blue-600 text-white hover:bg-blue-500",
  secondary:
    "bg-surface-alt border border-overlay text-text hover:bg-active hover:border-overlay-hover",
  ghost: "text-subtext hover:text-text hover:bg-surface-alt",
  danger: "bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20",
  success: "bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20",
};

const buttonSizes = {
  sm: "px-3 py-1.5 text-sm h-[26px]",
  md: "px-4 py-2 text-sm h-[32px]",
  lg: "px-6 py-3 text-base h-[40px]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`${baseStyles} ${buttonVariants[variant]} ${buttonSizes[size]} ${className}`}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

const iconButtonSizes = {
  xss: { button: "w-[18px] h-[18px]", icon: "w-2.5 h-2.5" },
  xs: { button: "w-6 h-6", icon: "w-3 h-3" },
  sm: { button: "w-7 h-7", icon: "w-3.5 h-3.5" },
  lg: { button: "w-9 h-9", icon: "w-4 h-4" },
};

// Catppuccin Mocha style variants matching configr
// Pattern: icon and border same color, base has transparency, hover highlights
const iconButtonVariants = {
  default: {
    base: "text-[#a6adc8]/70 border-[#a6adc8]/30 bg-[#1e1e2e]",
    hover: "hover:bg-[#a6adc8]/10 hover:border-[#a6adc8]/50 hover:text-[#cdd6f4]",
    active: "bg-[#a6adc8]/20 text-[#cdd6f4] border-[#a6adc8]/50",
  },
  ghost: {
    base: "text-[#6c7086]/70 border-transparent bg-transparent",
    hover: "hover:bg-[#313244]/50 hover:text-[#a6adc8]",
    active: "bg-[#313244]/50 text-[#cdd6f4]",
  },
  primary: {
    base: "text-blue-400/70 border-blue-400/30 bg-[#1e1e2e]",
    hover: "hover:bg-blue-400/20 hover:border-blue-400/50 hover:text-blue-400",
    active: "bg-blue-400/20 text-blue-300 border-blue-400/50",
  },
  success: {
    base: "text-green-400/70 border-green-400/30 bg-[#1e1e2e]",
    hover: "hover:bg-green-400/20 hover:border-green-400/50 hover:text-green-400",
    active: "bg-green-400/20 text-green-300 border-green-400/50",
  },
  danger: {
    base: "text-red-400/70 border-red-400/30 bg-[#1e1e2e]",
    hover: "hover:bg-red-400/20 hover:border-red-400/50 hover:text-red-400",
    active: "bg-red-400/20 text-red-300 border-red-400/50",
  },
  white: {
    base: "text-white/70 border-white/30 bg-[#1e1e2e]",
    hover: "hover:bg-white/10 hover:border-white/50 hover:text-white",
    active: "bg-white/20 text-white border-white/50",
  },
  twiced: {
    base: "text-[#0F80D0]/70 border-[#0F80D0]/30 bg-[#1e1e2e]",
    hover: "hover:bg-[#0F80D0]/20 hover:border-[#0F80D0]/50 hover:text-[#0F80D0]",
    active: "bg-[#0F80D0]/20 text-[#0F80D0] border-[#0F80D0]/50",
  },
  toolr: {
    base: "text-[#60a5fa]/70 border-[#60a5fa]/30 bg-[#1e1e2e]",
    hover: "hover:bg-[#60a5fa]/20 hover:border-[#60a5fa]/50 hover:text-[#60a5fa]",
    active: "bg-[#60a5fa]/20 text-[#60a5fa] border-[#60a5fa]/50",
  },
};

export function IconButton({
  icon,
  onClick,
  size = "sm",
  variant = "default",
  active = false,
  disabled = false,
  tooltip,
  tooltipPosition = "bottom",
  tooltipAlign = "center",
  className = "",
}: IconButtonProps) {
  const variantStyle = iconButtonVariants[variant];
  const sizeConfig = iconButtonSizes[size];

  const button = (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        relative flex items-center justify-center rounded-md border transition-colors
        cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
        ${sizeConfig.button}
        ${active ? variantStyle.active : variantStyle.base}
        ${!disabled && !active ? variantStyle.hover : ""}
        ${className}
      `}
    >
      <span className={`flex items-center justify-center ${sizeConfig.icon}`}>{icon}</span>
    </button>
  );

  if (tooltip) {
    return (
      <Tooltip content={tooltip} position={tooltipPosition} align={tooltipAlign}>
        {button}
      </Tooltip>
    );
  }

  return button;
}
