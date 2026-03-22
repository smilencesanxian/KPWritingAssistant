'use client';

import { useEffect } from 'react';

export default function CorrectionError({
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
      <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
        <svg
          className="w-8 h-8 text-red-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
          />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-neutral-800 mb-2">批改数据加载失败</h2>
      <p className="text-sm text-neutral-500 mb-6 max-w-xs">
        无法加载批改结果，请检查网络连接后重试
      </p>
      <button
        onClick={reset}
        className="px-5 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors active:scale-95"
      >
        重试
      </button>
    </div>
  );
}
