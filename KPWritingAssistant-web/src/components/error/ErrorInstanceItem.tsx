import { ErrorInstance } from '@/types/database';

interface ErrorInstanceItemProps {
  instance: ErrorInstance;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}月${day}日`;
}

export default function ErrorInstanceItem({ instance }: ErrorInstanceItemProps) {
  return (
    <div className="py-3 border-b border-neutral-100 last:border-b-0">
      {instance.original_sentence && (
        <p className="text-sm text-red-600 leading-relaxed mb-1">
          <span className="text-red-400 text-xs mr-1">✗</span>
          {instance.original_sentence}
        </p>
      )}
      {instance.corrected_sentence && (
        <p className="text-sm text-green-700 leading-relaxed mb-1">
          <span className="text-green-500 text-xs mr-1">✓</span>
          {instance.corrected_sentence}
        </p>
      )}
      {instance.explanation && (
        <p className="text-xs text-neutral-500 mt-1 leading-relaxed">{instance.explanation}</p>
      )}
      <p className="text-xs text-neutral-300 mt-1.5">{formatDate(instance.created_at)}</p>
    </div>
  );
}
