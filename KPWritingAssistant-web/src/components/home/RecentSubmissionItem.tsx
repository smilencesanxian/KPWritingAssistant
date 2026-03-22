import Link from 'next/link';
import { SubmissionWithScore } from '@/lib/db/essays';

interface RecentSubmissionItemProps {
  submission: SubmissionWithScore;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' });
}

export default function RecentSubmissionItem({ submission }: RecentSubmissionItemProps) {
  return (
    <Link
      href={submission.correction_id ? `/corrections/${submission.correction_id}` : '#'}
      className="flex items-center justify-between py-3 px-1 border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50 transition-colors"
    >
      <div className="flex flex-col min-w-0">
        <span className="text-sm font-medium text-neutral-800 truncate">
          {submission.title || '无标题作文'}
        </span>
        <span className="text-xs text-neutral-400 mt-0.5">
          {formatDate(submission.created_at)}
        </span>
      </div>
      <svg
        className="w-4 h-4 text-neutral-300 flex-shrink-0 ml-2"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}
