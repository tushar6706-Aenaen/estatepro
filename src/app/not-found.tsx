import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-6">
          <h1 className="text-9xl font-bold text-gray-900">404</h1>
          <div className="mt-2 h-1 w-32 mx-auto bg-gray-900 rounded-full"></div>
        </div>

        <h2 className="mb-3 text-2xl font-semibold text-gray-900">
          Page not found
        </h2>

        <p className="mb-8 text-gray-600">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <Link
          href="/"
          className="inline-block rounded-xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
