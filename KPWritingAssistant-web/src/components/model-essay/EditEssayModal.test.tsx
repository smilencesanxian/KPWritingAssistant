/**
 * @jest-environment jsdom
 */

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EditEssayModal from './EditEssayModal';

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
    initialContent: repeatWords('good', 100),
    essayId: 'essay-1',
    examPart: 'part2' as const,
    questionType: 'q2' as const,
    onSave: mockOnSave,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  it('enables save button when body word count is within 90-120', () => {
    render(<EditEssayModal {...defaultProps} />);

    const saveButton = screen.getByTestId('save-edit-button');
    expect(saveButton).toBeEnabled();
    expect(screen.getByText(/正文 100 词/)).toBeInTheDocument();
  });

  it('disables save button when body word count exceeds hard limit', () => {
    render(<EditEssayModal {...defaultProps} />);

    const textarea = screen.getByTestId('edit-essay-textarea');
    fireEvent.change(textarea, { target: { value: repeatWords('long', 121) } });

    const saveButton = screen.getByTestId('save-edit-button');
    expect(saveButton).toBeDisabled();
    expect(screen.getByText(/正文 121 词/)).toBeInTheDocument();
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

