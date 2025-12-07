import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Toaster } from '@/components/ui/toast';
import Link from 'next/link';
import { LayoutDashboard, Users, Activity, Settings, ArrowLeft } from 'lucide-react';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) {
    redirect('/dashboard');
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Admin Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col flex-shrink-0">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-xl font-bold">管理者パネル</h1>
          <p className="text-gray-400 text-sm mt-1">AI履歴書ビルダー</p>
        </div>

        <nav className="flex-1 p-4">
          <div className="space-y-1">
            <Link
              href="/admin"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
            >
              <LayoutDashboard className="w-5 h-5" />
              <span>ダッシュボード</span>
            </Link>
            <Link
              href="/admin/users"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
            >
              <Users className="w-5 h-5" />
              <span>ユーザー管理</span>
            </Link>
            <Link
              href="/admin/api-usage"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
            >
              <Activity className="w-5 h-5" />
              <span>API使用量</span>
            </Link>
            <Link
              href="/admin/settings"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
            >
              <Settings className="w-5 h-5" />
              <span>設定</span>
            </Link>
          </div>
        </nav>

        <div className="p-4 border-t border-gray-800">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>ユーザーサイトへ</span>
          </Link>
        </div>
      </aside>

      <main className="flex-1 overflow-hidden">
        {children}
      </main>
      <Toaster />
    </div>
  );
}
