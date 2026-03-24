'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import ImageDropzone from '@/components/upload/ImageDropzone';
import Button from '@/components/ui/Button';
import Textarea from '@/components/ui/Textarea';
import Spinner from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';

type Step = 'select' | 'processing' | 'confirm' | 'correcting' | 'correction-failed';
type ExamPart = 'part1' | 'part2' | null;
type QuestionType = 'q1' | 'q2' | null;

interface DetectTypeResult {
  exam_part: 'part1' | 'part2';
  question_type: 'q1' | 'q2' | null;
  essay_type_label: string;
  topic: string;
  confidence: 'high' | 'medium' | 'low';
}

// Scoring dimensions for the correcting step
const scoringDimensions = [
  {
    key: 'content',
    title: 'Content',
    maxScore: 5,
    description: '完整覆盖要点 + 充实细节',
  },
  {
    key: 'communicative_achievement',
    title: 'Communicative Achievement',
    maxScore: 5,
    description: '格式规范，语气恰当',
  },
  {
    key: 'organisation',
    title: 'Organisation',
    maxScore: 5,
    description: '分段清晰，逻辑连贯',
  },
  {
    key: 'language',
    title: 'Language',
    maxScore: 5,
    description: '词汇丰富，语法多样',
  },
];

// Type options for manual override
const typeOptions = [
  { value: 'part1', label: 'Part 1 邮件', examPart: 'part1' as const, questionType: null },
  { value: 'part2-q1', label: 'Part 2 Question 1 文章', examPart: 'part2' as const, questionType: 'q1' as const },
  { value: 'part2-q2', label: 'Part 2 Question 2 故事', examPart: 'part2' as const, questionType: 'q2' as const },
];

// Helper function to generate type label
function getTypeLabel(examPart: ExamPart, questionType: QuestionType): string {
  if (examPart === 'part1') {
    return 'Part 1 · 邮件';
  }
  if (examPart === 'part2') {
    if (questionType === 'q1') return 'Part 2 · Question 1 · 文章';
    if (questionType === 'q2') return 'Part 2 · Question 2 · 故事';
    return 'Part 2 · 文章';
  }
  return '未识别';
}

export default function UploadPage() {
  const router = useRouter();
  const showToast = useToast();

  // Step state
  const [step, setStep] = useState<Step>('select');
  const [isProcessing, setIsProcessing] = useState(false);

  // Essay image state
  const [essayFile, setEssayFile] = useState<File | null>(null);
  const [essayPreviewUrl, setEssayPreviewUrl] = useState<string | null>(null);
  const [essayStoragePath, setEssayStoragePath] = useState('');

  // Question image state (optional)
  const [questionFile, setQuestionFile] = useState<File | null>(null);
  const [questionPreviewUrl, setQuestionPreviewUrl] = useState<string | null>(null);
  const [questionStoragePath, setQuestionStoragePath] = useState('');

  // OCR and detection state
  const [ocrText, setOcrText] = useState('');
  const [questionOcrText, setQuestionOcrText] = useState('');
  const [ocrFailed, setOcrFailed] = useState(false);
  const [detectedType, setDetectedType] = useState<DetectTypeResult | null>(null);

  // Manual override state
  const [manualType, setManualType] = useState('');

  // Correction state
  const [correctionError, setCorrectionError] = useState('');
  const [submissionId, setSubmissionId] = useState('');

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      if (essayPreviewUrl) URL.revokeObjectURL(essayPreviewUrl);
      if (questionPreviewUrl) URL.revokeObjectURL(questionPreviewUrl);
    };
  }, [essayPreviewUrl, questionPreviewUrl]);

  // Handle essay file selection
  const handleEssayFileSelect = useCallback((selected: File) => {
    setEssayFile(selected);
    const url = URL.createObjectURL(selected);
    setEssayPreviewUrl(url);
  }, []);

  // Handle question file selection
  const handleQuestionFileSelect = useCallback((selected: File) => {
    setQuestionFile(selected);
    const url = URL.createObjectURL(selected);
    setQuestionPreviewUrl(url);
  }, []);

  // Remove essay file
  const removeEssayFile = useCallback(() => {
    if (essayPreviewUrl) URL.revokeObjectURL(essayPreviewUrl);
    setEssayFile(null);
    setEssayPreviewUrl(null);
  }, [essayPreviewUrl]);

  // Remove question file
  const removeQuestionFile = useCallback(() => {
    if (questionPreviewUrl) URL.revokeObjectURL(questionPreviewUrl);
    setQuestionFile(null);
    setQuestionPreviewUrl(null);
  }, [questionPreviewUrl]);

  // Compress image before upload
  async function compressImage(original: File): Promise<File> {
    const MAX_SIZE_DIRECT = 500 * 1024;
    if (original.size <= MAX_SIZE_DIRECT) {
      return original;
    }

    const MAX_DIMENSION = 1920;
    const QUALITY = 0.9;
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

  // Upload a single file
  async function uploadFile(file: File): Promise<{ storage_path: string; url: string }> {
    const compressed = await compressImage(file);
    const formData = new FormData();
    formData.append('file', compressed);
    const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
    if (!uploadRes.ok) {
      const { error } = await uploadRes.json();
      throw new Error(error ?? '图片上传失败');
    }
    return uploadRes.json();
  }

  // Perform OCR on an image
  async function performOcr(imageUrl: string): Promise<string> {
    const ocrRes = await fetch('/api/ocr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_url: imageUrl }),
    });
    if (!ocrRes.ok) {
      throw new Error('OCR failed');
    }
    const { text } = await ocrRes.json();
    return text ?? '';
  }

  // Detect essay type using the API
  async function detectEssayType(essayText: string, questionText: string): Promise<DetectTypeResult> {
    const body: { essay_ocr_text: string; question_ocr_text?: string } = {
      essay_ocr_text: essayText,
    };
    if (questionText) {
      body.question_ocr_text = questionText;
    }

    const detectRes = await fetch('/api/detect-type', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!detectRes.ok) {
      // Return default values on failure
      return {
        exam_part: 'part1',
        question_type: null,
        essay_type_label: '邮件',
        topic: '',
        confidence: 'low',
      };
    }

    return detectRes.json();
  }

  // Handle start recognition - Step 1 → Step 2
  async function handleStartRecognize() {
    if (!essayFile) return;

    setIsProcessing(true);
    setStep('processing');

    try {
      // Upload both images in parallel (if question image exists)
      const uploadPromises: Promise<{ storage_path: string; url: string }>[] = [
        uploadFile(essayFile),
      ];
      if (questionFile) {
        uploadPromises.push(uploadFile(questionFile));
      }

      const uploadResults = await Promise.all(uploadPromises);
      const essayUpload = uploadResults[0];
      const questionUpload = uploadResults[1];

      setEssayStoragePath(essayUpload.storage_path);
      if (questionUpload) {
        setQuestionStoragePath(questionUpload.storage_path);
      }

      // Perform OCR in parallel
      const ocrPromises: Promise<string>[] = [
        performOcr(essayUpload.url),
      ];
      if (questionUpload) {
        ocrPromises.push(performOcr(questionUpload.url));
      }

      const ocrResults = await Promise.all(ocrPromises);
      const essayOcr = ocrResults[0] ?? '';
      const questionOcr = ocrResults[1] ?? '';

      setOcrText(essayOcr);
      setQuestionOcrText(questionOcr);
      setOcrFailed(!essayOcr);

      // Detect essay type
      const detected = await detectEssayType(essayOcr, questionOcr);
      setDetectedType(detected);

      // Set initial manual type value
      if (detected.exam_part === 'part1') {
        setManualType('part1');
      } else if (detected.exam_part === 'part2') {
        if (detected.question_type === 'q2') {
          setManualType('part2-q2');
        } else {
          setManualType('part2-q1');
        }
      }

      // Transition to confirm step
      setStep('confirm');
    } catch (err) {
      showToast(err instanceof Error ? err.message : '操作失败，请重试', 'error');
      setStep('select');
    } finally {
      setIsProcessing(false);
    }
  }

  // Parse manual type selection
  function parseManualType(value: string): { examPart: ExamPart; questionType: QuestionType } {
    if (value === 'part1') {
      return { examPart: 'part1', questionType: null };
    }
    if (value === 'part2-q1') {
      return { examPart: 'part2', questionType: 'q1' };
    }
    if (value === 'part2-q2') {
      return { examPart: 'part2', questionType: 'q2' };
    }
    return { examPart: null, questionType: null };
  }

  // Handle confirm and correct - Step 3 → Step 4
  async function handleConfirmAndCorrect(existingSubmissionId?: string) {
    setStep('correcting');
    setCorrectionError('');

    try {
      let sid = existingSubmissionId;

      // Parse the current type selection
      const { examPart, questionType } = parseManualType(manualType);

      if (!sid) {
        // Create essay record with all new fields
        const essayRes = await fetch('/api/essays', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ocr_text: ocrText,
            original_image_path: essayStoragePath,
            exam_part: examPart,
            question_type: questionType,
            question_image_path: questionStoragePath || null,
            question_ocr_text: questionOcrText || null,
            essay_topic: detectedType?.topic || null,
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

      // Start correction with exam_part parameter
      const { examPart: currentExamPart } = parseManualType(manualType);
      const correctRes = await fetch('/api/correct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission_id: sid,
          exam_part: currentExamPart,
        }),
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
      setStep('confirm');
    }
  }

  // --- Render Step: Correcting ---
  if (step === 'correcting') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        {/* Loading spinner */}
        <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center mb-6 animate-pulse">
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

        {/* Scoring dimension cards */}
        <div className="grid grid-cols-2 gap-4 mt-8 max-w-md w-full">
          {scoringDimensions.map((dim) => (
            <div
              key={dim.key}
              data-testid={`scoring-dimension-${dim.key}`}
              className="bg-white rounded-xl border border-neutral-200 p-4 shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-neutral-700">{dim.title}</span>
                <span className="text-sm font-bold text-primary-600">/5</span>
              </div>
              <p className="text-xs text-neutral-500">{dim.description}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- Render Step: Confirm ---
  if (step === 'confirm') {
    const typeLabel = detectedType
      ? getTypeLabel(detectedType.exam_part, detectedType.question_type)
      : '未识别';

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

        {/* Detected type display */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            识别到的题型
          </label>
          <div className="flex items-center gap-3">
            <span
              data-testid="detected-type-tag"
              className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-primary-100 text-primary-700"
            >
              {typeLabel}
            </span>
            {detectedType && detectedType.confidence === 'low' && (
              <span className="text-xs text-amber-600">（识别置信度较低，请手动确认）</span>
            )}
          </div>
        </div>

        {/* Manual type override */}
        <div className="mb-6">
          <label htmlFor="type-override" className="block text-sm font-medium text-neutral-700 mb-2">
            手动选择题型
          </label>
          <select
            id="type-override"
            data-testid="type-override-select"
            value={manualType}
            onChange={(e) => setManualType(e.target.value)}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
          >
            {typeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col sm:flex-row gap-6">
          {/* Image previews */}
          <div className="sm:w-40 flex-shrink-0 space-y-4">
            {essayPreviewUrl && (
              <div>
                <p className="text-xs text-neutral-500 mb-2">作文图片</p>
                <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden border border-neutral-200">
                  <Image src={essayPreviewUrl} alt="作文图片" fill className="object-cover" unoptimized />
                </div>
              </div>
            )}
            {questionPreviewUrl && (
              <div>
                <p className="text-xs text-neutral-500 mb-2">题目图片</p>
                <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden border border-neutral-200">
                  <Image src={questionPreviewUrl} alt="题目图片" fill className="object-cover" unoptimized />
                </div>
              </div>
            )}
          </div>

          {/* OCR text area */}
          <div className="flex-1 flex flex-col">
            <Textarea
              label="识别到的文字（可编辑）"
              value={ocrText}
              onChange={(e) => setOcrText(e.target.value)}
              rows={12}
              placeholder="请在此输入或修改作文内容..."
              className="flex-1"
              data-testid="ocr-textarea"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            variant="secondary"
            onClick={() => {
              setStep('select');
              setEssayFile(null);
              setEssayPreviewUrl(null);
              setQuestionFile(null);
              setQuestionPreviewUrl(null);
              setOcrText('');
              setOcrFailed(false);
              setDetectedType(null);
              setManualType('');
            }}
          >
            重新拍照
          </Button>
          <Button
            onClick={() => handleConfirmAndCorrect()}
            disabled={!ocrText.trim()}
            className="flex-1"
          >
            开始批改
          </Button>
        </div>
      </div>
    );
  }

  // --- Render Step: Correction Failed ---
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
              setStep('confirm');
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

  // --- Render Step: Processing ---
  if (step === 'processing') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center mb-6">
          <Spinner size="lg" color="var(--primary-500)" />
        </div>
        <p className="text-lg font-semibold text-neutral-800 mb-2">AI 正在识别中</p>
        <p className="text-sm text-neutral-500">正在分析图片和识别题型...</p>
      </div>
    );
  }

  // --- Render Step: Select ---
  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-xl font-bold text-neutral-900 mb-2">上传作文</h1>
      <p className="text-sm text-neutral-500 mb-6">拍照上传手写作文，AI 自动识别并批改</p>

      {/* Essay upload (required) */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          作文照片 <span className="text-red-500">*</span>
        </label>
        <div data-testid="essay-dropzone">
          <ImageDropzone onFileSelect={handleEssayFileSelect} disabled={false} />
        </div>
        {essayFile && essayPreviewUrl && (
          <div className="mt-3 p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-neutral-200">
              <Image src={essayPreviewUrl} alt="作文预览" fill className="object-cover" unoptimized />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-800 truncate">{essayFile.name}</p>
              <p className="text-xs text-neutral-500">{(essayFile.size / 1024).toFixed(0)} KB</p>
            </div>
            <button
              onClick={removeEssayFile}
              className="text-neutral-400 hover:text-neutral-600 p-1"
              aria-label="移除作文图片"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Question upload (optional) */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          题目照片 <span className="text-neutral-400 text-xs">（可选）</span>
        </label>
        <p className="text-xs text-neutral-500 mb-2">上传题目照片，帮助AI更准确识别题型</p>
        <div data-testid="question-dropzone">
          <ImageDropzone onFileSelect={handleQuestionFileSelect} disabled={false} />
        </div>
        {questionFile && questionPreviewUrl && (
          <div className="mt-3 p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-neutral-200">
              <Image src={questionPreviewUrl} alt="题目预览" fill className="object-cover" unoptimized />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-800 truncate">{questionFile.name}</p>
              <p className="text-xs text-neutral-500">{(questionFile.size / 1024).toFixed(0)} KB</p>
            </div>
            <button
              onClick={removeQuestionFile}
              className="text-neutral-400 hover:text-neutral-600 p-1"
              aria-label="移除题目图片"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>

      <Button
        className="w-full mt-6"
        onClick={handleStartRecognize}
        disabled={!essayFile || isProcessing}
        loading={isProcessing}
      >
        开始识别
      </Button>
    </div>
  );
}
