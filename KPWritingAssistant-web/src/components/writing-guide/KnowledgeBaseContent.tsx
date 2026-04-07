'use client';

import { useState, useEffect, useCallback } from 'react';
import { KnowledgeSection } from '@/lib/db/recommended-phrases';
import CategorySection from './CategorySection';
import AddKnowledgeModal from './AddKnowledgeModal';

interface Toast {
  message: string;
  type: 'success' | 'error';
}

const tabs = [
  { id: 'email', label: '邮件' },
  { id: 'article', label: '文章' },
  { id: 'story', label: '故事' },
] as const;

type TabType = typeof tabs[number]['id'];

export default function KnowledgeBaseContent() {
  const [activeTab, setActiveTab] = useState<TabType>('email');
  const [sections, setSections] = useState<KnowledgeSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCollecting, setIsCollecting] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  // Fetch data when tab changes
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/recommended-phrases?essayType=${activeTab}&grouped=true`);
      if (!res.ok) {
        if (res.status === 401) {
          setError('请先登录');
          return;
        }
        throw new Error('获取知识库失败');
      }
      const data = await res.json();
      setSections(data.sections || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取失败，请重试');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-hide toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Handle collect system phrase
  const handleCollect = async (id: string) => {
    setIsCollecting(id);
    try {
      const res = await fetch(`/api/recommended-phrases/${id}/collect`, {
        method: 'POST',
      });
      if (res.ok) {
        // Optimistic update
        setSections((prev) =>
          prev.map((section) => ({
            ...section,
            items: section.items.map((item) =>
              item.id === id ? { ...item, is_collected: true } : item
            ),
          }))
        );
        setToast({ message: '收藏成功', type: 'success' });
      } else {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || '收藏失败');
      }
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : '收藏失败，请重试',
        type: 'error',
      });
    } finally {
      setIsCollecting(null);
    }
  };

  // Handle delete user custom item
  const handleDelete = async (highlightId: string) => {
    setIsDeleting(highlightId);
    try {
      const res = await fetch(`/api/highlights/${highlightId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        // Remove from local state
        setSections((prev) =>
          prev
            .map((section) => ({
              ...section,
              items: section.items.filter((item) => item.highlight_id !== highlightId),
            }))
            .filter((section) => section.items.length > 0)
        );
        setToast({ message: '已删除', type: 'success' });
      } else {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || '删除失败');
      }
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : '删除失败，请重试',
        type: 'error',
      });
    } finally {
      setIsDeleting(null);
    }
  };

  // Handle add custom knowledge
  const handleSubmit = async (data: { text: string; type: string; essayType: string }) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/highlights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: data.text,
          type: data.type,
          knowledge_essay_type: data.essayType,
        }),
      });
      if (res.ok) {
        await res.json();
        setToast({ message: '添加成功', type: 'success' });
        setIsModalOpen(false);
        // Refresh data if added to current tab
        if (data.essayType === activeTab) {
          fetchData();
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || '添加失败');
      }
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : '添加失败，请重试',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [isRecommendModalOpen, setIsRecommendModalOpen] = useState(false);
  const [recommendCategory, setRecommendCategory] = useState<string>('');
  const [recommendItems, setRecommendItems] = useState<import('@/lib/db/recommended-phrases').KnowledgeItem[]>([]);
  const [isLoadingRecommend, setIsLoadingRecommend] = useState(false);

  // Filter sections by search query
  const filteredSections = searchQuery.trim()
    ? sections
        .map((section) => ({
          ...section,
          items: section.items.filter((item) =>
            item.text.toLowerCase().includes(searchQuery.toLowerCase())
          ),
        }))
        .filter((section) => section.items.length > 0)
    : sections;

  // Check if all sections are empty
  const isEmpty = filteredSections.length === 0 || filteredSections.every((s) => s.items.length === 0);

  return (
    <>
      {/* Search Bar */}
      <div className="relative mb-4">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜索知识库内容..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-300"
          data-testid="knowledge-search-input"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'
            }`}
            data-testid={`tab-${tab.id}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg border border-neutral-200 p-4">
              <div className="h-6 bg-neutral-100 rounded w-1/4 mb-3 animate-pulse" />
              <div className="space-y-2">
                <div className="h-10 bg-neutral-50 rounded animate-pulse" />
                <div className="h-10 bg-neutral-50 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
          </div>
          <p className="text-neutral-600 font-medium mb-1">{error}</p>
          <button
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 transition-colors"
          >
            重试
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && isEmpty && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 rounded-full bg-primary-50 flex items-center justify-center mb-4">
            <svg className="w-10 h-10 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
              />
            </svg>
          </div>
          <p className="text-neutral-600 font-medium mb-1">
            {searchQuery ? `未找到包含"${searchQuery}"的内容` : '暂无知识条目'}
          </p>
          <p className="text-neutral-400 text-sm mb-6">
            {searchQuery ? '尝试其他关键词' : '点击下方按钮添加你的第一条知识'}
          </p>
        </div>
      )}

      {/* Content */}
      {!loading && !error && !isEmpty && (
        <div className="space-y-4">
          {filteredSections.map((section) => (
            <CategorySection
              key={section.category}
              section={section}
              onCollect={handleCollect}
              onDelete={handleDelete}
              isCollecting={isCollecting}
              isDeleting={isDeleting}
            />
          ))}
        </div>
      )}

      {/* FAB Buttons */}
      <div className="fixed right-4 bottom-24 flex flex-col gap-3 z-40">
        {/* Recommend Button */}
        <button
          onClick={() => setIsRecommendModalOpen(true)}
          className="w-14 h-14 bg-amber-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-amber-600 active:scale-95 transition-all"
          data-testid="recommend-knowledge-fab"
          aria-label="推荐素材"
          title="推荐素材"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </button>
        {/* Add Button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-14 h-14 bg-primary-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary-700 active:scale-95 transition-all"
          data-testid="add-knowledge-fab"
          aria-label="添加知识"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Recommend Modal */}
      {isRecommendModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center" onClick={() => setIsRecommendModalOpen(false)}>
          <div
            className="bg-white rounded-t-2xl w-full max-w-lg p-6 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-neutral-800 mb-4">推荐素材</h3>
            {/* Category selector */}
            <div className="mb-4">
              <label className="text-xs text-neutral-500 mb-1.5 block">选择素材类型（可选）</label>
              <select
                value={recommendCategory}
                onChange={(e) => setRecommendCategory(e.target.value)}
                className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary-300"
              >
                <option value="">不限类型</option>
                <option value="opening">开篇引入</option>
                <option value="opinion">观点表达</option>
                <option value="connector">逻辑连接</option>
                <option value="detail">细节描述</option>
                <option value="closing">结尾升华</option>
                <option value="complex_sentence">高级句式</option>
              </select>
            </div>
            <button
              onClick={async () => {
                setIsLoadingRecommend(true);
                setRecommendItems([]);
                try {
                  const res = await fetch(
                    `/api/knowledge-base/recommend?essayType=${activeTab}${recommendCategory ? `&category=${recommendCategory}` : ''}`
                  );
                  const data = await res.json();
                  setRecommendItems(data.items ?? []);
                } catch {
                  setRecommendItems([]);
                } finally {
                  setIsLoadingRecommend(false);
                }
              }}
              disabled={isLoadingRecommend}
              className="w-full py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 disabled:opacity-50 transition-colors mb-4"
            >
              {isLoadingRecommend ? '推荐中...' : '为我推荐 2 条'}
            </button>
            {/* Recommended items */}
            {recommendItems.length > 0 && (
              <div className="space-y-3">
                {recommendItems.map((item) => (
                  <div key={item.id} className="border border-neutral-200 rounded-xl p-3">
                    <p className="text-sm text-neutral-800 mb-2">{item.text}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-neutral-400">
                        {item.category ? `${item.category}` : '通用'}
                      </span>
                      <button
                        onClick={async () => {
                          await handleCollect(item.id);
                          setRecommendItems((prev) => prev.filter((i) => i.id !== item.id));
                        }}
                        className="px-3 py-1 bg-primary-600 text-white text-xs rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        采纳
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!isLoadingRecommend && recommendItems.length === 0 && (
              <p className="text-center text-sm text-neutral-400 py-2">点击上方按钮获取推荐</p>
            )}
          </div>
        </div>
      )}

      {/* Add Knowledge Modal */}
      <AddKnowledgeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        defaultEssayType={activeTab}
        isSubmitting={isSubmitting}
      />

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full text-sm shadow-lg ${
            toast.type === 'success' ? 'bg-neutral-800 text-white' : 'bg-red-500 text-white'
          }`}
        >
          {toast.message}
        </div>
      )}
    </>
  );
}
