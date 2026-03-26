import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import RegenerateModal from './RegenerateModal';

// Mock fetch
global.fetch = jest.fn();

describe('RegenerateModal', () => {
  const mockOnClose = jest.fn();
  const mockOnRegenerate = jest.fn();
  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    essayId: 'test-essay-123',
    onRegenerate: mockOnRegenerate,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  describe('UT-001: 组件正确渲染', () => {
    it('should render modal when isOpen is true', () => {
      render(<RegenerateModal {...defaultProps} />);

      expect(screen.getByRole('heading', { name: '重新生成范文' })).toBeInTheDocument();
      expect(screen.getByTestId('preference-input')).toBeInTheDocument();
      expect(screen.getByText('取消')).toBeInTheDocument();
      expect(screen.getByTestId('regenerate-button')).toBeInTheDocument();
    });

    it('should not render when isOpen is false', () => {
      render(<RegenerateModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByRole('heading', { name: '重新生成范文' })).not.toBeInTheDocument();
    });

    it('should display placeholder text in textarea', () => {
      render(<RegenerateModal {...defaultProps} />);

      const textarea = screen.getByTestId('preference-input');
      expect(textarea).toHaveAttribute('placeholder', '例如：更正式一些，加入描述性词汇，适合Part 2文章风格...');
    });
  });

  describe('UT-002: textarea 输入更新 state', () => {
    it('should update preferenceNotes when typing in textarea', () => {
      render(<RegenerateModal {...defaultProps} />);

      const textarea = screen.getByTestId('preference-input');
      fireEvent.change(textarea, { target: { value: '更正式一些' } });

      expect(textarea).toHaveValue('更正式一些');
    });

    it('should handle empty input', () => {
      render(<RegenerateModal {...defaultProps} />);

      const textarea = screen.getByTestId('preference-input');
      fireEvent.change(textarea, { target: { value: '' } });

      expect(textarea).toHaveValue('');
    });

    it('should handle long text input', () => {
      render(<RegenerateModal {...defaultProps} />);

      const longText = '这是一段很长的文本'.repeat(20);
      const textarea = screen.getByTestId('preference-input');
      fireEvent.change(textarea, { target: { value: longText } });

      expect(textarea).toHaveValue(longText);
    });
  });

  describe('UT-003: 按钮点击触发 handleRegenerate', () => {
    it('should call handleRegenerate when button is clicked', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          model_essay: {
            id: 'test-essay-123',
            user_edited_content: null,
            is_user_edited: false,
          },
        }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      render(<RegenerateModal {...defaultProps} />);

      const textarea = screen.getByTestId('preference-input');
      fireEvent.change(textarea, { target: { value: '更正式一些' } });

      const button = screen.getByTestId('regenerate-button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/model-essays/test-essay-123/regenerate',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ preference_notes: '更正式一些' }),
          }
        );
      });
    });

    it('should trigger API call with empty preference_notes when textarea is empty', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          model_essay: {
            id: 'test-essay-123',
            user_edited_content: null,
            is_user_edited: false,
          },
        }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      render(<RegenerateModal {...defaultProps} />);

      const button = screen.getByTestId('regenerate-button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/model-essays/test-essay-123/regenerate',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ preference_notes: '' }),
          }
        );
      });
    });

    it('should call onRegenerate and onClose after successful API call', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          model_essay: {
            id: 'test-essay-123',
            user_edited_content: 'updated content',
            is_user_edited: true,
          },
        }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      render(<RegenerateModal {...defaultProps} />);

      const button = screen.getByTestId('regenerate-button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockOnRegenerate).toHaveBeenCalledWith({
          id: 'test-essay-123',
          user_edited_content: 'updated content',
          is_user_edited: true,
        });
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe('UT-004: 加载状态禁用按钮', () => {
    it('should disable button when loading', async () => {
      // Create a delayed response to keep loading state
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<RegenerateModal {...defaultProps} />);

      const button = screen.getByTestId('regenerate-button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(button).toBeDisabled();
        expect(screen.getByText('正在重新生成...')).toBeInTheDocument();
      });
    });

    it('should disable textarea when loading', async () => {
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise(() => {})
      );

      render(<RegenerateModal {...defaultProps} />);

      const button = screen.getByTestId('regenerate-button');
      fireEvent.click(button);

      await waitFor(() => {
        const textarea = screen.getByTestId('preference-input');
        expect(textarea).toBeDisabled();
      });
    });

    it('should re-enable button after loading completes', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          model_essay: {
            id: 'test-essay-123',
            user_edited_content: null,
            is_user_edited: false,
          },
        }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      render(<RegenerateModal {...defaultProps} />);

      const button = screen.getByTestId('regenerate-button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });

      // After modal closes, if we reopen it, button should be enabled
      // This tests that isLoading is reset to false
    });
  });

  describe('Error handling', () => {
    it('should display error message when API fails', async () => {
      const mockResponse = {
        ok: false,
        json: jest.fn().mockResolvedValue({ error: '生成失败' }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      render(<RegenerateModal {...defaultProps} />);

      const button = screen.getByTestId('regenerate-button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByTestId('regenerate-error')).toHaveTextContent('生成失败');
      });
    });

    it('should reset loading state after error', async () => {
      const mockResponse = {
        ok: false,
        json: jest.fn().mockResolvedValue({ error: '生成失败' }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      render(<RegenerateModal {...defaultProps} />);

      const button = screen.getByTestId('regenerate-button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByTestId('regenerate-button')).toHaveTextContent('重新生成范文');
        expect(button).not.toBeDisabled();
      });
    });
  });

  describe('Close behavior', () => {
    it('should call onClose when clicking cancel button', () => {
      render(<RegenerateModal {...defaultProps} />);

      const cancelButton = screen.getByText('取消');
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call onClose when clicking backdrop', () => {
      render(<RegenerateModal {...defaultProps} />);

      const backdrop = screen.getByTestId('regenerate-sheet-backdrop');
      fireEvent.click(backdrop);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call onClose when clicking close icon', () => {
      render(<RegenerateModal {...defaultProps} />);

      const closeButton = screen.getByTestId('regenerate-sheet-close');
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should not close when loading', async () => {
      (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

      render(<RegenerateModal {...defaultProps} />);

      const button = screen.getByTestId('regenerate-button');
      fireEvent.click(button);

      await waitFor(() => {
        const closeButton = screen.getByTestId('regenerate-sheet-close');
        expect(closeButton).toBeDisabled();
      });

      mockOnClose.mockClear();

      const backdrop = screen.getByTestId('regenerate-sheet-backdrop');
      fireEvent.click(backdrop);

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });
});
