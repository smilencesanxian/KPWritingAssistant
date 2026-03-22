'use client';

import { useState } from 'react';
import { PracticeItem } from '@/lib/knowledge/error-explanations';

interface PracticeQuestionProps {
  practice: PracticeItem;
  index: number;
}

export default function PracticeQuestion({ practice, index }: PracticeQuestionProps) {
  const [showAnswer, setShowAnswer] = useState(false);

  return (
    <div className="py-3 border-b border-neutral-100 last:border-b-0">
      <p className="text-sm text-neutral-700 leading-relaxed mb-2">
        <span className="font-medium text-neutral-500 mr-1.5">{index + 1}.</span>
        {practice.question}
      </p>
      {showAnswer ? (
        <div className="flex items-start gap-2 bg-green-50 rounded-lg px-3 py-2">
          <span className="text-green-500 text-xs mt-0.5">✓</span>
          <p className="text-sm text-green-700 font-medium">{practice.answer}</p>
        </div>
      ) : (
        <button
          onClick={() => setShowAnswer(true)}
          className="text-xs text-primary-600 border border-primary-200 rounded-full px-3 py-1 hover:bg-primary-50 transition-colors"
        >
          查看答案
        </button>
      )}
    </div>
  );
}
