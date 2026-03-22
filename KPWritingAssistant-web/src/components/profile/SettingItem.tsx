'use client';

import React from 'react';

interface SettingItemProps {
  icon: React.ReactNode;
  label: string;
  rightContent?: React.ReactNode;
  onClick?: () => void;
  clickable?: boolean;
}

export default function SettingItem({
  icon,
  label,
  rightContent,
  onClick,
  clickable = true,
}: SettingItemProps) {
  const content = (
    <div className="flex items-center gap-3 py-4 px-4">
      <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-500 flex-shrink-0">
        {icon}
      </div>
      <span className="flex-1 text-sm font-medium text-neutral-800">{label}</span>
      <div className="flex items-center gap-1 text-sm text-neutral-400">
        {rightContent}
        {clickable && onClick && (
          <svg className="w-4 h-4 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        )}
      </div>
    </div>
  );

  if (onClick && clickable) {
    return (
      <button
        onClick={onClick}
        className="w-full text-left hover:bg-neutral-50 active:bg-neutral-100 transition-colors"
      >
        {content}
      </button>
    );
  }

  return <div>{content}</div>;
}
