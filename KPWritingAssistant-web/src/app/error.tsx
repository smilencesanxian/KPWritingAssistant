'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="text-5xl mb-4">⚠️</div>
      <h2 className="text-xl font-semibold text-neutral-800 mb-2">出了点问题</h2>
      <p className="text-sm text-neutral-500 mb-6 max-w-xs">
        {error.message || '页面加载失败，请重试'}
      </p>
      <button
        onClick={reset}
        className="px-5 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
      >
        重试
      </button>
    </div>
  );
}
