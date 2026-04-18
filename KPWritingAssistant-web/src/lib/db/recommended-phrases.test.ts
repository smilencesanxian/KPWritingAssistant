/**
 * @jest-environment node
 */

import { createClient } from '@/lib/supabase/server';
import { getKnowledgeBase } from './recommended-phrases';

jest.mock('@/lib/supabase/server');

const mockedCreateClient = createClient as jest.MockedFunction<typeof createClient>;

function createRecommendedPhrasesQuery(rows: unknown[]) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    order: jest.fn().mockResolvedValue({ data: rows, error: null }),
  };
}

function createHighlightsQuery(rows: unknown[]) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    not: jest.fn().mockResolvedValue({ data: rows, error: null }),
    is: jest.fn().mockReturnThis(),
  };
}

describe('getKnowledgeBase', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('filters out basic system phrases and groups article phrases by topic_tags', async () => {
    const recommendedRows = [
      {
        id: 'p-basic-1',
        text: 'basic phrase should not show',
        type: 'phrase',
        level: 'basic',
        category: 'opening',
        topic_tags: ['favorite-place'],
      },
      {
        id: 'p-adv-1',
        text: 'advanced place phrase',
        type: 'phrase',
        level: 'advanced',
        category: 'opening',
        topic_tags: ['favorite-place'],
      },
      {
        id: 'p-adv-2',
        text: 'advanced reading sentence',
        type: 'sentence',
        level: 'advanced',
        category: 'detail',
        topic_tags: ['reading'],
      },
    ];

    const collectedHighlightRows = [
      {
        id: 'hl-system-1',
        source: 'system',
        recommended_phrase_id: 'p-adv-1',
        usage_count: 2,
      },
    ];

    const userCustomRows = [
      {
        id: 'hl-user-1',
        text: 'user custom article note',
        type: 'phrase',
        usage_count: 1,
      },
    ];

    let highlightsCall = 0;
    mockedCreateClient.mockResolvedValue({
      from: jest.fn().mockImplementation((table: string) => {
        if (table === 'recommended_phrases') {
          return createRecommendedPhrasesQuery(recommendedRows);
        }

        if (table === 'highlights_library') {
          highlightsCall += 1;
          if (highlightsCall === 1) {
            return createHighlightsQuery(collectedHighlightRows);
          }
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            is: jest.fn().mockReturnThis(),
            not: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            then: undefined,
            // for final await
            ...{
              then: (resolve: (value: { data: unknown[]; error: null }) => void) =>
                resolve({ data: userCustomRows, error: null }),
            },
          };
        }

        throw new Error(`Unexpected table: ${table}`);
      }),
    } as unknown as ReturnType<typeof createClient>);

    const sections = await getKnowledgeBase('article', 'user-1');

    const allTexts = sections.flatMap((section) => section.items.map((item) => item.text));
    expect(allTexts).toContain('advanced place phrase');
    expect(allTexts).toContain('advanced reading sentence');
    expect(allTexts).toContain('user custom article note');
    expect(allTexts).not.toContain('basic phrase should not show');

    expect(sections[0].category).toBe('article_topic:favorite_place');
    expect(sections[0].category_label).toBe('地点描述');
    expect(sections[1].category).toBe('article_topic:reading');
    expect(sections[1].category_label).toBe('读书');
  });

  it('falls back to category grouping when topic_tags are missing', async () => {
    const recommendedRows = [
      {
        id: 'p-adv-3',
        text: 'advanced connector phrase',
        type: 'phrase',
        level: 'advanced',
        category: 'connector',
        topic_tags: null,
      },
    ];

    let highlightsCall = 0;
    mockedCreateClient.mockResolvedValue({
      from: jest.fn().mockImplementation((table: string) => {
        if (table === 'recommended_phrases') {
          return createRecommendedPhrasesQuery(recommendedRows);
        }

        if (table === 'highlights_library') {
          highlightsCall += 1;
          if (highlightsCall === 1) {
            return createHighlightsQuery([]);
          }
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            is: jest.fn().mockReturnThis(),
            ...{
              then: (resolve: (value: { data: unknown[]; error: null }) => void) =>
                resolve({ data: [], error: null }),
            },
          };
        }

        throw new Error(`Unexpected table: ${table}`);
      }),
    } as unknown as ReturnType<typeof createClient>);

    const sections = await getKnowledgeBase('article', 'user-1');
    expect(sections.some((section) => section.category === 'connector')).toBe(true);
  });
});

