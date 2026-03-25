'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Highlight, RecommendedPhrase } from '@/types/database';
import HighlightItem from '@/components/highlights/HighlightItem';
import AddHighlightModal from '@/components/highlights/AddHighlightModal';
import RecommendedPhraseCard from '@/components/highlights/RecommendedPhraseCard';

const TYPE_TABS = [
  { value: '', label: '全部' },
  { value: 'vocabulary', label: '词汇' },
  { value: 'phrase', label: '短语' },
  { value: 'sentence', label: '句子' },
  { value: 'recommended', label: '推荐' },
];

const ESSAY_TYPE_LABELS: Record<string, string> = {
  email: '邮件类',
  article: '文章类',
  general: '通用',
};

const PAGE_SIZE = 20;

interface DeleteConfirmProps {
  onConfirm: () => void;
  onCancel: () => void;
}

function DeleteConfirmToast({ onConfirm, onCancel }: DeleteConfirmProps) {
  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3 border border-neutral-100 w-[calc(100%-2rem)] max-w-sm">
      <span className="flex-1 text-sm text-neutral-800">确认删除此亮点？</span>
      <button
        onClick={onCancel}
        className="px-3 py-1.5 rounded-lg text-sm text-neutral-500 hover:bg-neutral-100 transition-colors"
      >
        取消
      </button>
      <button
        onClick={onConfirm}
        className="px-3 py-1.5 rounded-lg text-sm text-white bg-red-500 hover:bg-red-600 transition-colors"
      >
        确认
      </button>
    </div>
  );
}

interface ToastProps {
  message: string;
  onClose: () => void;
}

function Toast({ message, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 2000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-neutral-800 text-white px-4 py-2 rounded-full text-sm shadow-lg">
      {message}
    </div>
  );
}

export default function HighlightsPage() {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState('');
  const [activeType, setActiveType] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Recommended tab state
  const [recommendedPhrases, setRecommendedPhrases] = useState<Record<string, RecommendedPhrase[]>>({});
  const [recommendedLoading, setRecommendedLoading] = useState(false);
  const [collectedIds, setCollectedIds] = useState<Set<string>>(new Set());
  const [collectingIds, setCollectingIds] = useState<Set<string>>(new Set());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef(search);
  const typeRef = useRef(activeType);

  searchRef.current = search;
  typeRef.current = activeType;

  const fetchHighlights = useCallback(async (newPage: number, newSearch: string, newType: string, replace = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(newPage), limit: String(PAGE_SIZE) });
      if (newSearch) params.set('search', newSearch);
      if (newType) params.set('type', newType);
      const res = await fetch(`/api/highlights?${params}`);
      if (!res.ok) throw new Error('获取失败');
      const data = await res.json();
      const items: Highlight[] = data.highlights ?? [];
      const tot: number = data.total ?? 0;
      setTotal(tot);
      setHighlights((prev) => (replace ? items : [...prev, ...items]));
      setHasMore(newPage * PAGE_SIZE < tot);
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRecommendedPhrases = useCallback(async () => {
    setRecommendedLoading(true);
    try {
      const res = await fetch('/api/recommended-phrases');
      if (!res.ok) throw new Error('获取推荐句式失败');
      const data = await res.json();
      setRecommendedPhrases(data.phrases ?? {});

      // Check which phrases are already collected
      const highlightsRes = await fetch('/api/highlights?limit=1000');
      if (highlightsRes.ok) {
        const highlightsData = await highlightsRes.json();
        const collected = new Set<string>();
        (highlightsData.highlights as Highlight[]).forEach((h) => {
          if (h.recommended_phrase_id) {
            collected.add(h.recommended_phrase_id);
          }
        });
        setCollectedIds(collected);
      }
    } catch {
      // silently ignore
    } finally {
      setRecommendedLoading(false);
    }
  }, []);

  const handleCollect = useCallback(async (phraseId: string) => {
    if (collectedIds.has(phraseId) || collectingIds.has(phraseId)) return;

    setCollectingIds((prev) => new Set(prev).add(phraseId));
    try {
      const res = await fetch(`/api/recommended-phrases/${phraseId}/collect`, {
        method: 'POST',
      });
      if (res.ok) {
        setCollectedIds((prev) => new Set(prev).add(phraseId));
        setToastMessage('已加入亮点库');
      }
    } catch {
      // silently ignore
    } finally {
      setCollectingIds((prev) => {
        const next = new Set(prev);
        next.delete(phraseId);
        return next;
      });
    }
  }, [collectedIds, collectingIds]);

  // Initial load and when search/type changes
  useEffect(() => {
    setPage(1);
    setHighlights([]);
    setHasMore(true);
    fetchHighlights(1, search, activeType, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, activeType]);

  // Fetch recommended phrases when tab is selected
  useEffect(() => {
    if (activeType === 'recommended' && Object.keys(recommendedPhrases).length === 0) {
      fetchRecommendedPhrases();
    }
  }, [activeType, fetchRecommendedPhrases, recommendedPhrases]);

  // Infinite scroll observer
  useEffect(() => {
    if (activeType === 'recommended') return; // No infinite scroll for recommended tab

    const el = loaderRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchHighlights(nextPage, searchRef.current, typeRef.current, false);
        }
      },
      { rootMargin: '100px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, page, fetchHighlights, activeType]);

  function handleSearchChange(value: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(value);
    }, 500);
  }

  function handleDeleteRequest(id: string) {
    setDeleteTargetId(id);
  }

  async function handleDeleteConfirm() {
    if (!deleteTargetId) return;
    const id = deleteTargetId;
    setDeleteTargetId(null);
    // Optimistic update
    setHighlights((prev) => prev.filter((h) => h.id !== id));
    setTotal((t) => t - 1);
    try {
      await fetch(`/api/highlights/${id}`, { method: 'DELETE' });
    } catch {
      // If error, re-fetch
      fetchHighlights(1, searchRef.current, typeRef.current, true);
    }
  }

  async function handleAdd(text: string, type: string) {
    const res = await fetch('/api/highlights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, type }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error ?? '添加失败');
    }
    // Refresh from top
    setPage(1);
    setHighlights([]);
    setHasMore(true);
    fetchHighlights(1, searchRef.current, typeRef.current, true);
  }

  const isRecommendedTab = activeType === 'recommended';
  const recommendedGroups = Object.entries(recommendedPhrases).sort(([a], [b]) => {
    const order = ['email', 'article', 'general'];
    return order.indexOf(a) - order.indexOf(b);
  });
  const hasRecommendedData = recommendedGroups.length > 0;

  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-24">
      {/* Search - hide on recommended tab */}
      {!isRecommendedTab && (
        <div className="relative mb-3">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            placeholder="搜索亮点..."
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm focus:outline-none focus:border-primary-500"
          />
        </div>
      )}

      {/* Type filter tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {TYPE_TABS.map((tab) => (
          <button
            key={tab.value}
            data-testid={tab.value === 'recommended' ? 'recommended-tab' : undefined}
            onClick={() => setActiveType(tab.value)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeType === tab.value
                ? 'bg-primary-600 text-white'
                : 'bg-white text-neutral-500 border border-neutral-200 hover:border-primary-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Total count - hide on recommended tab */}
      {!isRecommendedTab && !loading && (
        <p className="text-xs text-neutral-400 mb-3">共 {total} 个亮点</p>
      )}

      {/* Recommended Tab Content */}
      {isRecommendedTab ? (
        <>
          {recommendedLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin" />
            </div>
          ) : hasRecommendedData ? (
            <div className="space-y-6">
              {recommendedGroups.map(([essayType, phrases]) => (
                <div key={essayType}>
                  <h3 className="text-sm font-semibold text-neutral-700 mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 bg-primary-500 rounded-full" />
                    {ESSAY_TYPE_LABELS[essayType] || essayType}
                    <span className="text-xs font-normal text-neutral-400">({phrases.length})</span>
                  </h3>
                  <div className="space-y-3">
                    {phrases.map((phrase) => (
                      <RecommendedPhraseCard
                        key={phrase.id}
                        phrase={phrase}
                        isCollected={collectedIds.has(phrase.id)}
                        isLoading={collectingIds.has(phrase.id)}
                        onCollect={handleCollect}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              data-testid="empty-recommended"
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="w-20 h-20 rounded-full bg-primary-50 flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
              </div>
              <p className="text-neutral-600 font-medium mb-1">暂无推荐句式</p>
              <p className="text-neutral-400 text-sm">推荐内容正在准备中</p>
            </div>
          )}
        </>
      ) : (
        <>
          {/* List */}
          {highlights.length > 0 ? (
            <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              {highlights.map((h) => (
                <HighlightItem key={h.id} highlight={h} onDelete={handleDeleteRequest} />
              ))}
            </div>
          ) : !loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 rounded-full bg-yellow-50 flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                </svg>
              </div>
              <p className="text-neutral-600 font-medium mb-1">还没有收集到亮点</p>
              <p className="text-neutral-400 text-sm">批改作文后亮点会自动加入</p>
            </div>
          ) : null}

          {/* Loading */}
          {loading && (
            <div className="flex justify-center py-6">
              <div className="w-5 h-5 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin" />
            </div>
          )}

          {/* Infinite scroll trigger */}
          <div ref={loaderRef} className="h-1" />
        </>
      )}

      {/* FAB - Add button - hide on recommended tab */}
      {!isRecommendedTab && (
        <button
          onClick={() => setShowModal(true)}
          className="fixed bottom-20 right-5 w-14 h-14 rounded-full bg-primary-600 text-white shadow-lg flex items-center justify-center hover:bg-primary-700 active:scale-95 transition-all z-30"
          aria-label="手动添加"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
      )}

      {/* Delete confirm toast */}
      {deleteTargetId && (
        <DeleteConfirmToast
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTargetId(null)}
        />
      )}

      {/* Toast message */}
      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}

      {/* Add modal */}
      {showModal && (
        <AddHighlightModal
          onClose={() => setShowModal(false)}
          onAdd={handleAdd}
        />
      )}
    </div>
  );
}
