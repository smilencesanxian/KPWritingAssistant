import { buildModelEssaySourceSpans } from './source-spans';

describe('buildModelEssaySourceSpans', () => {
  it('builds spans for historical highlights and knowledge base phrases', () => {
    const spans = buildModelEssaySourceSpans('I really enjoy reading books every day.', {
      historicalHighlights: [{ id: 'h1', text: 'really enjoy' }],
      knowledgeBasePhrases: [{ id: 'k1', text: 'reading books' }],
    });

    expect(spans).toEqual([
      expect.objectContaining({
        text: 'really enjoy',
        source_type: 'historical_highlight',
        source_id: 'h1',
        occurrence_index: 0,
      }),
      expect.objectContaining({
        text: 'reading books',
        source_type: 'knowledge_base',
        source_id: 'k1',
        occurrence_index: 0,
      }),
    ]);
  });

  it('prefers longer overlapping spans', () => {
    const spans = buildModelEssaySourceSpans('I look forward to hearing from you soon.', {
      historicalHighlights: [{ id: 'h1', text: 'look forward to' }],
      knowledgeBasePhrases: [{ id: 'k1', text: 'look forward to hearing from you' }],
    });

    expect(spans).toHaveLength(1);
    expect(spans[0]).toEqual(
      expect.objectContaining({
        text: 'look forward to hearing from you',
        source_type: 'knowledge_base',
        source_id: 'k1',
      })
    );
  });
});
