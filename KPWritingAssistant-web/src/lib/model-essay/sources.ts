import type { ModelEssaySourceBuckets, ModelEssaySourceInput } from './source-spans';

export type KnowledgeEssayType = 'email' | 'article' | 'story';

function normalizeTextKey(text: string): string {
  return text.trim().replace(/\s+/g, ' ').toLowerCase();
}

export function dedupeSourceInputs<T extends ModelEssaySourceInput>(sources: T[]): T[] {
  const seen = new Set<string>();
  const unique: T[] = [];

  for (const source of sources) {
    const key = normalizeTextKey(source.text);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push(source);
  }

  return unique;
}

export function getKnowledgeEssayType(
  examPart: string | null,
  questionType: string | null
): KnowledgeEssayType {
  if (examPart === 'part1') {
    return 'email';
  }
  return questionType === 'q2' ? 'story' : 'article';
}

export function filterPhrasesByKnowledgeEssayType<T extends { knowledge_essay_type: string | null }>(
  phrases: T[],
  knowledgeEssayType: KnowledgeEssayType
): T[] {
  return phrases.filter((phrase) => {
    const et = phrase.knowledge_essay_type;
    if (!et) return true;
    if (knowledgeEssayType === 'email') return et === 'email' || et === 'general';
    if (knowledgeEssayType === 'story') return et === 'story' || et === 'general';
    return et === 'article' || et === 'general';
  });
}

export function buildModelEssaySourceBuckets(params: {
  historicalHighlights: ModelEssaySourceInput[];
  knowledgeBasePhrases: ModelEssaySourceInput[];
}): ModelEssaySourceBuckets {
  return {
    historicalHighlights: dedupeSourceInputs(params.historicalHighlights),
    knowledgeBasePhrases: dedupeSourceInputs(params.knowledgeBasePhrases),
  };
}
