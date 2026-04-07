'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';

interface LanguageCorrection {
  original: string;
  error_type: string;
  suggestion: string;
}

interface CorrectionSteps {
  step1: string;
  step2: string;
  step3: string;
  step4: LanguageCorrection[];
  step5: string;
  step6: string;
}

interface CorrectionDetailsProps {
  correctionSteps: CorrectionSteps | null | undefined;
}

interface StepConfig {
  key: keyof CorrectionSteps;
  title: string;
  icon: string;
}

const STEPS: StepConfig[] = [
  { key: 'step1', title: 'Step 1: 任务完成度分析', icon: '📝' },
  { key: 'step2', title: 'Step 2: 内容完整性检查', icon: '✅' },
  { key: 'step3', title: 'Step 3: 逻辑结构评估', icon: '🏗️' },
  { key: 'step4', title: 'Step 4: 语言校对', icon: '🔍' },
  { key: 'step5', title: 'Step 5: 词汇多样性分析', icon: '📚' },
  { key: 'step6', title: 'Step 6: 语法准确性检查', icon: '✏️' },
];

export default function CorrectionDetails({ correctionSteps }: CorrectionDetailsProps) {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(() => {
    // Default expand all steps
    return new Set(STEPS.map((s) => s.key));
  });

  if (!correctionSteps) {
    return null; // Hide entire block for old data
  }

  const toggleStep = (stepKey: string) => {
    setExpandedSteps((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(stepKey)) {
        newSet.delete(stepKey);
      } else {
        newSet.add(stepKey);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    setExpandedSteps(new Set(STEPS.map((s) => s.key)));
  };

  const collapseAll = () => {
    setExpandedSteps(new Set());
  };

  const isAllExpanded = expandedSteps.size === STEPS.length;

  return (
    <section data-testid="correction-details">
      <Card>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-neutral-700">批改详情</h3>
          <button
            onClick={isAllExpanded ? collapseAll : expandAll}
            className="text-xs text-primary-600 hover:text-primary-700 transition-colors"
          >
            {isAllExpanded ? '全部收起' : '全部展开'}
          </button>
        </div>

        {/* Accordion */}
        <div className="space-y-2">
          {STEPS.map(({ key, title, icon }) => {
            const isExpanded = expandedSteps.has(key);
            const content = correctionSteps[key];
            const isStep4 = key === 'step4';
            const step4Data = isStep4 ? (content as LanguageCorrection[]) : null;

            return (
              <div
                key={key}
                className="border border-neutral-200 rounded-lg overflow-hidden"
              >
                {/* Accordion Header */}
                <button
                  onClick={() => toggleStep(key)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-neutral-50 hover:bg-neutral-100 transition-colors text-left"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{icon}</span>
                    <span className="text-sm font-medium text-neutral-700">{title}</span>
                  </div>
                  <svg
                    className={`w-5 h-5 text-neutral-400 transition-transform ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Accordion Content */}
                {isExpanded && (
                  <div className="px-4 py-3 bg-white">
                    {isStep4 && step4Data && step4Data.length > 0 ? (
                      // Step 4: Language corrections table
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead className="bg-neutral-50">
                            <tr>
                              <th className="px-2 py-2 text-left font-medium text-neutral-500 w-1/3">
                                原文
                              </th>
                              <th className="px-2 py-2 text-left font-medium text-neutral-500 w-1/4">
                                问题类型
                              </th>
                              <th className="px-2 py-2 text-left font-medium text-neutral-500">
                                修改建议
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-100">
                            {step4Data.map((item, index) => (
                              <tr key={index}>
                                <td className="px-2 py-2 text-neutral-700 align-top">
                                  <span className="line-clamp-2">{item.original}</span>
                                </td>
                                <td className="px-2 py-2 align-top">
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-red-50 text-red-600">
                                    {item.error_type}
                                  </span>
                                </td>
                                <td className="px-2 py-2 text-neutral-600 align-top">
                                  <span className="line-clamp-2">{item.suggestion}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : isStep4 && (!step4Data || step4Data.length === 0) ? (
                      <p className="text-xs text-green-600">✓ 语言表达较好，未发现明显语法或拼写问题</p>
                    ) : (
                      // Other steps: plain text content
                      <p className="text-sm text-neutral-600 leading-relaxed whitespace-pre-line">
                        {typeof content === 'string' ? content : '暂无内容'}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </section>
  );
}
