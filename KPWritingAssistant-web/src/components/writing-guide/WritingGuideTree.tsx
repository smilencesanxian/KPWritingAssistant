'use client';

import { useState, useEffect, useCallback } from 'react';
import { WritingGuideNodeTree } from '@/lib/db/writing-guide';
import { cn } from '@/lib/utils';

interface WritingGuideTreeProps {
  nodes: WritingGuideNodeTree[];
  onDeleteNode?: (nodeId: string) => void;
  isDeleting?: string | null;
}

const STORAGE_KEY = 'writing-guide-expanded-nodes';

// Icon components
const EmailIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
    <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
  </svg>
);

const ArticleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path fillRule="evenodd" d="M4.125 3C3.089 3 2.25 3.84 2.25 4.875V18a3 3 0 003 3h15a3 3 0 01-3-3V4.875C17.25 3.839 16.41 3 15.375 3H4.125zM12 9.75a.75.75 0 000 1.5h1.5a.75.75 0 000-1.5H12zm-.75-2.25a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5H12a.75.75 0 01-.75-.75zM6 12.75a.75.75 0 000 1.5h7.5a.75.75 0 000-1.5H6zm-.75 3.75a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5H6a.75.75 0 01-.75-.75zM6 6.75a.75.75 0 00-.75.75v3c0 .414.336.75.75.75h3a.75.75 0 00.75-.75v-3a.75.75 0 00-.75-.75H6z" clipRule="evenodd" />
  </svg>
);

const TopicIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
  </svg>
);

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
  </svg>
);

const SystemIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
  </svg>
);

const ChevronRightIcon = ({ expanded }: { expanded: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={cn(
      "w-4 h-4 transition-transform duration-200",
      expanded && "rotate-90"
    )}
  >
    <path fillRule="evenodd" d="M16.28 11.47a.75.75 0 010 1.06l-7.5 7.5a.75.75 0 01-1.06-1.06L14.69 12 7.72 5.03a.75.75 0 011.06-1.06l7.5 7.5z" clipRule="evenodd" />
  </svg>
);

const DeleteIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.522a3 3 0 01-2.983 2.78h-5.65a3 3 0 01-2.983-2.78l-1.005-13.522-.209.035a.75.75 0 11-.256-1.478 48.816 48.816 0 013.878-.512V4.478A2.25 2.25 0 0110.5 2.25h3a2.25 2.25 0 012.25 2.25zm-6.75 5.25a.75.75 0 10-1.5 0v7.5a.75.75 0 001.5 0v-7.5zm3.75-1.5a.75.75 0 00-1.5 0v9a.75.75 0 001.5 0v-9z" clipRule="evenodd" />
  </svg>
);

export default function WritingGuideTree({ nodes, onDeleteNode, isDeleting }: WritingGuideTreeProps) {
  // Initialize expanded state from localStorage
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set();
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return new Set(JSON.parse(saved));
      }
    } catch {
      // Ignore localStorage errors
    }
    // Default: expand level 0 nodes (essay types)
    return new Set(nodes.filter(n => n.node_type === 'essay_type').map(n => n.id));
  });

  // Save expanded state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(expandedNodes)));
    } catch {
      // Ignore localStorage errors
    }
  }, [expandedNodes]);

  const toggleNode = useCallback((nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const getNodeIcon = (node: WritingGuideNodeTree) => {
    switch (node.node_type) {
      case 'essay_type':
        if (node.label.includes('邮件')) return <EmailIcon />;
        if (node.label.includes('文章')) return <ArticleIcon />;
        return <ArticleIcon />;
      case 'topic':
        return <TopicIcon />;
      case 'highlight':
        return node.source === 'user' ? <UserIcon /> : <SystemIcon />;
      default:
        return null;
    }
  };

  const getNodeStyles = (node: WritingGuideNodeTree) => {
    switch (node.node_type) {
      case 'essay_type':
        return 'font-bold text-neutral-900';
      case 'topic':
        return 'font-medium text-neutral-700';
      case 'highlight':
        return 'text-neutral-600';
      default:
        return '';
    }
  };

  const getIndentLevel = (node: WritingGuideNodeTree) => {
    switch (node.node_type) {
      case 'essay_type':
        return 'pl-2';
      case 'topic':
        return 'pl-8';
      case 'highlight':
        return 'pl-14';
      default:
        return '';
    }
  };

  const getIconColor = (node: WritingGuideNodeTree) => {
    switch (node.node_type) {
      case 'essay_type':
        return 'text-primary-600';
      case 'topic':
        return 'text-secondary-500';
      case 'highlight':
        return node.source === 'user' ? 'text-amber-500' : 'text-blue-500';
      default:
        return 'text-neutral-400';
    }
  };

  const renderNode = (node: WritingGuideNodeTree) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const isHighlight = node.node_type === 'highlight';
    const canDelete = isHighlight && node.source === 'user' && onDeleteNode;

    return (
      <div key={node.id} data-testid={`node-${node.id}`} data-node-type={node.node_type} data-source={node.source}>
        <div
          className={cn(
            'flex items-center gap-2 py-3 pr-3 border-b border-neutral-100 cursor-pointer hover:bg-neutral-50 transition-colors',
            getIndentLevel(node)
          )}
          onClick={() => hasChildren && toggleNode(node.id)}
          data-testid={`expand-node-${node.id}`}
        >
          {/* Expand/Collapse indicator */}
          <span className={cn('w-4 h-4 flex items-center justify-center', !hasChildren && 'invisible')}>
            <ChevronRightIcon expanded={isExpanded} />
          </span>

          {/* Node icon */}
          <span className={cn('flex-shrink-0', getIconColor(node))}>
            {getNodeIcon(node)}
          </span>

          {/* Node label */}
          <span className={cn('flex-1 truncate', getNodeStyles(node))}>
            {node.label}
          </span>

          {/* Highlight type badge */}
          {isHighlight && node.highlight?.type && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500">
              {node.highlight.type === 'vocabulary' && '词汇'}
              {node.highlight.type === 'phrase' && '短语'}
              {node.highlight.type === 'sentence' && '句式'}
            </span>
          )}

          {/* Source badge for highlights */}
          {isHighlight && (
            <span className={cn(
              'text-xs px-2 py-0.5 rounded-full',
              node.source === 'user'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-blue-100 text-blue-700'
            )}>
              {node.source === 'user' ? '✨ 我的' : '⭐ 推荐'}
            </span>
          )}

          {/* Delete button (only for user highlights) */}
          {canDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteNode(node.id);
              }}
              disabled={isDeleting === node.id}
              className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50"
              data-testid={`delete-node-${node.id}`}
              title="从导览中移除"
            >
              {isDeleting === node.id ? (
                <span className="w-4 h-4 block border-2 border-neutral-300 border-t-transparent rounded-full animate-spin" />
              ) : (
                <DeleteIcon />
              )}
            </button>
          )}
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="animate-in slide-in-from-top-1 duration-200">
            {node.children.map(child => renderNode(child))}
          </div>
        )}
      </div>
    );
  };

  if (!nodes || nodes.length === 0) {
    return null;
  }

  return (
    <div data-testid="writing-guide-tree" className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
      {nodes.map(node => renderNode(node))}
    </div>
  );
}
