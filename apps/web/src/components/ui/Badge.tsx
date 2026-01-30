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
  gray: "bg-gray-500/20 text-gray-300",
  green: "bg-green-500/20 text-green-300",
  red: "bg-red-500/20 text-red-300",
  blue: "bg-blue-500/20 text-blue-300",
  yellow: "bg-yellow-500/20 text-yellow-300",
  orange: "bg-orange-500/20 text-orange-300",
  purple: "bg-purple-500/20 text-purple-300",
  pink: "bg-pink-500/20 text-pink-300",
  cyan: "bg-cyan-500/20 text-cyan-300",
  emerald: "bg-emerald-500/20 text-emerald-300",
  amber: "bg-amber-500/20 text-amber-300",
  teal: "bg-teal-500/20 text-teal-300",
  indigo: "bg-indigo-500/20 text-indigo-300",
  slate: "bg-slate-500/20 text-slate-300",
  violet: "bg-violet-500/20 text-violet-300",
  sky: "bg-sky-500/20 text-sky-300",
};

const sizeClasses = {
  sm: "h-[18px] px-1.5",
  md: "h-[20px] px-2",
};

const iconSizeClasses = {
  sm: "w-2.5 h-2.5",
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
      className={`inline-flex items-center gap-1 rounded text-xs font-bold leading-none ${colorClasses[color]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {Icon && <Icon className={iconSizeClasses[size]} />}
      {children}
    </span>
  );
}
