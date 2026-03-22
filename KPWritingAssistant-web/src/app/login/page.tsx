import { Suspense } from 'react';
import LoginForm from '@/components/auth/LoginForm';

export const metadata = {
  title: 'KP作文宝 - 登录',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-neutral-200 p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-neutral-900">KP作文宝</h1>
          <p className="text-neutral-500 text-sm mt-1">AI写作教练，助力PET备考</p>
        </div>
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
