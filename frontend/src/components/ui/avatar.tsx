import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn } from "@/lib/utils";

export interface AvatarProps extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> {
  name: string;
}

export function Avatar({ className, name, ...props }: AvatarProps) {
  return (
    <AvatarPrimitive.Root className={cn("relative flex h-12 w-12 shrink-0 overflow-hidden rounded-full bg-slate-100", className)} {...props}>
      <AvatarPrimitive.Image className="h-full w-full object-cover" alt={name} src="" />
      <AvatarPrimitive.Fallback className="flex h-full w-full items-center justify-center bg-slate-200 text-sm font-semibold text-slate-700" delayMs={600}>
        {name
          .split(" ")
          .map(word => word[0])
          .slice(0, 2)
          .join("")}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}
