'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import Toggle from '@/components/ui/Toggle';
import SettingItem from '@/components/profile/SettingItem';

export default function ProfilePage() {
  const router = useRouter();
  const showToast = useToast();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [reminderEnabled] = useState(false);
  const [logoutPending, setLogoutPending] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserEmail(user?.email ?? null);
    });
  }, []);

  const avatarLetter = userEmail ? userEmail[0].toUpperCase() : '?';

  function handleReminderToggle() {
    showToast('即将推出', 'warning');
  }

  function handleLogoutClick() {
    if (logoutPending) {
      // Second click = confirm
      performLogout();
    } else {
      setLogoutPending(true);
      showToast('再次点击确认退出登录', 'warning');
      setTimeout(() => setLogoutPending(false), 3000);
    }
  }

  async function performLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24">
      {/* User Info */}
      <div className="flex flex-col items-center py-6 mb-6">
        <div className="w-20 h-20 rounded-full bg-primary-500 flex items-center justify-center mb-3">
          <span className="text-3xl font-bold text-white">{avatarLetter}</span>
        </div>
        <p className="text-sm text-neutral-500">{userEmail ?? '未登录'}</p>
      </div>

      {/* Settings List */}
      <div className="bg-white rounded-2xl overflow-hidden mb-6" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        {/* Weekly Reminder */}
        <div className="border-b border-neutral-100 last:border-0">
          <SettingItem
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
              </svg>
            }
            label="每周错题提醒"
            rightContent={
              <Toggle
                checked={reminderEnabled}
                onChange={() => {
                  handleReminderToggle();
                }}
              />
            }
            clickable={false}
          />
        </div>

        {/* Font Management */}
        <div className="border-b border-neutral-100 last:border-0">
          <SettingItem
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
              </svg>
            }
            label="字体管理"
            rightContent={<span className="text-xs text-neutral-400">当前：Gochi Hand</span>}
            clickable={false}
          />
        </div>

        {/* Feedback */}
        <div className="border-b border-neutral-100 last:border-0">
          <SettingItem
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
              </svg>
            }
            label="意见反馈"
            rightContent={<span className="text-xs text-neutral-400">feedback@kpwriting.com</span>}
            clickable={false}
          />
        </div>

        {/* About */}
        <div className="last:border-0">
          <SettingItem
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
              </svg>
            }
            label="关于我们"
            rightContent={<span className="text-xs text-neutral-400">v1.0.0</span>}
            clickable={false}
          />
        </div>
      </div>

      {/* Logout Button */}
      <button
        onClick={handleLogoutClick}
        className="w-full py-3 rounded-2xl border border-red-200 text-red-500 text-sm font-medium hover:bg-red-50 active:bg-red-100 transition-colors"
      >
        {logoutPending ? '再次点击确认退出' : '退出登录'}
      </button>
    </div>
  );
}
