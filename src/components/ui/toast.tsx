"use client";

import { useEffect } from "react";

export type ToastVariant = "info" | "success" | "error";

type ToastProps = {
  message: string;
  variant?: ToastVariant;
  duration?: number;
  onClose: () => void;
};

const variantStyles: Record<ToastVariant, string> = {
  info: "border-white/10 bg-neutral-900/90 text-neutral-200",
  success: "border-emerald-300/30 bg-emerald-500/15 text-emerald-100",
  error: "border-rose-300/40 bg-rose-500/15 text-rose-100",
};

export function Toast({
  message,
  variant = "info",
  duration = 4200,
  onClose,
}: ToastProps) {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      onClose();
    }, duration);

    return () => {
      window.clearTimeout(timer);
    };
  }, [duration, onClose]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex max-w-sm items-start justify-between gap-4 rounded-xl border px-4 py-3 text-sm shadow-[0_18px_50px_-30px_rgba(0,0,0,0.8)] ${variantStyles[variant]}`}
    >
      <span>{message}</span>
      <button
        type="button"
        onClick={onClose}
        className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70 hover:text-white"
        aria-label="Dismiss notification"
      >
        Close
      </button>
    </div>
  );
}
