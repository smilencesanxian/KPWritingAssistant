/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import ModelEssayView from './ModelEssayView';

const push = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

describe('ModelEssayView', () => {
  beforeEach(() => {
    push.mockClear();
  });

  it('renders source spans with provenance legend', () => {
    render(
      <ModelEssayView
        correctionId="c-1"
        examPart="part2"
        questionType="q1"
        initialEssays={[
          {
            id: 'essay-1',
            correction_id: 'c-1',
            target_level: 'excellent',
            content: 'I really enjoy reading books every day.',
            created_at: '2026-04-14T00:00:00.000Z',
            user_edited_content: null,
            is_user_edited: false,
            edit_history: null,
            user_preference_notes: null,
            source_spans: [
              {
                start: 2,
                end: 14,
                text: 'really enjoy',
                source_type: 'historical_highlight',
                source_id: 'h-1',
                occurrence_index: 0,
              },
              {
                start: 15,
                end: 28,
                text: 'reading books',
                source_type: 'knowledge_base',
                source_id: 'k-1',
                occurrence_index: 0,
              },
            ],
          },
        ]}
      />
    );

    expect(screen.getByText('历史亮点')).toBeTruthy();
    expect(screen.getByText('知识库素材')).toBeTruthy();
    expect(screen.getByText('really enjoy').className).toContain('bg-sky-100');
    expect(screen.getByText('reading books').className).toContain('bg-amber-100');
  });
});
