'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface LogoutButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export default function LogoutButton({ className, children }: LogoutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className={className}
    >
      {loading ? '退出中...' : (children ?? '退出登录')}
    </button>
  );
}
