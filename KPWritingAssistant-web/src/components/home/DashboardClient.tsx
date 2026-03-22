'use client';

import Link from 'next/link';
import useSWR from 'swr';
import StatCard from './StatCard';
import RecentSubmissionItem from './RecentSubmissionItem';
import Card from '@/components/ui/Card';
import { SubmissionWithScore } from '@/lib/db/essays';

interface StatsData {
  corrections_count: number;
  highlights_count: number;
  error_points_count: number;
  flagged_error_count: number;
  recent_submissions: SubmissionWithScore[];
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function DashboardClient() {
  const { data, isLoading } = useSWR<StatsData>('/api/stats', fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 30_000,
  });

  const stats = {
    corrections_count: data?.corrections_count ?? 0,
    highlights_count: data?.highlights_count ?? 0,
    error_points_count: data?.error_points_count ?? 0,
  };
  const recentSubmissions = data?.recent_submissions ?? [];

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
      {/* Stats */}
      <div className="flex gap-3">
        {isLoading ? (
          <>
            <div className="flex-1 h-24 rounded-xl bg-neutral-100 animate-pulse" />
            <div className="flex-1 h-24 rounded-xl bg-neutral-100 animate-pulse" />
            <div className="flex-1 h-24 rounded-xl bg-neutral-100 animate-pulse" />
          </>
        ) : (
          <>
            <StatCard label="已批改" value={stats.corrections_count} unit="篇" />
            <StatCard label="亮点" value={stats.highlights_count} unit="个" />
            <StatCard label="易错点" value={stats.error_points_count} unit="个" />
          </>
        )}
      </div>

      {/* Core action button */}
      <div className="flex flex-col items-center py-4">
        <Link
          href="/upload"
          className="w-28 h-28 rounded-full bg-primary-600 flex flex-col items-center justify-center shadow-lg hover:bg-primary-700 active:scale-95 transition-all"
        >
          <svg
            className="w-10 h-10 text-white mb-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span className="text-white text-sm font-medium">拍照批改</span>
        </Link>
      </div>

      {/* Recent submissions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-neutral-800">最近批改</h2>
          {recentSubmissions.length > 0 && (
            <Link href="/history" className="text-sm text-primary-600 hover:underline">
              查看全部历史记录
            </Link>
          )}
        </div>

        {isLoading ? (
          <Card className="py-3 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 rounded bg-neutral-100 animate-pulse" />
            ))}
          </Card>
        ) : recentSubmissions.length === 0 ? (
          <Card className="flex flex-col items-center py-10 text-center">
            <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center mb-3">
              <svg
                className="w-7 h-7 text-neutral-400"
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
            </div>
            <p className="text-neutral-500 text-sm mb-3">还没有批改记录</p>
            <Link
              href="/upload"
              className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors"
            >
              去批改第一篇
            </Link>
          </Card>
        ) : (
          <Card className="py-0 px-3">
            {recentSubmissions.map((sub) => (
              <RecentSubmissionItem key={sub.id} submission={sub} />
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}
