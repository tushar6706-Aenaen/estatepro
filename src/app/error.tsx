"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service in production
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-6 flex items-center justify-center">
          <div className="rounded-full bg-red-100 p-3">
            <svg
              className="h-8 w-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        <h2 className="mb-2 text-center text-2xl font-semibold text-gray-900">
          Something went wrong
        </h2>

        <p className="mb-6 text-center text-sm text-gray-600">
          We apologize for the inconvenience. Please try again.
        </p>

        {process.env.NODE_ENV === "development" && (
          <details className="mb-6 rounded-lg bg-gray-50 p-4">
            <summary className="cursor-pointer text-sm font-medium text-gray-700">
              Error details
            </summary>
            <p className="mt-2 text-xs text-gray-600">{error.message}</p>
          </details>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => reset()}
            className="flex-1 rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            Try again
          </button>
          <button
            onClick={() => (window.location.href = "/")}
            className="flex-1 rounded-xl border-2 border-gray-300 px-4 py-3 text-sm font-semibold text-gray-900 transition hover:border-gray-400"
          >
            Go home
          </button>
        </div>
      </div>
    </div>
  );
}
