export const runtime = 'experimental-edge';
export const dynamic = 'force-dynamic';

function Error({ statusCode }) {
  return (
    <div className="min-h-screen bg-purple-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-red-600 mb-4">
          {statusCode ? `${statusCode} - ` : ''}出错了
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
          抱歉，发生了意外错误。
        </p>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center justify-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
        >
          重试
        </button>
      </div>
    </div>
  );
}

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;
