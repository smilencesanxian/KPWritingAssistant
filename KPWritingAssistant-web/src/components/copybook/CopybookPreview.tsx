'use client';

interface CopybookPreviewProps {
  pdfUrl: string | null;
}

export default function CopybookPreview({ pdfUrl }: CopybookPreviewProps) {
  if (!pdfUrl) {
    return (
      <div className="flex items-center justify-center h-40 bg-neutral-100 rounded-xl text-neutral-400 text-sm">
        PDF 暂未生成
      </div>
    );
  }

  return (
    <>
      {/* Desktop: iframe embed */}
      <div className="hidden sm:block w-full rounded-xl overflow-hidden border border-neutral-200">
        <iframe
          src={pdfUrl}
          className="w-full"
          style={{ height: '600px' }}
          title="字帖预览"
        />
      </div>

      {/* Mobile: link fallback */}
      <div className="sm:hidden bg-neutral-50 border border-neutral-200 rounded-xl p-6 text-center">
        <svg
          className="w-10 h-10 text-neutral-300 mx-auto mb-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <a
          href={pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary-600 font-medium text-sm underline"
        >
          点击查看 PDF
        </a>
      </div>
    </>
  );
}
