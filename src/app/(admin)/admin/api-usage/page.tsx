'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, DollarSign, Zap, Calendar } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface ApiUsage {
  id: string;
  user_id: string | null;
  endpoint: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  cost_usd: number;
  created_at: string;
}

interface DailyStats {
  date: string;
  requests: number;
  tokens: number;
  cost: number;
}

export default function AdminApiUsagePage() {
  const [usage, setUsage] = useState<ApiUsage[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'7' | '30' | 'all'>('30');

  useEffect(() => {
    fetchUsage();
  }, []);

  const fetchUsage = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('api_usage')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setUsage(data || []);

      const daily: Record<string, DailyStats> = {};
      (data || []).forEach(u => {
        const date = new Date(u.created_at).toISOString().split('T')[0];
        if (!daily[date]) {
          daily[date] = { date, requests: 0, tokens: 0, cost: 0 };
        }
        daily[date].requests++;
        daily[date].tokens += u.total_tokens || 0;
        daily[date].cost += parseFloat(String(u.cost_usd)) || 0;
      });

      setDailyStats(Object.values(daily).sort((a, b) => b.date.localeCompare(a.date)));
    } catch (error) {
      console.error('Error fetching usage:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredData = () => {
    const now = new Date();
    let cutoff: Date;

    switch (selectedPeriod) {
      case '7':
        cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30':
        cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        cutoff = new Date(0);
    }

    return usage.filter(u => new Date(u.created_at) >= cutoff);
  };

  const filteredUsage = getFilteredData();
  const totalRequests = filteredUsage.length;
  const totalTokens = filteredUsage.reduce((sum, u) => sum + (u.total_tokens || 0), 0);
  const totalCost = filteredUsage.reduce((sum, u) => sum + (parseFloat(String(u.cost_usd)) || 0), 0);

  const formatCurrency = (usd: number) => {
    const jpy = usd * 150;
    return `¥${jpy.toFixed(0)}`;
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        <div className="p-6 border-b bg-white flex-shrink-0">
          <h1 className="text-2xl font-bold text-gray-900">API使用量</h1>
          <p className="text-gray-600 mt-1">読み込み中...</p>
        </div>
        <div className="flex-1 overflow-auto p-6">
          <div className="animate-pulse space-y-6">
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="p-6 border-b bg-white flex-shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">API使用量</h1>
          <p className="text-gray-600 mt-1">OpenAI APIの使用状況を確認</p>
        </div>
        <div className="flex gap-2">
          {(['7', '30', 'all'] as const).map(period => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedPeriod === period
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {period === '7' ? '7日間' : period === '30' ? '30日間' : '全期間'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">リクエスト数</p>
                  <p className="text-3xl font-bold text-gray-900">{totalRequests.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Activity className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">総トークン数</p>
                  <p className="text-3xl font-bold text-gray-900">{totalTokens.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Zap className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">費用 (USD)</p>
                  <p className="text-3xl font-bold text-gray-900">${totalCost.toFixed(4)}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">費用 (JPY)</p>
                  <p className="text-3xl font-bold text-gray-900">{formatCurrency(totalCost)}</p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-full">
                  <DollarSign className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              日別使用量
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dailyStats.length > 0 ? (
              <div className="space-y-3">
                {dailyStats.slice(0, selectedPeriod === '7' ? 7 : selectedPeriod === '30' ? 30 : dailyStats.length).map((day) => (
                  <div key={day.date} className="flex items-center gap-4">
                    <span className="text-sm text-gray-500 w-28">
                      {new Date(day.date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
                    </span>
                    <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full flex items-center justify-end pr-2"
                        style={{
                          width: `${Math.max(5, Math.min(100, (day.requests / Math.max(...dailyStats.map(d => d.requests), 1)) * 100))}%`,
                        }}
                      >
                        {day.requests > 0 && (
                          <span className="text-xs text-white font-medium">{day.requests}</span>
                        )}
                      </div>
                    </div>
                    <span className="text-sm text-gray-600 w-24 text-right">
                      {day.tokens.toLocaleString()} tokens
                    </span>
                    <span className="text-sm text-green-600 w-20 text-right">
                      ${day.cost.toFixed(4)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                データがありません
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>直近のリクエスト</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">日時</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">エンドポイント</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">モデル</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">入力</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">出力</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">合計</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">費用</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsage.slice(0, 20).map((u) => (
                    <tr key={u.id} className="border-b last:border-b-0 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(u.created_at).toLocaleString('ja-JP', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4 text-sm font-mono text-gray-600">
                        {u.endpoint}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                          {u.model}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-right text-gray-600">
                        {u.input_tokens?.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-right text-gray-600">
                        {u.output_tokens?.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-right font-medium">
                        {u.total_tokens?.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-right text-green-600">
                        ${parseFloat(String(u.cost_usd))?.toFixed(6)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredUsage.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  データがありません
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
