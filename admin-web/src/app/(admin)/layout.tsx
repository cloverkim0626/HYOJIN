import Link from 'next/link';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-[#07061f] text-gray-200 font-sans">
      <aside className="w-64 bg-[#0a0a2a] border-r border-[#1e1c50] flex flex-col">
        <div className="p-6 text-2xl font-bold border-b border-[#1e1c50] text-[#7a6cf9] flex items-center gap-2">
          <span className="text-3xl">🪐</span>
          Explore
        </div>
        <nav className="flex-1 p-4 space-y-2 mt-4">
          <Link href="/dashboard" className="block px-4 py-3 rounded-lg hover:bg-[#1a1740] transition-colors font-medium">Dashboard</Link>
          <Link href="/passages" className="block px-4 py-3 rounded-lg bg-[#2a266b] text-white shadow-lg font-medium border border-[#4a41c5]">지문 창고</Link>
          <Link href="/questions" className="block px-4 py-3 rounded-lg hover:bg-[#1a1740] transition-colors font-medium">생성된 문제지</Link>
          <Link href="/students" className="block px-4 py-3 rounded-lg hover:bg-[#1a1740] transition-colors font-medium">학생 목록</Link>
        </nav>
      </aside>
      <main className="flex-1 overflow-auto p-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#110e30] to-[#07061f]">
        {children}
      </main>
    </div>
  );
}
