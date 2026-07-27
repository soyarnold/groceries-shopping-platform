import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type ContainerProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  width?: "default" | "narrow" | "wide";
};

const widthClass = {
  default: "max-w-[var(--container-max)]",
  narrow: "max-w-2xl",
  wide: "max-w-7xl",
} as const;

export function Container({
  children,
  className,
  width = "default",
  ...props
}: ContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 sm:px-6",
        widthClass[width],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
