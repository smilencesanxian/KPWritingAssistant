'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function RegisterForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    if (password.length < 8) {
      setError('密码长度至少为8位');
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const skipVerification = process.env.NEXT_PUBLIC_SKIP_EMAIL_VERIFICATION === 'true';

    if (skipVerification) {
      // Beta 模式：注册后直接登录，跳过邮箱验证
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        handleAuthError(signUpError);
        return;
      }

      // 自动登录
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError('注册成功但自动登录失败，请手动登录');
        setLoading(false);
        router.push('/login');
        return;
      }

      router.push('/');
      router.refresh();
      return;
    }

    // 正式模式：需要邮箱验证
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${siteUrl}/login`,
      },
    });

    if (error) {
      handleAuthError(error);
      return;
    }

    router.push('/login?registered=1');
  }

  function handleAuthError(error: { message: string; code?: string }) {
    const errorMsg = error.message.toLowerCase();
    if (
      errorMsg.includes('already registered') ||
      errorMsg.includes('already been registered') ||
      errorMsg.includes('user already registered') ||
      errorMsg.includes('email already') ||
      errorMsg.includes('already exists') ||
      error.code === 'user_already_exists'
    ) {
      setError('该邮箱已注册，请直接登录');
    } else if (errorMsg.includes('invalid email')) {
      setError('邮箱格式不正确');
    } else if (errorMsg.includes('password')) {
      setError('密码不符合要求，请确保至少8位');
    } else {
      setError('注册失败：' + error.message);
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1">
          邮箱
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="your@email.com"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-1">
          密码
        </label>
        <input
          id="password"
          type="password"
          required
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="至少8位"
        />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700 mb-1">
          确认密码
        </label>
        <input
          id="confirmPassword"
          type="password"
          required
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="再次输入密码"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 px-4 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? '注册中...' : '注册'}
      </button>

      <p className="text-center text-sm text-neutral-600">
        已有账号？{' '}
        <Link href="/login" className="text-primary-600 hover:text-primary-700 font-medium">
          去登录
        </Link>
      </p>
    </form>
  );
}
