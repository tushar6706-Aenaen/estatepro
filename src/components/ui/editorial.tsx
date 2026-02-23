import type {
  ButtonHTMLAttributes,
  ComponentPropsWithoutRef,
  HTMLAttributes,
} from "react";

import { cn } from "@/src/lib/utils";

type EditorialCardTone = "glass" | "soft" | "plain" | "dark";
type EditorialRadius = "lg" | "xl" | "2xl";
type EditorialPillTone = "default" | "soft" | "muted" | "dark";
type EditorialNoticeTone = "neutral" | "error" | "success" | "warning";
type EditorialButtonTone = "primary" | "secondary" | "ghost";
type EditorialButtonSize = "sm" | "md";

export const editorialPageRootClass =
  "min-h-screen overflow-x-clip bg-[var(--editorial-color-page-bg)] text-[var(--editorial-color-page-text)]";

export function EditorialBackdrop(
  props: {
    className?: string;
    radialClassName?: string;
    gridClassName?: string;
  } & HTMLAttributes<HTMLDivElement>,
) {
  const { className, radialClassName, gridClassName, ...rest } = props;

  return (
    <div className={cn("pointer-events-none absolute inset-0", className)} {...rest}>
      <div
        className={cn(
          "absolute inset-y-0 left-1/2 w-[100dvw] -translate-x-1/2 bg-[radial-gradient(circle_at_10%_12%,rgba(37,99,235,0.12),transparent_34%),radial-gradient(circle_at_90%_16%,rgba(234,88,12,0.12),transparent_44%)]",
          radialClassName,
        )}
      />
      <div
        className={cn(
          "absolute inset-y-0 left-1/2 w-[100dvw] -translate-x-1/2 opacity-[0.06] [background-image:linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] [background-size:28px_28px]",
          gridClassName,
        )}
      />
    </div>
  );
}

export function EditorialCard({
  tone = "glass",
  radius = "2xl",
  className,
  ...props
}: {
  tone?: EditorialCardTone;
  radius?: EditorialRadius;
} & HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "border",
        tone === "glass" &&
          "border-[color:var(--editorial-color-border-soft)] bg-[var(--editorial-color-card-glass)] shadow-[var(--editorial-shadow-card)] backdrop-blur-sm",
        tone === "soft" &&
          "border-[color:var(--editorial-color-border-soft)] bg-[var(--editorial-color-card-soft)]",
        tone === "plain" &&
          "border-[color:var(--editorial-color-border-soft)] bg-[var(--editorial-color-card-plain)]",
        tone === "dark" &&
          "border-[color:var(--editorial-color-border-strong)] bg-[var(--editorial-color-card-dark)] text-[var(--editorial-color-card-dark-text)] shadow-[var(--editorial-shadow-card-dark)]",
        radius === "lg" && "rounded-[var(--editorial-radius-lg)]",
        radius === "xl" && "rounded-[var(--editorial-radius-xl)]",
        radius === "2xl" && "rounded-[var(--editorial-radius-2xl)]",
        className,
      )}
      {...props}
    />
  );
}

export function EditorialPill({
  tone = "default",
  className,
  ...props
}: {
  tone?: EditorialPillTone;
} & ComponentPropsWithoutRef<"span">) {
  return (
    <span
      className={cn(
        "inline-flex min-w-0 max-w-full items-center rounded-full border px-3 py-1 text-xs font-semibold break-words",
        tone === "default" &&
          "border-[color:var(--editorial-color-border-soft)] bg-[var(--editorial-color-card-plain)] text-[var(--editorial-color-text-secondary)]",
        tone === "soft" &&
          "border-[color:var(--editorial-color-border-soft)] bg-[var(--editorial-color-pill-soft)] text-[var(--editorial-color-text-secondary)]",
        tone === "muted" &&
          "border-[color:var(--editorial-color-border-soft)] bg-[var(--editorial-color-card-soft)] text-[var(--editorial-color-text-muted)]",
        tone === "dark" &&
          "border-[color:var(--editorial-color-primary)] bg-[var(--editorial-color-primary)] text-[var(--editorial-color-primary-text)]",
        className,
      )}
      {...props}
    />
  );
}

export function editorialButtonClass(options?: {
  tone?: EditorialButtonTone;
  size?: EditorialButtonSize;
  className?: string;
}) {
  const tone = options?.tone ?? "secondary";
  const size = options?.size ?? "md";

  return cn(
    "inline-flex items-center justify-center rounded-full font-semibold transition disabled:cursor-not-allowed disabled:opacity-70",
    size === "sm" && "px-4 py-2 text-sm",
    size === "md" && "px-5 py-3 text-sm",
    tone === "primary" &&
      "bg-[var(--editorial-color-primary)] text-[var(--editorial-color-primary-text)] hover:bg-[var(--editorial-color-primary-hover)]",
    tone === "secondary" &&
      "border border-[color:var(--editorial-color-border-soft)] bg-[var(--editorial-color-card-plain)] text-[var(--editorial-color-text-secondary)] hover:border-[color:var(--editorial-color-border-hover)] hover:bg-[var(--editorial-color-pill-soft)] hover:text-[var(--editorial-color-page-text)]",
    tone === "ghost" &&
      "text-[var(--editorial-color-text-muted)] hover:text-[var(--editorial-color-page-text)]",
    options?.className,
  );
}

export function EditorialButton({
  tone = "secondary",
  size = "md",
  className,
  ...props
}: {
  tone?: EditorialButtonTone;
  size?: EditorialButtonSize;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={editorialButtonClass({ tone, size, className })}
      {...props}
    />
  );
}

export function EditorialNotice({
  tone = "neutral",
  className,
  role,
  "aria-live": ariaLive,
  "aria-atomic": ariaAtomic,
  ...props
}: {
  tone?: EditorialNoticeTone;
} & HTMLAttributes<HTMLDivElement>) {
  const computedRole = role ?? (tone === "error" ? "alert" : "status");
  const computedAriaLive = ariaLive ?? (tone === "error" ? "assertive" : "polite");
  const computedAriaAtomic = ariaAtomic ?? true;

  return (
    <div
      role={computedRole}
      aria-live={computedAriaLive}
      aria-atomic={computedAriaAtomic}
      className={cn(
        "rounded-2xl border px-4 py-3 text-sm break-words",
        tone === "neutral" &&
          "border-[color:var(--editorial-color-border-soft)] bg-[var(--editorial-color-card-soft)] text-[var(--editorial-color-text-secondary)]",
        tone === "error" &&
          "border-[color:var(--editorial-color-error-border)] bg-[var(--editorial-color-error-bg)] text-[var(--editorial-color-error-text)]",
        tone === "success" &&
          "border-[color:var(--editorial-color-success-border)] bg-[var(--editorial-color-success-bg)] text-[var(--editorial-color-success-text)]",
        tone === "warning" &&
          "border-[color:var(--editorial-color-warning-border)] bg-[var(--editorial-color-warning-bg)] text-[var(--editorial-color-warning-text)]",
        className,
      )}
      {...props}
    />
  );
}

export function EditorialFieldShell({
  tone = "default",
  className,
  ...props
}: {
  tone?: "default" | "readonly";
} & HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-2xl border px-4 py-3",
        tone === "default" &&
          "border-[color:var(--editorial-color-border-soft)] bg-[var(--editorial-color-card-soft)]",
        tone === "readonly" &&
          "border-[color:var(--editorial-color-border-soft)] bg-[var(--editorial-color-field-readonly)]",
        className,
      )}
      {...props}
    />
  );
}
