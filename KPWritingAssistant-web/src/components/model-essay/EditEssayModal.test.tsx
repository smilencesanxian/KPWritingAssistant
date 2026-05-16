/**
 * @jest-environment jsdom
 */

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EditEssayModal from './EditEssayModal';
import { WORD_COUNT_LIMITS } from '@/lib/model-essay/format';

global.fetch = jest.fn();

function repeatWords(word: string, count: number): string {
  return Array.from({ length: count }, () => word).join(' ');
}

describe('EditEssayModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSave = jest.fn();
  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    initialContent: repeatWords('good', WORD_COUNT_LIMITS.targetMin),
    essayId: 'essay-1',
    examPart: 'part2' as const,
    questionType: 'q2' as const,
    onSave: mockOnSave,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  it('enables save button when body word count is within valid range', () => {
    render(<EditEssayModal {...defaultProps} />);

    const saveButton = screen.getByTestId('save-edit-button');
    expect(saveButton).toBeEnabled();
    expect(screen.getByText(new RegExp(`正文 ${WORD_COUNT_LIMITS.targetMin} 词`))).toBeInTheDocument();
  });

  it('disables save button when body word count exceeds hard limit', () => {
    const overLimit = WORD_COUNT_LIMITS.hardMax + 1;
    render(<EditEssayModal {...defaultProps} />);

    const textarea = screen.getByTestId('edit-essay-textarea');
    fireEvent.change(textarea, { target: { value: repeatWords('long', overLimit) } });

    const saveButton = screen.getByTestId('save-edit-button');
    expect(saveButton).toBeDisabled();
    expect(screen.getByText(new RegExp(`正文 ${overLimit} 词`))).toBeInTheDocument();
  });

  it('resets content to initialContent when modal reopens after unsaved over-limit edit', () => {
    const { rerender } = render(<EditEssayModal {...defaultProps} />);

    // User types too many words, button becomes disabled
    const textarea = screen.getByTestId('edit-essay-textarea');
    fireEvent.change(textarea, { target: { value: repeatWords('extra', 125) } });
    expect(screen.getByTestId('save-edit-button')).toBeDisabled();

    // User closes modal (isOpen = false), then reopens (isOpen = true)
    rerender(<EditEssayModal {...defaultProps} isOpen={false} />);
    rerender(<EditEssayModal {...defaultProps} isOpen={true} />);

    // Content must reset to initialContent (100 words), button must be enabled again
    expect(screen.getByTestId('edit-essay-textarea')).toHaveValue(defaultProps.initialContent);
    expect(screen.getByTestId('save-edit-button')).toBeEnabled();
  });

  it('enables save button when body word count is below generation minimum (user edits are not generation-restricted)', () => {
    // 用户编辑不受 AI 生成最低字数限制，只要不超过硬上限就能保存
    const underGenMin = WORD_COUNT_LIMITS.generationMin - 10;
    render(<EditEssayModal {...defaultProps} />);

    const textarea = screen.getByTestId('edit-essay-textarea');
    fireEvent.change(textarea, { target: { value: repeatWords('short', underGenMin) } });

    const saveButton = screen.getByTestId('save-edit-button');
    expect(saveButton).toBeEnabled();
    expect(screen.getByText(new RegExp(`正文 ${underGenMin} 词`))).toBeInTheDocument();
  });

  it('submits edited content and calls onSave/onClose on success', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        model_essay: {
          id: 'essay-1',
          user_edited_content: repeatWords('edited', 100),
          is_user_edited: true,
        },
      }),
    });

    render(<EditEssayModal {...defaultProps} />);

    const textarea = screen.getByTestId('edit-essay-textarea');
    fireEvent.change(textarea, { target: { value: repeatWords('edited', 100) } });
    fireEvent.click(screen.getByTestId('save-edit-button'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/model-essays/essay-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_edited_content: repeatWords('edited', 100),
          user_preference_notes: null,
        }),
      });
      expect(mockOnSave).toHaveBeenCalledWith({
        id: 'essay-1',
        user_edited_content: repeatWords('edited', 100),
        is_user_edited: true,
      });
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});

