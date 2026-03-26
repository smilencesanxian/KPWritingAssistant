'use client';

import Card from '@/components/ui/Card';

interface StructuredSuggestion {
  icon: string;
  title: string;
  detail: string;
}

interface ImprovementSuggestionsProps {
  structuredSuggestions: StructuredSuggestion[] | null | undefined;
  fallbackSuggestions: string | null;
}

export default function ImprovementSuggestions({
  structuredSuggestions,
  fallbackSuggestions,
}: ImprovementSuggestionsProps) {
  // Check if we have structured suggestions
  const hasStructuredSuggestions =
    structuredSuggestions && structuredSuggestions.length > 0;

  // Check if we have fallback text
  const hasFallback = fallbackSuggestions && fallbackSuggestions.trim().length > 0;

  if (!hasStructuredSuggestions && !hasFallback) {
    return null;
  }

  return (
    <section data-testid="improvement-suggestions">
      <Card>
        <h3 className="text-sm font-semibold text-neutral-700 mb-4">改进建议</h3>

        {hasStructuredSuggestions ? (
          // Structured suggestions with icons
          <div className="space-y-4">
            {structuredSuggestions!.map((suggestion, index) => (
              <div key={index} className="flex gap-3">
                {/* Icon */}
                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-primary-50 rounded-lg">
                  <span className="text-lg">{suggestion.icon || '💡'}</span>
                </div>
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-neutral-800 mb-1">
                    {suggestion.title}
                  </h4>
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    {suggestion.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Fallback: plain text with whitespace preservation
          <div className="text-sm text-neutral-600 leading-relaxed whitespace-pre-line">
            {fallbackSuggestions}
          </div>
        )}
      </Card>
    </section>
  );
}
