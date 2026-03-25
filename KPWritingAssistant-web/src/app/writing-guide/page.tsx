'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import WritingGuideTree from '@/components/writing-guide/WritingGuideTree';
import { WritingGuideNodeTree } from '@/lib/db/writing-guide';
import Skeleton from '@/components/ui/Skeleton';

// Skeleton loader for the tree
function TreeSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
      {/* Level 0 skeleton */}
      <div className="flex items-center gap-2 py-3 px-3 border-b border-neutral-100">
        <Skeleton width="16px" height="16px" rounded />
        <Skeleton width="20px" height="20px" rounded className="text-neutral-300" />
        <Skeleton width="120px" height="18px" rounded />
      </div>
      {/* Level 1 skeleton */}
      <div className="flex items-center gap-2 py-3 pl-8 pr-3 border-b border-neutral-100">
        <Skeleton width="16px" height="16px" rounded />
        <Skeleton width="16px" height="16px" rounded className="text-neutral-300" />
        <Skeleton width="100px" height="16px" rounded />
      </div>
      {/* Level 2 skeleton */}
      <div className="flex items-center gap-2 py-3 pl-14 pr-3 border-b border-neutral-100">
        <Skeleton width="16px" height="16px" rounded className="invisible" />
        <Skeleton width="16px" height="16px" rounded className="text-neutral-300" />
        <Skeleton width="180px" height="14px" rounded />
        <Skeleton width="50px" height="20px" rounded="rounded-full" className="ml-auto" />
      </div>
      {/* More level 2 skeletons */}
      <div className="flex items-center gap-2 py-3 pl-14 pr-3 border-b border-neutral-100">
        <Skeleton width="16px" height="16px" rounded className="invisible" />
        <Skeleton width="16px" height="16px" rounded className="text-neutral-300" />
        <Skeleton width="150px" height="14px" rounded />
        <Skeleton width="50px" height="20px" rounded="rounded-full" className="ml-auto" />
      </div>
      {/* Another level 1 */}
      <div className="flex items-center gap-2 py-3 pl-8 pr-3 border-b border-neutral-100">
        <Skeleton width="16px" height="16px" rounded />
        <Skeleton width="16px" height="16px" rounded className="text-neutral-300" />
        <Skeleton width="90px" height="16px" rounded />
      </div>
      {/* Another level 0 */}
      <div className="flex items-center gap-2 py-3 px-3 border-b border-neutral-100">
        <Skeleton width="16px" height="16px" rounded />
        <Skeleton width="20px" height="20px" rounded className="text-neutral-300" />
        <Skeleton width="110px" height="18px" rounded />
      </div>
    </div>
  );
}

// Toast component
interface ToastProps {
  message: string;
  type?: 'success' | 'error';
  onClose: () => void;
}

function Toast({ message, type = 'success', onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 2000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full text-sm shadow-lg ${
      type === 'success' ? 'bg-neutral-800 text-white' : 'bg-red-500 text-white'
    }`}>
      {message}
    </div>
  );
}

export default function WritingGuidePage() {
  const [treeData, setTreeData] = useState<WritingGuideNodeTree[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchTree = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/writing-guide');
      if (!res.ok) {
        if (res.status === 401) {
          setError('请先登录');
          return;
        }
        throw new Error('获取写作导览失败');
      }
      const data = await res.json();
      setTreeData(data.tree ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取失败，请重试');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

  const handleDeleteNode = useCallback(async (nodeId: string) => {
    setDeletingId(nodeId);
    try {
      const res = await fetch(`/api/writing-guide/${nodeId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        // Remove the node from local state
        const removeNode = (nodes: WritingGuideNodeTree[]): WritingGuideNodeTree[] => {
          return nodes.filter(node => {
            if (node.id === nodeId) return false;
            if (node.children) {
              node.children = removeNode(node.children);
            }
            return true;
          });
        };
        setTreeData(prev => removeNode(prev));
        setToast({ message: '已从导览中移除', type: 'success' });
      } else {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || '删除失败');
      }
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : '删除失败，请重试',
        type: 'error'
      });
    } finally {
      setDeletingId(null);
    }
  }, []);

  // Check if tree is effectively empty (no children or only system nodes without highlights)
  const isEmpty = treeData.length === 0 || (
    treeData.every(node =>
      node.node_type === 'essay_type' &&
      (!node.children || node.children.length === 0)
    )
  );

  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-24">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-neutral-900">写作导览</h1>
        <p className="text-sm text-neutral-500 mt-1">
          按作文类型整理的亮点词句库
        </p>
      </div>

      {/* Loading State */}
      {loading && <TreeSkeleton />}

      {/* Error State */}
      {!loading && error && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          </div>
          <p className="text-neutral-600 font-medium mb-1">{error}</p>
          <button
            onClick={fetchTree}
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
            </svg>
          </div>
          <p className="text-neutral-600 font-medium mb-1">还没有积累的亮点词句</p>
          <p className="text-neutral-400 text-sm mb-6">
            批改一篇作文，积累你的亮点词句
          </p>
          <Link
            href="/"
            className="px-6 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 active:scale-95 transition-all"
          >
            去批改作文
          </Link>
        </div>
      )}

      {/* Tree Content */}
      {!loading && !error && !isEmpty && (
        <WritingGuideTree
          nodes={treeData}
          onDeleteNode={handleDeleteNode}
          isDeleting={deletingId}
        />
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
