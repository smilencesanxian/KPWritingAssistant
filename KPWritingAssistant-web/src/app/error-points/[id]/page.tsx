import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getErrorPointById } from '@/lib/db/error-points';
import { getErrorExplanation } from '@/lib/knowledge/error-explanations';
import Card from '@/components/ui/Card';
import ErrorInstanceItem from '@/components/error/ErrorInstanceItem';
import PracticeQuestion from '@/components/error/PracticeQuestion';
import ErrorPointDetailActions from '@/components/error/ErrorPointDetailActions';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ErrorPointDetailPage({ params }: PageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const detail = await getErrorPointById(id, user.id);
  if (!detail) notFound();

  const { instances, ...errorPoint } = detail;
  const explanation = getErrorExplanation(errorPoint.error_type);

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}月${day}日`;
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-neutral-800">{errorPoint.error_type_label}</h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
              出现 {errorPoint.occurrence_count} 次
            </span>
            <span className="text-xs text-neutral-400">
              最近：{formatDate(errorPoint.last_seen_at)}
            </span>
          </div>
        </div>
        <ErrorPointDetailActions />
      </div>

      {/* Knowledge card */}
      <div className="bg-blue-50 rounded-2xl p-4" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <h2 className="text-sm font-semibold text-blue-800">知识点讲解</h2>
        </div>
        <p className="text-sm text-blue-900 leading-relaxed mb-4">{explanation.rule}</p>
        <div className="space-y-2.5">
          {explanation.examples.map((ex, i) => (
            <div key={i} className="bg-white rounded-xl p-3">
              <p className="text-xs text-red-500 leading-relaxed mb-1">
                <span className="font-medium mr-1">✗</span>{ex.wrong}
              </p>
              <p className="text-xs text-green-700 leading-relaxed">
                <span className="font-medium mr-1">✓</span>{ex.correct}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Error records */}
      <Card>
        <h2 className="text-sm font-semibold text-neutral-700 mb-1">你的错误记录</h2>
        {instances.length === 0 ? (
          <p className="text-sm text-neutral-400 py-4 text-center">暂无错误记录</p>
        ) : (
          <div>
            {instances.map((instance) => (
              <ErrorInstanceItem key={instance.id} instance={instance} />
            ))}
          </div>
        )}
      </Card>

      {/* Practice questions */}
      <Card>
        <h2 className="text-sm font-semibold text-neutral-700 mb-1">专项练习题</h2>
        <p className="text-xs text-neutral-400 mb-3">点击「查看答案」检验自己</p>
        <div>
          {explanation.practices.map((practice, i) => (
            <PracticeQuestion key={i} practice={practice} index={i} />
          ))}
        </div>
      </Card>

      {/* Bottom action */}
      <ErrorPointDetailActions showPracticeButton />
    </div>
  );
}
