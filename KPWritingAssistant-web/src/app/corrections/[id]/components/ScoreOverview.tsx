'use client';

import Card from '@/components/ui/Card';

interface ScoringDimension {
  score: number;
  comment: string;
}

interface ScoringComments {
  content: ScoringDimension;
  communication: ScoringDimension;
  organisation: ScoringDimension;
  language: ScoringDimension;
}

interface ScoreOverviewProps {
  totalScore: number | null;
  scoringComments: ScoringComments | null | undefined;
}

const DIMENSIONS = [
  { key: 'content' as const, label: '内容', color: 'blue' },
  { key: 'communication' as const, label: '沟通', color: 'green' },
  { key: 'organisation' as const, label: '组织', color: 'purple' },
  { key: 'language' as const, label: '语言', color: 'orange' },
];

export default function ScoreOverview({ totalScore, scoringComments }: ScoreOverviewProps) {
  // Calculate total from individual scores if totalScore is null
  const calculateTotal = () => {
    if (totalScore !== null && totalScore !== undefined) return totalScore;
    if (!scoringComments) return null;
    const scores = [
      scoringComments.content?.score,
      scoringComments.communication?.score,
      scoringComments.organisation?.score,
      scoringComments.language?.score,
    ];
    if (scores.every((s) => s !== undefined && s !== null)) {
      return scores.reduce((sum, s) => sum + (s || 0), 0);
    }
    return null;
  };

  const displayTotal = calculateTotal();

  return (
    <section data-testid="score-overview">
      <Card>
        {/* Total Score Header */}
        <div className="text-center mb-5">
          <div className="text-5xl font-bold text-primary-600">
            {displayTotal ?? '--'}
            <span className="text-lg font-normal text-neutral-500 ml-1">分</span>
          </div>
          <div className="text-sm text-neutral-400 mt-1">满分20分</div>
        </div>

        {/* 4-Dimension Table */}
        <div className="border border-neutral-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500 w-16">维度</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-neutral-500 w-20">得分/5</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500">评语</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {DIMENSIONS.map(({ key, label, color }) => {
                const dimensionData = scoringComments?.[key];
                const score = dimensionData?.score;
                const comment = dimensionData?.comment;

                return (
                  <tr key={key} className="bg-white">
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          color === 'blue'
                            ? 'bg-blue-100 text-blue-700'
                            : color === 'green'
                            ? 'bg-green-100 text-green-700'
                            : color === 'purple'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-orange-100 text-orange-700'
                        }`}
                      >
                        {label}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="font-semibold text-neutral-700">
                        {score !== null && score !== undefined ? score : '--'}
                      </span>
                      <span className="text-neutral-400 text-xs">/5</span>
                    </td>
                    <td className="px-3 py-3 text-neutral-600 text-xs leading-relaxed">
                      {comment || '暂无评语'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Fallback for old data without scoring_comments */}
        {!scoringComments && (
          <div className="mt-4 pt-4 border-t border-neutral-100">
            <p className="text-xs text-neutral-400 text-center">
              详细维度评分将在下次批改后显示
            </p>
          </div>
        )}
      </Card>
    </section>
  );
}
