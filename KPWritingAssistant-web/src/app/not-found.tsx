import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="text-6xl font-bold text-neutral-200 mb-2">404</div>
      <h2 className="text-xl font-semibold text-neutral-800 mb-2">页面不存在</h2>
      <p className="text-sm text-neutral-500 mb-6">您访问的页面不存在或已被移除</p>
      <Link
        href="/"
        className="px-5 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
      >
        返回首页
      </Link>
    </div>
  );
}
