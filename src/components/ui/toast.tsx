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
  info: "border-blue-300 bg-blue-50 text-blue-900",
  success: "border-emerald-300 bg-emerald-50 text-emerald-900",
  error: "border-rose-300 bg-rose-50 text-rose-900",
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
        className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-600 hover:text-gray-900"
        aria-label="Dismiss notification"
      >
        Close
      </button>
    </div>
  );
}
