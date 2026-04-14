import type { ModelEssaySourceSpan } from '@/types/database';

export interface ModelEssaySourceInput {
  id: string | null;
  text: string;
}

export interface ModelEssaySourceBuckets {
  historicalHighlights: ModelEssaySourceInput[];
  knowledgeBasePhrases: ModelEssaySourceInput[];
}

function normalizeForMatching(text: string): string {
  return text.replace(/\r\n/g, '\n').replace(/\s+/g, ' ').trim().toLowerCase();
}

function buildCandidates(
  content: string,
  sources: ModelEssaySourceInput[],
  sourceType: ModelEssaySourceSpan['source_type']
): Array<ModelEssaySourceSpan & { order: number }> {
  const contentLower = content.toLowerCase();
  const candidates: Array<ModelEssaySourceSpan & { order: number }> = [];

  for (const source of sources) {
    const normalizedSource = normalizeForMatching(source.text);
    if (!normalizedSource) continue;

    let occurrenceIndex = 0;
    let searchIndex = 0;

    while (searchIndex < contentLower.length) {
      const foundIndex = contentLower.indexOf(normalizedSource, searchIndex);
      if (foundIndex === -1) break;

      const end = foundIndex + normalizedSource.length;
      candidates.push({
        start: foundIndex,
        end,
        text: content.slice(foundIndex, end),
        source_type: sourceType,
        source_id: source.id,
        occurrence_index: occurrenceIndex,
        order: candidates.length,
      });

      occurrenceIndex += 1;
      searchIndex = end;
    }
  }

  return candidates;
}

export function buildModelEssaySourceSpans(
  content: string,
  sources: ModelEssaySourceBuckets
): ModelEssaySourceSpan[] {
  const normalizedContent = content.replace(/\r\n/g, '\n');
  const candidates = [
    ...buildCandidates(normalizedContent, sources.historicalHighlights, 'historical_highlight'),
    ...buildCandidates(normalizedContent, sources.knowledgeBasePhrases, 'knowledge_base'),
  ];

  const sortedCandidates = [...candidates].sort((left, right) => {
    if (left.start !== right.start) {
      return left.start - right.start;
    }

    const leftLength = left.end - left.start;
    const rightLength = right.end - right.start;
    if (leftLength !== rightLength) {
      return rightLength - leftLength;
    }

    return left.order - right.order;
  });

  const accepted: ModelEssaySourceSpan[] = [];

  for (const candidate of sortedCandidates) {
    const overlaps = accepted.some(
      (span) => Math.max(span.start, candidate.start) < Math.min(span.end, candidate.end)
    );
    if (overlaps) continue;

    accepted.push({
      start: candidate.start,
      end: candidate.end,
      text: normalizedContent.slice(candidate.start, candidate.end),
      source_type: candidate.source_type,
      source_id: candidate.source_id,
      occurrence_index: accepted.filter(
        (span) =>
          span.source_type === candidate.source_type &&
          span.source_id === candidate.source_id &&
          span.text === candidate.text
      ).length,
    });
  }

  return accepted.sort((left, right) => left.start - right.start);
}

export function stripEssayMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .trim();
}
