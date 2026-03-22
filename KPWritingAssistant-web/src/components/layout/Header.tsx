interface HeaderProps {
  userEmail?: string | null;
}

export default function Header({ userEmail }: HeaderProps) {
  const initial = userEmail ? userEmail[0].toUpperCase() : '?';

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-neutral-200">
      <div className="flex items-center justify-between h-14 px-4">
        <span className="text-lg font-bold text-primary-600">KP作文宝</span>
        <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-sm font-medium">
          {initial}
        </div>
      </div>
    </header>
  );
}
