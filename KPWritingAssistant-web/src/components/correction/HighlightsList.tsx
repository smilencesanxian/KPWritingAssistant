import type { Highlight } from '@/types/database';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';

const typeLabel: Record<string, string> = {
  vocabulary: '词汇',
  phrase: '短语',
  sentence: '句子',
};

const typeColor: Record<string, 'blue' | 'green' | 'orange'> = {
  vocabulary: 'blue',
  phrase: 'green',
  sentence: 'orange',
};

interface HighlightsListProps {
  highlights: Highlight[];
}

export default function HighlightsList({ highlights }: HighlightsListProps) {
  if (!highlights.length) return null;

  return (
    <Card>
      <h3 className="text-sm font-semibold text-neutral-700 mb-3">本次亮点</h3>
      <ul className="space-y-2">
        {highlights.map((h) => (
          <li key={h.id} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Badge color={typeColor[h.type] ?? 'gray'}>{typeLabel[h.type] ?? h.type}</Badge>
              <span className="text-sm text-neutral-700 truncate">{h.text}</span>
            </div>
            <span className="text-xs text-neutral-400 whitespace-nowrap flex-shrink-0">已加入亮点库</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
