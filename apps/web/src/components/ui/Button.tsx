import { type ButtonHTMLAttributes, type Ref } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "accent" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  ref?: Ref<HTMLButtonElement>;
}

const baseStyles =
  "inline-flex items-center justify-center font-medium transition-colors rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

const buttonVariants = {
  primary: "bg-primary text-primary-foreground hover:bg-blue-400",
  secondary:
    "bg-surface-alt border border-overlay text-text hover:bg-active hover:border-overlay-hover",
  ghost: "text-subtext border border-transparent hover:text-text hover:border-overlay hover:bg-surface-alt",
  accent: "bg-cyan-600 text-white border border-cyan-500 hover:bg-cyan-500",
  danger: "bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20",
  success: "bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20",
};

const buttonSizes = {
  sm: "px-3 py-1.5 text-sm h-[26px]",
  md: "px-4 py-2 text-sm h-[32px]",
  lg: "px-4 py-2 text-base h-[40px]",
};

export function Button({ className = "", variant = "primary", size = "md", ref, ...props }: ButtonProps) {
  return (
    <button
      ref={ref}
      className={`${baseStyles} ${buttonVariants[variant]} ${buttonSizes[size]} ${className}`}
      {...props}
    />
  );
}
