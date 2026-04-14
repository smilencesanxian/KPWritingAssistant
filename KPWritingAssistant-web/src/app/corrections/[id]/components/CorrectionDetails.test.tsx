import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import CorrectionDetails from './CorrectionDetails';

jest.mock('@/components/ui/Card', () => {
  return function MockCard({ children }: { children: ReactNode }) {
    return <div data-testid="card">{children}</div>;
  };
});

describe('CorrectionDetails', () => {
  const correctionSteps = {
    step1: '内容审查',
    step2: '文体审查',
    step3: '组织审查',
    step4: [
      { original: 'I go', error_type: 'tense', suggestion: 'I went' },
    ],
    step5: '✓ good phrase - 亮点说明',
    step6: '整体评价\n• 改进建议 1',
  };

  test('renders step titles aligned with correction_steps semantics', () => {
    render(<CorrectionDetails correctionSteps={correctionSteps} />);

    expect(screen.getByText('Step 1: 内容审查')).toBeInTheDocument();
    expect(screen.getByText('Step 2: 文体与交际效果审查')).toBeInTheDocument();
    expect(screen.getByText('Step 3: 组织结构审查')).toBeInTheDocument();
    expect(screen.getByText('Step 4: 语言校对')).toBeInTheDocument();
    expect(screen.getByText('Step 5: 亮点分析')).toBeInTheDocument();
    expect(screen.getByText('Step 6: 总评与改进建议')).toBeInTheDocument();
  });
});
