import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Page not found</h1>
        <p className="text-gray-600 mb-6">
          We couldn&apos;t find what you&apos;re looking for. If you&apos;re
          trying to view results, double-check your code.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
