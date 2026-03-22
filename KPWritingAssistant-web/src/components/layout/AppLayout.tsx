'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';
import BottomNav from './BottomNav';

const AUTH_PATHS = ['/login', '/register'];

interface AppLayoutProps {
  children: React.ReactNode;
  userEmail?: string | null;
}

export default function AppLayout({ children, userEmail }: AppLayoutProps) {
  const pathname = usePathname();
  const isAuthPage = AUTH_PATHS.includes(pathname);

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <>
      <Header userEmail={userEmail} />
      <main className="flex-1" style={{ paddingBottom: 'calc(4rem + max(env(safe-area-inset-bottom, 0px), 16px))' }}>{children}</main>
      <BottomNav />
    </>
  );
}
