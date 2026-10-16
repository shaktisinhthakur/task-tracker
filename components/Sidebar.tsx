'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, CheckSquare, Key, LogOut, Sparkles } from 'lucide-react';
import clsx from 'clsx';

export default function Sidebar() {
  const pathname = usePathname();

  const links = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Employees', href: '/dashboard/employees', icon: Users },
    { name: 'Tasks', href: '/dashboard/tasks', icon: CheckSquare },
    { name: 'AI Assistant', href: '/dashboard/ai-assistant', icon: Sparkles, isAi: true },
    { name: 'Credentials', href: '/dashboard/credentials', icon: Key },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen flex flex-col transition-all duration-300 shadow-2xl z-20">
      <div className="p-6">
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">TaskTracker</h2>
      </div>
      <nav className="flex-1 px-4 space-y-2">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={clsx(
                'flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 relative group',
                isActive
                  ? 'bg-blue-600/20 text-blue-400 shadow-[0_0_15px_rgba(37,99,235,0.2)]'
                  : 'hover:bg-slate-800 text-slate-300 hover:text-white',
                link.isAi && !isActive && 'hover:text-purple-300'
              )}
            >
              <div className="flex items-center space-x-3">
                <Icon className={clsx('w-5 h-5', link.isAi && 'text-purple-400')} />
                <span className="font-medium">{link.name}</span>
              </div>
              {link.isAi && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-purple-300 border border-purple-500/30">
                  RAG
                </span>
              )}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-slate-800">
        <button
          className="w-full flex items-center space-x-3 px-4 py-3 text-slate-300 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all duration-300"
          onClick={async () => {
            await fetch('/api/auth/logout', { method: 'POST' });
            window.location.href = '/login';
          }}
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
