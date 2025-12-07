import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { FileText, MessageSquare, Settings, Camera, ChevronRight } from 'lucide-react';

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
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="p-4 md:p-6 border-b bg-white flex-shrink-0">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">
          こんにちは、{profile?.display_name || 'ユーザー'}さん
        </h1>
        <p className="text-gray-600 text-sm md:text-base mt-1">
          AIと一緒に履歴書を作成しましょう
        </p>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6">
        <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
          {/* Quick Actions - Main CTA */}
          <Link
            href="/create"
            className="flex items-center gap-4 p-4 md:p-6 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-colors"
          >
            <div className="p-2.5 md:p-3 bg-blue-500 rounded-lg flex-shrink-0">
              <MessageSquare className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-base md:text-lg">
                {hasResume ? '履歴書を編集' : '履歴書を作成'}
              </h3>
              <p className="text-blue-100 text-sm">
                AIとチャットしながら作成
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-blue-200 flex-shrink-0" />
          </Link>

          {/* Secondary Actions */}
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <Link
              href="/settings"
              className="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4 p-4 md:p-6 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:from-purple-600 hover:to-blue-600 active:from-purple-700 active:to-blue-700 transition-colors"
            >
              <div className="p-2 md:p-3 bg-white/20 rounded-lg flex-shrink-0">
                <Camera className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-sm md:text-lg leading-tight">証明写真を作成</h3>
                <p className="text-white/80 text-xs md:text-sm mt-0.5">
                  AIがスーツ合成
                </p>
              </div>
            </Link>

            <Link
              href="/settings"
              className="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4 p-4 md:p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-300 active:bg-gray-50 transition-colors"
            >
              <div className="p-2 md:p-3 bg-gray-100 rounded-lg flex-shrink-0">
                <Settings className="w-5 h-5 md:w-6 md:h-6 text-gray-600" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-sm md:text-lg text-gray-900 leading-tight">基本情報を設定</h3>
                <p className="text-gray-500 text-xs md:text-sm mt-0.5">
                  氏名・住所・連絡先
                </p>
              </div>
            </Link>
          </div>

          {/* Resume Status */}
          {hasResume && latestResume && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base md:text-lg font-bold text-gray-900">作成した履歴書</h2>
                <span className={`px-2.5 md:px-3 py-1 rounded-full text-xs md:text-sm ${
                  latestResume.is_complete
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {latestResume.is_complete ? '完成' : '作成中'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 md:gap-4 text-sm">
                <div>
                  <span className="text-gray-500 text-xs md:text-sm">氏名</span>
                  <p className="font-medium text-sm md:text-base truncate">{latestResume.full_name || '未入力'}</p>
                </div>
                <div>
                  <span className="text-gray-500 text-xs md:text-sm">メール</span>
                  <p className="font-medium text-sm md:text-base truncate">{latestResume.email || '未入力'}</p>
                </div>
                <div>
                  <span className="text-gray-500 text-xs md:text-sm">電話</span>
                  <p className="font-medium text-sm md:text-base">{latestResume.phone || '未入力'}</p>
                </div>
                <div>
                  <span className="text-gray-500 text-xs md:text-sm">更新日</span>
                  <p className="font-medium text-sm md:text-base">
                    {new Date(latestResume.updated_at).toLocaleDateString('ja-JP')}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t">
                <Link
                  href="/create"
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 active:text-blue-800 text-sm font-medium py-1"
                >
                  <FileText className="w-4 h-4" />
                  編集する
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 md:p-6">
            <h3 className="font-bold text-gray-900 text-sm md:text-base mb-3">履歴書作成のコツ</h3>
            <ul className="space-y-2 text-xs md:text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 flex-shrink-0">•</span>
                <span>具体的な数字や成果を入れると説得力がアップします</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 flex-shrink-0">•</span>
                <span>AIが質問するので、思いつくままに答えてください</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 flex-shrink-0">•</span>
                <span>自己PRはAIが一緒に作成してくれます</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
