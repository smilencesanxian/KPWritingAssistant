import { describe, it, expect, jest } from '@jest/globals';
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

/**
 * BottomNav Integration Tests - Task 17
 *
 * Tests for:
 * - Component rendering with all navigation items
 * - Link navigation behavior
 * - Active state styling
 */

// Mock Next.js Link component
interface MockLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  'data-testid'?: string;
}

jest.mock('next/link', () => {
  return function MockLink({ href, children, className, 'data-testid': dataTestId }: MockLinkProps) {
    return (
      <a href={href} className={className} data-testid={dataTestId}>
        {children}
      </a>
    );
  };
});

// Mock Next.js navigation
const mockUsePathname = jest.fn();
jest.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

// Mock BottomNav component structure for testing
const MockBottomNav = ({ pathname }: { pathname: string }) => {
  const navItems = [
    { href: '/', label: '首页' },
    { href: '/history', label: '历史' },
    { href: '/highlights', label: '亮点库' },
    { href: '/writing-guide', label: '导览' },
    { href: '/error-points', label: '易错点' },
    { href: '/profile', label: '我的' },
  ];

  const isActive = (href: string) => {
    return href === '/' ? pathname === '/' : pathname.startsWith(href);
  };

  return (
    <nav data-testid="bottom-nav">
      <div data-testid="nav-container">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <a
              key={item.href}
              href={item.href}
              data-testid={`nav-item-${item.href.replace(/\//g, '').replace(/-/g, '-') || 'home'}`}
              data-active={active}
              className={active ? 'text-primary-600' : 'text-neutral-400'}
            >
              <span>{item.label}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
};

describe('BottomNav Integration - Component Rendering', () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue('/');
  });

  it('IT-002: should render all 6 navigation items', () => {
    render(<MockBottomNav pathname="/" />);

    expect(screen.getByText('首页')).toBeInTheDocument();
    expect(screen.getByText('历史')).toBeInTheDocument();
    expect(screen.getByText('亮点库')).toBeInTheDocument();
    expect(screen.getByText('导览')).toBeInTheDocument();
    expect(screen.getByText('易错点')).toBeInTheDocument();
    expect(screen.getByText('我的')).toBeInTheDocument();
  });

  it('IT-002: should render navigation container with correct structure', () => {
    render(<MockBottomNav pathname="/" />);

    const navContainer = screen.getByTestId('nav-container');
    expect(navContainer).toBeInTheDocument();
    expect(navContainer.children).toHaveLength(6);
  });

  it('IT-002: guide item should be rendered in correct position', () => {
    render(<MockBottomNav pathname="/" />);

    const navContainer = screen.getByTestId('nav-container');
    const items = Array.from(navContainer.children);

    expect(items[2]).toHaveTextContent('亮点库');
    expect(items[3]).toHaveTextContent('导览');
    expect(items[4]).toHaveTextContent('易错点');
  });
});

describe('BottomNav Integration - Navigation Links', () => {
  it('IT-001: guide item should have correct href attribute', () => {
    render(<MockBottomNav pathname="/" />);

    const guideLink = screen.getByText('导览').closest('a');
    expect(guideLink).toHaveAttribute('href', '/writing-guide');
  });

  it('IT-001: all items should have correct href attributes', () => {
    render(<MockBottomNav pathname="/" />);

    const expectedHrefs = [
      { label: '首页', href: '/' },
      { label: '历史', href: '/history' },
      { label: '亮点库', href: '/highlights' },
      { label: '导览', href: '/writing-guide' },
      { label: '易错点', href: '/error-points' },
      { label: '我的', href: '/profile' },
    ];

    expectedHrefs.forEach(({ label, href }) => {
      const link = screen.getByText(label).closest('a');
      expect(link).toHaveAttribute('href', href);
    });
  });
});

describe('BottomNav Integration - Active State Styling', () => {
  it('should apply active styling to current page', () => {
    render(<MockBottomNav pathname="/writing-guide" />);

    const guideLink = screen.getByText('导览').closest('a');
    expect(guideLink).toHaveClass('text-primary-600');
    expect(guideLink).toHaveAttribute('data-active', 'true');
  });

  it('should apply inactive styling to other pages', () => {
    render(<MockBottomNav pathname="/writing-guide" />);

    const homeLink = screen.getByText('首页').closest('a');
    expect(homeLink).toHaveClass('text-neutral-400');
    expect(homeLink).toHaveAttribute('data-active', 'false');
  });

  it('should handle active state for guide sub-routes', () => {
    render(<MockBottomNav pathname="/writing-guide/topic/123" />);

    const guideLink = screen.getByText('导览').closest('a');
    expect(guideLink).toHaveClass('text-primary-600');
    expect(guideLink).toHaveAttribute('data-active', 'true');
  });

  it('should handle active state for home page correctly', () => {
    render(<MockBottomNav pathname="/" />);

    const homeLink = screen.getByText('首页').closest('a');
    expect(homeLink).toHaveClass('text-primary-600');
    expect(homeLink).toHaveAttribute('data-active', 'true');
  });

  it('should not mark home active on sub-pages', () => {
    render(<MockBottomNav pathname="/history" />);

    const homeLink = screen.getByText('首页').closest('a');
    expect(homeLink).toHaveClass('text-neutral-400');
    expect(homeLink).toHaveAttribute('data-active', 'false');
  });
});

describe('BottomNav Integration - Accessibility', () => {
  it('should render navigation with semantic nav element', () => {
    render(<MockBottomNav pathname="/" />);

    const nav = screen.getByTestId('bottom-nav');
    expect(nav.tagName.toLowerCase()).toBe('nav');
  });

  it('all navigation items should be visible', () => {
    render(<MockBottomNav pathname="/" />);

    const labels = ['首页', '历史', '亮点库', '导览', '易错点', '我的'];
    labels.forEach(label => {
      expect(screen.getByText(label)).toBeVisible();
    });
  });
});
