import type { HTMLAttributes, ReactNode, ComponentType } from "react";

type BadgeColor =
  | "gray"
  | "green"
  | "red"
  | "blue"
  | "yellow"
  | "orange"
  | "purple"
  | "pink"
  | "cyan"
  | "emerald"
  | "amber"
  | "teal"
  | "indigo"
  | "slate"
  | "violet"
  | "sky";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  color?: BadgeColor;
  size?: "sm" | "md";
  icon?: ComponentType<{ className?: string }>;
}

const colorClasses: Record<BadgeColor, string> = {
  gray: "border-gray-500/60 text-gray-300",
  green: "border-green-500/60 text-green-400",
  red: "border-red-500/60 text-red-300",
  blue: "border-blue-500/60 text-blue-300",
  yellow: "border-yellow-500/60 text-yellow-300",
  orange: "border-orange-500/60 text-orange-300",
  purple: "border-purple-500/60 text-purple-300",
  pink: "border-pink-500/60 text-pink-300",
  cyan: "border-cyan-500/60 text-cyan-300",
  emerald: "border-emerald-500/60 text-emerald-300",
  amber: "border-amber-500/60 text-amber-400",
  teal: "border-teal-500/60 text-teal-300",
  indigo: "border-indigo-500/60 text-indigo-300",
  slate: "border-slate-500/60 text-slate-300",
  violet: "border-violet-500/60 text-violet-300",
  sky: "border-sky-500/60 text-sky-300",
};

const sizeClasses = {
  sm: "h-[20px] px-1.5 pb-px text-[11px] gap-0.5",
  md: "h-[22px] px-2 text-xs gap-1",
};

const iconSizeClasses = {
  sm: "w-3 h-3",
  md: "w-3 h-3",
};

export function Badge({
  children,
  className = "",
  color = "gray",
  size = "sm",
  icon: Icon,
  ...props
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded font-medium leading-none border ${colorClasses[color]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {Icon && <Icon className={iconSizeClasses[size]} />}
      {children}
    </span>
  );
}
