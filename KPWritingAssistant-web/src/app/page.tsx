import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import DashboardClient from '@/components/home/DashboardClient';

async function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center mb-6">
        <svg
          className="w-10 h-10 text-primary-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
          />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-neutral-800 mb-2">KP作文宝</h1>
      <p className="text-neutral-500 mb-2 text-base leading-relaxed max-w-xs">
        AI写作教练 · 智能字帖生成 · 个性化错题本
      </p>
      <p className="text-sm text-neutral-400 mb-8 max-w-xs">
        批改-积累-练习的闭环，帮助孩子提升写作能力和卷面分
      </p>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Link
          href="/login"
          className="w-full py-3 rounded-xl bg-primary-600 text-white font-medium text-center hover:bg-primary-700 transition-colors"
        >
          登录
        </Link>
        <Link
          href="/register"
          className="w-full py-3 rounded-xl border border-primary-600 text-primary-600 font-medium text-center hover:bg-primary-50 transition-colors"
        >
          注册
        </Link>
      </div>
    </div>
  );
}


export default async function Home() {
  let user = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // Supabase not configured - show landing page
  }

  if (!user) {
    return <LandingPage />;
  }

  return <DashboardClient />;
}
