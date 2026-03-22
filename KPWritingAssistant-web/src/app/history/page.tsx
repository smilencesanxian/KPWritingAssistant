'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { SubmissionWithScore } from '@/lib/db/essays';
import HistoryItem from '@/components/history/HistoryItem';
import Spinner from '@/components/ui/Spinner';

const PAGE_SIZE = 10;

export default function HistoryPage() {
  const [items, setItems] = useState<SubmissionWithScore[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loaderRef = useRef<HTMLDivElement | null>(null);
  const pageRef = useRef(page);
  const hasMoreRef = useRef(hasMore);
  const loadingRef = useRef(loading);
  pageRef.current = page;
  hasMoreRef.current = hasMore;
  loadingRef.current = loading;

  // Pull-to-refresh state
  const touchStartY = useRef(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const fetchItems = useCallback(async (newPage: number, replace = false) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/essays?page=${newPage}&limit=${PAGE_SIZE}`);
      if (!res.ok) throw new Error('获取失败');
      const data = await res.json();
      const essays: SubmissionWithScore[] = data.essays ?? [];
      const tot: number = data.total ?? 0;
      setTotal(tot);
      setItems((prev) => (replace ? essays : [...prev, ...essays]));
      setHasMore(newPage * PAGE_SIZE < tot);
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchItems(1, true);
  }, [fetchItems]);

  // Infinite scroll observer
  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreRef.current && !loadingRef.current) {
          const nextPage = pageRef.current + 1;
          setPage(nextPage);
          fetchItems(nextPage, false);
        }
      },
      { rootMargin: '120px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [fetchItems]);

  // Pull-to-refresh handlers
  function handleTouchStart(e: React.TouchEvent) {
    touchStartY.current = e.touches[0].clientY;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    const diff = e.changedTouches[0].clientY - touchStartY.current;
    const scrollTop = containerRef.current?.scrollTop ?? 0;
    if (diff > 60 && scrollTop <= 0 && !loading) {
      setRefreshing(true);
      setPage(1);
      setItems([]);
      setHasMore(true);
      fetchItems(1, true);
    }
  }

  return (
    <div
      ref={containerRef}
      className="max-w-lg mx-auto px-4 py-4 pb-24"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      {refreshing && (
        <div className="flex justify-center py-3">
          <Spinner size="sm" className="text-primary-500" />
        </div>
      )}

      {/* Header */}
      <h1 className="text-lg font-semibold text-neutral-800 mb-4">批改历史</h1>

      {/* List */}
      {items.length > 0 ? (
        <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          {items.map((item) => (
            <HistoryItem
              key={item.id}
              item={item}
              onDelete={async (id) => {
                setItems((prev) => prev.filter((i) => i.id !== id));
                setTotal((t) => t - 1);
                try {
                  await fetch(`/api/essays/${id}`, { method: 'DELETE' });
                } catch {
                  fetchItems(1, true);
                }
              }}
            />
          ))}
        </div>
      ) : !loading ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
            <svg className="w-10 h-10 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
              />
            </svg>
          </div>
          <p className="text-neutral-600 font-medium mb-1">暂无批改历史</p>
          <p className="text-neutral-400 text-sm mb-5">上传作文后即可查看批改结果</p>
          <Link
            href="/upload"
            className="px-6 py-2.5 rounded-full bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors active:scale-95"
          >
            去批改第一篇
          </Link>
        </div>
      ) : null}

      {/* Loading spinner */}
      {loading && items.length > 0 && (
        <div className="flex justify-center py-5">
          <Spinner size="sm" className="text-primary-500" />
        </div>
      )}

      {/* Initial loading */}
      {loading && items.length === 0 && (
        <div className="flex justify-center py-20">
          <Spinner size="md" className="text-primary-500" />
        </div>
      )}

      {/* All loaded */}
      {!hasMore && items.length > 0 && !loading && (
        <p className="text-center text-xs text-neutral-400 py-4">
          已加载全部 {total} 条记录
        </p>
      )}

      {/* Infinite scroll trigger */}
      <div ref={loaderRef} className="h-1" />
    </div>
  );
}
