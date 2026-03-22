import RegisterForm from '@/components/auth/RegisterForm';

export const metadata = {
  title: 'KP作文宝 - 注册',
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-neutral-200 p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-neutral-900">创建账号</h1>
          <p className="text-neutral-500 text-sm mt-1">加入KP作文宝，开启AI写作提升之旅</p>
        </div>
        <RegisterForm />
      </div>
    </div>
  );
}
