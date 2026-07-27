import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3";
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  className,
  as: Tag = "h2",
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="max-w-2xl">
        {eyebrow ? (
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {eyebrow}
          </p>
        ) : null}
        <Tag
          className={cn(
            "font-[family-name:var(--font-display)] font-semibold tracking-tight text-foreground text-balance",
            Tag === "h1" && "text-4xl sm:text-5xl",
            Tag === "h2" && "text-2xl sm:text-3xl",
            Tag === "h3" && "text-xl",
          )}
        >
          {title}
        </Tag>
        {description ? (
          <div className="mt-2 text-base text-muted-foreground sm:text-lg">
            {description}
          </div>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
