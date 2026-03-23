'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import ImageDropzone from '@/components/upload/ImageDropzone';
import Button from '@/components/ui/Button';
import Textarea from '@/components/ui/Textarea';
import Spinner from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';

type Step = 'select' | 'confirming' | 'correcting' | 'correction-failed';

const correctingMessages = [
  '正在分析作文内容...',
  '正在检查语法和词汇...',
  '正在提取亮点...',
  '即将完成...',
];

export default function UploadPage() {
  const router = useRouter();
  const showToast = useToast();

  const [step, setStep] = useState<Step>('select');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState('');
  const [ocrFailed, setOcrFailed] = useState(false);
  const [correctionError, setCorrectionError] = useState('');
  const [submissionId, setSubmissionId] = useState('');
  const [storagePath, setStoragePath] = useState('');
  const [recognizing, setRecognizing] = useState(false);
  const [correctingMsgIndex, setCorrectingMsgIndex] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    if (step === 'correcting') {
      intervalRef.current = setInterval(() => {
        setCorrectingMsgIndex((i) => (i + 1) % correctingMessages.length);
      }, 1800);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [step]);

  function handleFileSelect(selected: File) {
    setFile(selected);
    const url = URL.createObjectURL(selected);
    setPreviewUrl(url);
  }

  async function compressImage(original: File): Promise<File> {
    const MAX_DIMENSION = 1920;
    const QUALITY = 0.85;
    const TARGET_TYPE = 'image/jpeg';

    return new Promise((resolve) => {
      const img = new window.Image();
      const url = URL.createObjectURL(original);
      img.onload = () => {
        URL.revokeObjectURL(url);
        let { width, height } = img;
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          if (width > height) {
            height = Math.round((height * MAX_DIMENSION) / width);
            width = MAX_DIMENSION;
          } else {
            width = Math.round((width * MAX_DIMENSION) / height);
            height = MAX_DIMENSION;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) { resolve(original); return; }
            const compressed = new File([blob], original.name.replace(/\.[^.]+$/, '.jpg'), {
              type: TARGET_TYPE,
              lastModified: Date.now(),
            });
            resolve(compressed);
          },
          TARGET_TYPE,
          QUALITY
        );
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(original); };
      img.src = url;
    });
  }

  async function handleStartRecognize() {
    if (!file) return;
    setRecognizing(true);

    try {
      // Step 1: Compress then upload image
      const compressed = await compressImage(file);
      const formData = new FormData();
      formData.append('file', compressed);
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!uploadRes.ok) {
        const { error } = await uploadRes.json();
        throw new Error(error ?? '图片上传失败');
      }
      const { storage_path, url } = await uploadRes.json();
      setStoragePath(storage_path);

      // Step 2: OCR
      setStep('confirming');
      const ocrRes = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: url }),
      });

      if (!ocrRes.ok) {
        setOcrFailed(true);
        setOcrText('');
      } else {
        const { text } = await ocrRes.json();
        setOcrText(text ?? '');
        setOcrFailed(!text);
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : '操作失败，请重试', 'error');
    } finally {
      setRecognizing(false);
    }
  }

  async function handleConfirmAndCorrect(existingSubmissionId?: string) {
    setStep('correcting');
    setCorrectionError('');
    setCorrectingMsgIndex(0);

    try {
      let sid = existingSubmissionId;

      if (!sid) {
        // Create essay record
        const essayRes = await fetch('/api/essays', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ocr_text: ocrText,
            original_image_path: storagePath,
          }),
        });
        if (!essayRes.ok) {
          const { error } = await essayRes.json();
          throw new Error(error ?? '创建记录失败');
        }
        const { submission } = await essayRes.json();
        sid = submission.id as string;
        setSubmissionId(sid);
      }

      // Start correction
      const correctRes = await fetch('/api/correct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submission_id: sid }),
      });
      if (!correctRes.ok) {
        const body = await correctRes.json().catch(() => ({})) as { error?: string };
        const msg = body.error ?? '批改失败，请稍后重试';
        setCorrectionError(msg);
        setStep('correction-failed');
        return;
      }
      const { correction, flagged_errors } = await correctRes.json();

      const firstFlagged = flagged_errors?.[0];
      const flaggedParam = firstFlagged
        ? `?flagged_id=${firstFlagged.id}&flagged_label=${encodeURIComponent(firstFlagged.error_type_label)}`
        : '';
      router.push(`/corrections/${correction.id}${flaggedParam}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : '批改失败，请重试', 'error');
      setStep('confirming');
    }
  }

  // --- Render ---

  if (step === 'correcting') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center mb-6 animate-pulse">
          {/* Brain icon */}
          <svg
            className="w-10 h-10 text-primary-500"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9.5 2C8.1 2 7 3.1 7 4.5c0 .3.1.6.2.9C5.9 5.9 5 7.1 5 8.5c0 1 .4 1.9 1.1 2.5C5.4 11.5 5 12.4 5 13.5c0 1.5.9 2.8 2.2 3.4.2.7.6 1.4 1.2 1.8.5.4 1.1.6 1.7.7V21h4v-1.6c.6-.1 1.2-.3 1.7-.7.6-.4 1-.9 1.2-1.6C18 16.4 19 15 19 13.5c0-1.1-.4-2-.9-2.7.5-.6.9-1.4.9-2.3 0-1.4-.9-2.6-2.2-3.1.1-.3.2-.6.2-.9C17 3.1 15.9 2 14.5 2h-5z" />
            <path d="M12 6v8M9 9l3-3 3 3" />
          </svg>
        </div>
        <p className="text-lg font-semibold text-neutral-800 mb-2">AI 正在批改中</p>
        <p className="text-sm text-neutral-500 transition-all duration-500">
          {correctingMessages[correctingMsgIndex]}
        </p>
      </div>
    );
  }

  if (step === 'confirming') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* OCR failure yellow banner */}
        {ocrFailed && (
          <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-300 rounded-xl px-4 py-3 mb-5">
            <svg
              className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              />
            </svg>
            <span className="text-sm text-yellow-700">图片识别失败，请手动输入作文内容</span>
          </div>
        )}

        <h1 className="text-xl font-bold text-neutral-900 mb-6">确认识别内容</h1>
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Image preview */}
          {previewUrl && (
            <div className="sm:w-40 flex-shrink-0">
              <p className="text-xs text-neutral-500 mb-2">作文图片</p>
              <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden border border-neutral-200">
                <Image src={previewUrl} alt="作文图片" fill className="object-cover" unoptimized />
              </div>
            </div>
          )}

          {/* OCR text area */}
          <div className="flex-1 flex flex-col">
            <Textarea
              label="识别到的文字"
              value={ocrText}
              onChange={(e) => setOcrText(e.target.value)}
              rows={12}
              placeholder="请在此输入或修改作文内容..."
              className="flex-1"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            variant="secondary"
            onClick={() => {
              setStep('select');
              setFile(null);
              setPreviewUrl(null);
              setOcrText('');
              setOcrFailed(false);
            }}
          >
            重新拍照
          </Button>
          <Button
            onClick={() => handleConfirmAndCorrect()}
            disabled={!ocrText.trim()}
            className="flex-1"
          >
            确认并批改
          </Button>
        </div>
      </div>
    );
  }

  if (step === 'correction-failed') {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
            />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-neutral-800 mb-2">批改失败</h2>
        <p className="text-sm text-neutral-500 mb-6 max-w-xs">
          {correctionError || 'AI 批改服务暂时不可用，请稍后重试'}
        </p>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => {
              setStep('confirming');
              setCorrectionError('');
            }}
          >
            返回修改
          </Button>
          <Button
            onClick={() => handleConfirmAndCorrect(submissionId || undefined)}
          >
            重新批改
          </Button>
        </div>
      </div>
    );
  }

  // step === 'select'
  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-xl font-bold text-neutral-900 mb-2">上传作文</h1>
      <p className="text-sm text-neutral-500 mb-6">拍照上传手写作文，AI 自动识别并批改</p>

      <ImageDropzone onFileSelect={handleFileSelect} disabled={recognizing} />

      {file && previewUrl && (
        <div className="mt-4 p-4 bg-neutral-50 rounded-xl border border-neutral-200 flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-neutral-200">
            <Image src={previewUrl} alt="预览" fill className="object-cover" unoptimized />
            {recognizing && (
              <div className="absolute inset-0 overflow-hidden rounded-lg">
                <div
                  className="absolute left-0 right-0 h-0.5 bg-primary-400 opacity-80"
                  style={{ animation: 'scan-line 1.5s ease-in-out infinite' }}
                />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-neutral-800 truncate">{file.name}</p>
            <p className="text-xs text-neutral-500">{(file.size / 1024).toFixed(0)} KB</p>
          </div>
          <button
            onClick={() => {
              setFile(null);
              setPreviewUrl(null);
            }}
            className="text-neutral-400 hover:text-neutral-600 p-1"
            aria-label="移除图片"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {recognizing && (
        <div className="mt-4 py-3 px-4 bg-primary-50 rounded-lg flex items-center justify-center gap-2 text-sm text-primary-600">
          <Spinner size="sm" color="var(--primary-500)" />
          <span>正在识别手写文字...</span>
        </div>
      )}

      <Button
        className="w-full mt-6"
        onClick={handleStartRecognize}
        disabled={!file || recognizing}
        loading={recognizing}
      >
        开始识别
      </Button>
    </div>
  );
}
