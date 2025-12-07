import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { FileText, MessageSquare, Settings, Camera } from 'lucide-react';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get user's resumes
  const { data: resumes } = await supabase
    .from('resumes')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  // Get profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const hasResume = resumes && resumes.length > 0;
  const latestResume = resumes?.[0];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="p-6 border-b bg-white flex-shrink-0">
        <h1 className="text-2xl font-bold text-gray-900">
          こんにちは、{profile?.display_name || 'ユーザー'}さん
        </h1>
        <p className="text-gray-600 mt-1">
          AIと一緒に履歴書を作成しましょう
        </p>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/create"
              className="flex items-center gap-4 p-6 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              <div className="p-3 bg-blue-500 rounded-lg">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg">
                  {hasResume ? '履歴書を編集' : '履歴書を作成'}
                </h3>
                <p className="text-blue-100 text-sm">
                  AIとチャットしながら作成
                </p>
              </div>
            </Link>

            <Link
              href="/settings"
              className="flex items-center gap-4 p-6 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:from-purple-600 hover:to-blue-600 transition-colors"
            >
              <div className="p-3 bg-white/20 rounded-lg">
                <Camera className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg">証明写真を作成</h3>
                <p className="text-white/80 text-sm">
                  AIがスーツ合成
                </p>
              </div>
            </Link>

            <Link
              href="/settings"
              className="flex items-center gap-4 p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-300 transition-colors"
            >
              <div className="p-3 bg-gray-100 rounded-lg">
                <Settings className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900">基本情報を設定</h3>
                <p className="text-gray-500 text-sm">
                  氏名・住所・連絡先
                </p>
              </div>
            </Link>
          </div>

          {/* Resume Status */}
          {hasResume && latestResume && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">作成した履歴書</h2>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  latestResume.is_complete
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {latestResume.is_complete ? '完成' : '作成中'}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">氏名</span>
                  <p className="font-medium">{latestResume.full_name || '未入力'}</p>
                </div>
                <div>
                  <span className="text-gray-500">メール</span>
                  <p className="font-medium">{latestResume.email || '未入力'}</p>
                </div>
                <div>
                  <span className="text-gray-500">電話</span>
                  <p className="font-medium">{latestResume.phone || '未入力'}</p>
                </div>
                <div>
                  <span className="text-gray-500">更新日</span>
                  <p className="font-medium">
                    {new Date(latestResume.updated_at).toLocaleDateString('ja-JP')}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t flex gap-2">
                <Link
                  href="/create"
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
                >
                  <FileText className="w-4 h-4" />
                  編集する
                </Link>
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
            <h3 className="font-bold text-gray-900 mb-3">履歴書作成のコツ</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                具体的な数字や成果を入れると説得力がアップします
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                AIが質問するので、思いつくままに答えてください
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                自己PRはAIが一緒に作成してくれます
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
