import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "subtle";
}

const badgeStyles: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: "bg-slate-100 text-slate-800",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  subtle: "bg-slate-100 text-slate-600"
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]",
        badgeStyles[variant],
        className
      )}
      {...props}
    />
  );
}
