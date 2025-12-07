'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, Activity, DollarSign, TrendingUp, Calendar } from 'lucide-react';

interface Stats {
  userStats: {
    totalUsers: number;
    regularUsers: number;
    companyUsers: number;
    adminUsers: number;
    newUsers7Days: number;
    newUsers30Days: number;
  };
  apiStats: {
    totalRequests: number;
    totalTokens: number;
    totalCostUsd: number;
    todayRequests: number;
    todayTokens: number;
    monthRequests: number;
    monthTokens: number;
    monthCostUsd: number;
  };
  dailyUsage: Array<{
    date: string;
    requests: number;
    tokens: number;
    cost: number;
  }>;
  recentUsers: Array<{
    id: string;
    role: string;
    createdAt: string;
  }>;
  resumeCount: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatCurrency = (usd: number) => {
    const jpy = usd * 150;
    return `¥${jpy.toFixed(0)}`;
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/stats');
        if (!response.ok) {
          throw new Error('Failed to fetch stats');
        }
        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'エラーが発生しました');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        <div className="p-6 border-b bg-white flex-shrink-0">
          <h1 className="text-2xl font-bold text-gray-900">管理者ダッシュボード</h1>
          <p className="text-gray-600 mt-1">読み込み中...</p>
        </div>
        <div className="flex-1 overflow-auto p-6">
          <div className="animate-pulse space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        <div className="p-6 border-b bg-white flex-shrink-0">
          <h1 className="text-2xl font-bold text-gray-900">管理者ダッシュボード</h1>
        </div>
        <div className="flex-1 overflow-auto p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="p-6 border-b bg-white flex-shrink-0">
        <h1 className="text-2xl font-bold text-gray-900">管理者ダッシュボード</h1>
        <p className="text-gray-600 mt-1">システム全体の統計情報を確認できます</p>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">総ユーザー数</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.userStats.totalUsers}</p>
                  <p className="text-sm text-green-600 mt-1">
                    +{stats.userStats.newUsers7Days} (7日間)
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">作成された履歴書</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.resumeCount}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">今月のAPIリクエスト</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.apiStats.monthRequests}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    今日: {stats.apiStats.todayRequests}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Activity className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">今月のAPI費用</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatCurrency(stats.apiStats.monthCostUsd)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    ${stats.apiStats.monthCostUsd.toFixed(4)} USD
                  </p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-full">
                  <DollarSign className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                API使用量 (過去7日)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.dailyUsage.slice(-7).map((day) => (
                  <div key={day.date} className="flex items-center gap-4">
                    <span className="text-sm text-gray-500 w-24">
                      {new Date(day.date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
                    </span>
                    <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full"
                        style={{
                          width: `${Math.min(100, (day.requests / Math.max(...stats.dailyUsage.map(d => d.requests), 1)) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium w-16 text-right">
                      {day.requests}回
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                ユーザー内訳
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">一般ユーザー</span>
                  <span className="font-bold">{stats.userStats.regularUsers}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">企業ユーザー</span>
                  <span className="font-bold">{stats.userStats.companyUsers}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">管理者</span>
                  <span className="font-bold">{stats.userStats.adminUsers}</span>
                </div>
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">過去30日の新規登録</span>
                    <span className="font-bold text-green-600">+{stats.userStats.newUsers30Days}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              最近のユーザー登録
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">ID</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">タイプ</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">登録日</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentUsers.map((user) => (
                    <tr key={user.id} className="border-b last:border-b-0">
                      <td className="py-3 px-4 text-sm font-mono text-gray-600">
                        {user.id.slice(0, 8)}...
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          user.role === 'company'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {user.role === 'company' ? '企業' : '一般'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(user.createdAt).toLocaleDateString('ja-JP', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
          <h3 className="font-bold text-gray-900 mb-4">API使用量サマリー</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">総リクエスト数</p>
              <p className="text-xl font-bold">{stats.apiStats.totalRequests.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">総トークン数</p>
              <p className="text-xl font-bold">{stats.apiStats.totalTokens.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">累計費用 (USD)</p>
              <p className="text-xl font-bold">${stats.apiStats.totalCostUsd.toFixed(4)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">累計費用 (JPY)</p>
              <p className="text-xl font-bold">{formatCurrency(stats.apiStats.totalCostUsd)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
