import KnowledgeBaseContent from '@/components/writing-guide/KnowledgeBaseContent';

export const metadata = {
  title: '写作知识库 - PET作文宝',
  description: '按作文类型整理的知识点库，包含系统推荐和用户自定义内容',
};

export default function WritingGuidePage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-24">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-neutral-900">写作知识库</h1>
        <p className="text-sm text-neutral-500 mt-1">
          按作文类型整理的知识点库，积累好词好句
        </p>
      </div>

      {/* Knowledge Base Content - Client Component */}
      <KnowledgeBaseContent />
    </div>
  );
}
