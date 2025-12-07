'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Settings, Key, Database, Bell, Shield, CheckCircle } from 'lucide-react';
import { toast } from '@/components/ui/toast';

export default function AdminSettingsPage() {
  const [apiKey, setApiKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      toast.error('APIキーを入力してください');
      return;
    }

    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('APIキーを更新しました（デモ）');
      setApiKey('');
    } catch {
      toast.error('保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="p-6 border-b bg-white flex-shrink-0">
        <h1 className="text-2xl font-bold text-gray-900">設定</h1>
        <p className="text-gray-600 mt-1">システム設定を管理</p>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-6 max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                API設定
              </CardTitle>
              <CardDescription>
                OpenAI APIキーの設定
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  OpenAI APIキー
                </label>
                <div className="flex gap-3">
                  <Input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="flex-1"
                  />
                  <Button onClick={handleSaveApiKey} isLoading={isSaving}>
                    保存
                  </Button>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  現在のAPIキー: sk-...{process.env.NEXT_PUBLIC_OPENAI_API_KEY?.slice(-4) || '****'}
                </p>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">APIキーの取得方法</h4>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>OpenAI Platformにアクセス</li>
                  <li>API keysページへ移動</li>
                  <li>Create new secret keyをクリック</li>
                  <li>生成されたキーをコピー</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                システム状態
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>データベース接続</span>
                  </div>
                  <span className="text-green-600 font-medium">正常</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>認証サービス</span>
                  </div>
                  <span className="text-green-600 font-medium">正常</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>OpenAI API</span>
                  </div>
                  <span className="text-green-600 font-medium">接続済み</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                通知設定
              </CardTitle>
              <CardDescription>
                管理者への通知設定
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer">
                  <span>新規ユーザー登録時に通知</span>
                  <input type="checkbox" className="w-5 h-5 text-blue-600" defaultChecked />
                </label>
                <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer">
                  <span>API使用量が上限に近づいたら通知</span>
                  <input type="checkbox" className="w-5 h-5 text-blue-600" defaultChecked />
                </label>
                <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer">
                  <span>エラー発生時に通知</span>
                  <input type="checkbox" className="w-5 h-5 text-blue-600" defaultChecked />
                </label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                セキュリティ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-medium text-yellow-900 mb-2">セキュリティのヒント</h4>
                  <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                    <li>APIキーは定期的に更新してください</li>
                    <li>管理者アカウントは最小限に保ってください</li>
                    <li>定期的にログを確認してください</li>
                  </ul>
                </div>

                <Button variant="outline" className="w-full">
                  セキュリティログを表示
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                アプリ情報
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">バージョン</span>
                  <span className="font-mono">1.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Next.js</span>
                  <span className="font-mono">14.2.x</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">AI Model</span>
                  <span className="font-mono">gpt-4o-mini</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Database</span>
                  <span className="font-mono">Supabase</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
