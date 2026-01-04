// Error boundary component - must be client component for error handling
"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen bg-purple-50 dark:bg-gray-900 flex items-center justify-center p-4">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-4xl font-bold text-red-600 mb-4">
              出错了
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              抱歉，发生了意外错误。
            </p>
            <button
              onClick={reset}
              className="inline-flex items-center justify-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
            >
              重试
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
