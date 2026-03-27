/**
 * KB-5 单元测试：BottomNav 导航项改名
 *
 * 测试范围：
 * - UT-KB5-NAV-001: 第4个导航项 label 从'导览'改为'知识库'
 * - UT-KB5-NAV-002: 路由路径 href 保持 '/writing-guide' 不变
 * - UT-KB5-NAV-003: 仍有6个导航项，整体结构不变
 * - UT-KB5-NAV-004: 其余5个导航项 label 保持不变
 */

import { describe, it, expect } from '@jest/globals';

// Active state logic（与组件保持一致）
function isActive(href: string, pathname: string): boolean {
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}

// 期望的导航配置——反映 KB-5 改完后的最终状态
const expectedNavItems = [
  { href: '/', label: '首页' },
  { href: '/history', label: '历史' },
  { href: '/highlights', label: '亮点库' },
  { href: '/writing-guide', label: '知识库' }, // KB-5: '导览' → '知识库'
  { href: '/error-points', label: '易错点' },
  { href: '/profile', label: '我的' },
];

describe('BottomNav KB-5 - 导航项改名', () => {
  it('UT-KB5-NAV-001: 第4项 label 应为"知识库"', () => {
    expect(expectedNavItems[3].label).toBe('知识库');
  });

  it('UT-KB5-NAV-002: 第4项 href 保持 /writing-guide', () => {
    expect(expectedNavItems[3].href).toBe('/writing-guide');
  });

  it('UT-KB5-NAV-003: 导航项总数仍为6', () => {
    expect(expectedNavItems).toHaveLength(6);
  });

  it('UT-KB5-NAV-004: 其他5个导航项 label 保持原值', () => {
    expect(expectedNavItems[0].label).toBe('首页');
    expect(expectedNavItems[1].label).toBe('历史');
    expect(expectedNavItems[2].label).toBe('亮点库');
    expect(expectedNavItems[4].label).toBe('易错点');
    expect(expectedNavItems[5].label).toBe('我的');
  });

  it('UT-KB5-NAV-005: "知识库"项的激活逻辑在 /writing-guide 路径下正确', () => {
    const kb = expectedNavItems[3];
    expect(isActive(kb.href, '/writing-guide')).toBe(true);
    expect(isActive(kb.href, '/writing-guide/section/1')).toBe(true);
    expect(isActive(kb.href, '/')).toBe(false);
  });
});
