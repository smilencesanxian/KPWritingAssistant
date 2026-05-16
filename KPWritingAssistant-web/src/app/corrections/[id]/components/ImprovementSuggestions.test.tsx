/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ImprovementSuggestions from './ImprovementSuggestions';

describe('ImprovementSuggestions', () => {
  it('renders nothing when both structured and fallback are absent', () => {
    const { container } = render(
      <ImprovementSuggestions structuredSuggestions={null} fallbackSuggestions={null} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders structured suggestions as individual bullet cards with icon, title, and detail', () => {
    render(
      <ImprovementSuggestions
        structuredSuggestions={[
          { icon: '📝', title: '注意时态', detail: '第三人称单数需加s' },
          { icon: '📚', title: '丰富词汇', detail: '避免重复使用同一单词' },
        ]}
        fallbackSuggestions={null}
      />
    );

    expect(screen.getByTestId('improvement-suggestions')).toBeTruthy();
    expect(screen.getByText('注意时态')).toBeTruthy();
    expect(screen.getByText('第三人称单数需加s')).toBeTruthy();
    expect(screen.getByText('丰富词汇')).toBeTruthy();
    expect(screen.getByText('避免重复使用同一单词')).toBeTruthy();

    // Icons should render
    expect(screen.getByText('📝')).toBeTruthy();
    expect(screen.getByText('📚')).toBeTruthy();
  });

  it('uses fallback text when structuredSuggestions is empty', () => {
    render(
      <ImprovementSuggestions
        structuredSuggestions={[]}
        fallbackSuggestions={'1. 注意时态\n2. 丰富词汇'}
      />
    );

    expect(screen.getByTestId('improvement-suggestions')).toBeTruthy();
    expect(screen.getByText(/注意时态/)).toBeTruthy();
  });

  it('uses fallback text when structuredSuggestions is null', () => {
    render(
      <ImprovementSuggestions
        structuredSuggestions={null}
        fallbackSuggestions={'改进建议内容'}
      />
    );

    expect(screen.getByText('改进建议内容')).toBeTruthy();
  });

  it('prefers structured suggestions over fallback when both present', () => {
    render(
      <ImprovementSuggestions
        structuredSuggestions={[{ icon: '💡', title: '结构化标题', detail: '详细说明' }]}
        fallbackSuggestions={'纯文本建议'}
      />
    );

    expect(screen.getByText('结构化标题')).toBeTruthy();
    expect(screen.queryByText('纯文本建议')).toBeNull();
  });

  it('uses default icon when suggestion icon is empty', () => {
    render(
      <ImprovementSuggestions
        structuredSuggestions={[{ icon: '', title: '测试标题', detail: '测试详情' }]}
        fallbackSuggestions={null}
      />
    );

    // Default icon 💡 is used when icon is empty string
    expect(screen.getByText('💡')).toBeTruthy();
  });
});
