'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  FileText,
  Bell,
  Settings,
  User,
  LogOut,
  ChevronRight,
  Shield,
  Menu,
  X,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

const mainNavItems: NavItem[] = [
  { href: '/dashboard', label: 'ホーム', icon: Home },
  { href: '/create', label: '履歴書', icon: FileText },
];

const subNavItems: NavItem[] = [
  { href: '/offers', label: 'スカウト', icon: Bell, badge: 0 },
  { href: '/settings', label: '設定', icon: Settings },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [userName, setUserName] = useState('ユーザー');

  useEffect(() => {
    const checkAdmin = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin, display_name')
          .eq('id', user.id)
          .single();

        if (profile) {
          setIsAdmin(profile.is_admin || false);
          setUserName(profile.display_name || 'ユーザー');
        }
      }
    };
    checkAdmin();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const handleLinkClick = () => {
    // Close sidebar on mobile after navigation
    if (onClose) {
      onClose();
    }
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="p-4 md:p-6 border-b border-gray-200 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2" onClick={handleLinkClick}>
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-gray-900">AI履歴書</span>
        </Link>
        {/* Close button for mobile */}
        <button
          onClick={onClose}
          className="md:hidden p-2 -mr-2 text-gray-500 hover:text-gray-700"
          aria-label="メニューを閉じる"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-1">
          {mainNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleLinkClick}
              className={`flex items-center gap-3 px-3 py-3 md:py-2.5 rounded-lg transition-colors ${
                isActive(item.href)
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 active:bg-gray-100'
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive(item.href) ? 'text-blue-600' : ''}`} />
              <span className="font-medium">{item.label}</span>
              {isActive(item.href) && (
                <ChevronRight className="w-4 h-4 ml-auto text-blue-600" />
              )}
            </Link>
          ))}
        </div>

        <div className="mt-8">
          <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            その他
          </p>
          <div className="space-y-1">
            {subNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleLinkClick}
                className={`flex items-center gap-3 px-3 py-3 md:py-2.5 rounded-lg transition-colors ${
                  isActive(item.href)
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 active:bg-gray-100'
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive(item.href) ? 'text-blue-600' : ''}`} />
                <span className="font-medium">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>

        {/* Admin Link */}
        {isAdmin && (
          <div className="mt-8">
            <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              管理者
            </p>
            <div className="space-y-1">
              <Link
                href="/admin"
                onClick={handleLinkClick}
                className="flex items-center gap-3 px-3 py-3 md:py-2.5 rounded-lg transition-colors text-gray-600 hover:bg-gray-50 hover:text-gray-900 active:bg-gray-100"
              >
                <Shield className="w-5 h-5" />
                <span className="font-medium">管理パネル</span>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isAdmin ? 'bg-purple-100' : 'bg-gray-200'}`}>
            {isAdmin ? (
              <Shield className="w-4 h-4 text-purple-600" />
            ) : (
              <User className="w-4 h-4 text-gray-600" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>
            <p className="text-xs text-gray-500 truncate">{isAdmin ? '管理者' : '無料プラン'}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-3 md:py-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900 active:bg-gray-100 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">ログアウト</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`md:hidden fixed inset-y-0 left-0 w-72 bg-white z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}

// Mobile Header Component
export function MobileHeader({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
      <Link href="/dashboard" className="flex items-center gap-2">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <FileText className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-gray-900">AI履歴書</span>
      </Link>
      <button
        onClick={onMenuClick}
        className="p-2 -mr-2 text-gray-600 hover:text-gray-900"
        aria-label="メニューを開く"
      >
        <Menu className="w-6 h-6" />
      </button>
    </header>
  );
}
