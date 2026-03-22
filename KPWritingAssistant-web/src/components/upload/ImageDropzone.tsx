'use client';

import { useRef, useState, DragEvent, ChangeEvent } from 'react';
import { cn } from '@/lib/utils';

interface ImageDropzoneProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export default function ImageDropzone({ onFileSelect, disabled }: ImageDropzoneProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    if (!disabled) setDragging(true);
  }

  function handleDragLeave() {
    setDragging(false);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      onFileSelect(file);
    }
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      className={cn(
        'border-2 border-dashed rounded-2xl flex flex-col items-center justify-center',
        'cursor-pointer transition-colors select-none min-h-[240px] px-6 py-10',
        dragging
          ? 'border-primary-500 bg-primary-50'
          : 'border-neutral-300 bg-neutral-50 hover:border-primary-400 hover:bg-primary-50/50',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mb-4">
        <svg
          className="w-8 h-8 text-primary-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
      <p className="text-sm font-medium text-neutral-700 mb-1">拖拽图片到此处，或点击选择</p>
      <p className="text-xs text-neutral-400">支持 JPG、PNG、WebP，最大 10MB</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
        disabled={disabled}
      />
    </div>
  );
}
