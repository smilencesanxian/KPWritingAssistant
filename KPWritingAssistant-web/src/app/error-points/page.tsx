'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ErrorPoint } from '@/types/database';
import ErrorPointCard from '@/components/error/ErrorPointCard';

const FILTER_TABS = [
  { value: '', label: '全部' },
  { value: 'true', label: '易错点' },
];

export default function ErrorPointsPage() {
  const router = useRouter();
  const [errorPoints, setErrorPoints] = useState<ErrorPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('');

  const fetchErrorPoints = useCallback(async (flaggedOnly: string) => {
    setLoading(true);
    try {
      const url = flaggedOnly === 'true'
        ? '/api/error-points?flagged_only=true'
        : '/api/error-points';
      const res = await fetch(url);
      if (!res.ok) throw new Error('获取失败');
      const data = await res.json();
      setErrorPoints(data.error_points ?? []);
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchErrorPoints(activeFilter);
  }, [activeFilter, fetchErrorPoints]);

  function handleCardClick(id: string) {
    router.push(`/error-points/${id}`);
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-24">
      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveFilter(tab.value)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeFilter === tab.value
                ? 'bg-primary-600 text-white'
                : 'bg-white text-neutral-500 border border-neutral-200 hover:border-primary-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-5 h-5 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin" />
        </div>
      )}

      {/* List */}
      {!loading && errorPoints.length > 0 && (
        <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          {errorPoints.map((ep) => (
            <ErrorPointCard key={ep.id} errorPoint={ep} onClick={handleCardClick} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && errorPoints.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-full bg-yellow-50 flex items-center justify-center mb-4">
            <svg className="w-10 h-10 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.395 4.972m0 0a6.726 6.726 0 0 1-2.749 1.35m0 0a6.772 6.772 0 0 1-3.044 0" />
            </svg>
          </div>
          <p className="text-neutral-700 font-medium mb-1">棒极了！暂无错误记录</p>
          <p className="text-neutral-400 text-sm">继续保持</p>
        </div>
      )}
    </div>
  );
}
