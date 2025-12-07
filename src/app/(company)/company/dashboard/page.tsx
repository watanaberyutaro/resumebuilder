import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Send, CheckCircle, CreditCard } from 'lucide-react';
import Link from 'next/link';

export default async function CompanyDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Get company info
  const { data: company } = await supabase
    .from('companies')
    .select('*')
    .eq('user_id', user?.id)
    .single();

  // Get scout stats
  const { count: totalScouts } = await supabase
    .from('offers')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', company?.id);

  const { count: pendingScouts } = await supabase
    .from('offers')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', company?.id)
    .eq('status', 'pending');

  const { count: interestedScouts } = await supabase
    .from('offers')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', company?.id)
    .eq('status', 'interested');

  const { count: hiredCount } = await supabase
    .from('offers')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', company?.id)
    .eq('status', 'hired');

  // Get pending billing
  const { data: pendingBilling } = await supabase
    .from('billing_events')
    .select('amount_jpy')
    .eq('company_id', company?.id)
    .eq('is_paid', false);

  const pendingAmount = pendingBilling?.reduce((sum, b) => sum + b.amount_jpy, 0) || 0;

  // Get recent offers
  const { data: recentOffers } = await supabase
    .from('offers')
    .select(`
      *,
      profiles:recipient_user_id (
        display_name
      ),
      resumes:recipient_resume_id (
        desired_job_category
      )
    `)
    .eq('company_id', company?.id)
    .order('created_at', { ascending: false })
    .limit(5);

  const getStatusLabel = (status: string) => {
    const labels: Record<string, { text: string; color: string }> = {
      pending: { text: '検討中', color: 'text-yellow-600 bg-yellow-100' },
      interested: { text: '興味あり', color: 'text-green-600 bg-green-100' },
      declined: { text: '辞退', color: 'text-gray-600 bg-gray-100' },
      accepted: { text: '承諾', color: 'text-blue-600 bg-blue-100' },
      hired: { text: '採用', color: 'text-purple-600 bg-purple-100' },
    };
    return labels[status] || { text: status, color: 'text-gray-600 bg-gray-100' };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{company?.company_name || '企業'}のダッシュボード</h1>
          <p className="text-gray-500">スカウト活動の概要</p>
        </div>
        <Link
          href="/company/candidates"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          候補者を検索
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">送信済みスカウト</p>
                <p className="text-2xl font-bold">{totalScouts || 0}</p>
              </div>
              <Send className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">返信待ち</p>
                <p className="text-2xl font-bold">{pendingScouts || 0}</p>
              </div>
              <Users className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">興味あり回答</p>
                <p className="text-2xl font-bold">{interestedScouts || 0}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">未払い請求</p>
                <p className="text-2xl font-bold">¥{pendingAmount.toLocaleString()}</p>
              </div>
              <CreditCard className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>最近のスカウト</CardTitle>
        </CardHeader>
        <CardContent>
          {recentOffers && recentOffers.length > 0 ? (
            <div className="space-y-4">
              {recentOffers.map((offer) => {
                const status = getStatusLabel(offer.status);
                return (
                  <div
                    key={offer.id}
                    className="flex items-center justify-between py-3 border-b last:border-0"
                  >
                    <div>
                      <p className="font-medium">{offer.subject}</p>
                      <p className="text-sm text-gray-500">
                        候補者ID: {offer.recipient_user_id.substring(0, 8)}...
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${status.color}`}>
                        {status.text}
                      </span>
                      <span className="text-sm text-gray-400">
                        {new Date(offer.created_at).toLocaleDateString('ja-JP')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>まだスカウトを送信していません</p>
              <Link
                href="/company/candidates"
                className="text-blue-600 hover:underline mt-2 inline-block"
              >
                候補者を検索する
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>採用実績</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <p className="text-4xl font-bold text-green-600">{hiredCount || 0}</p>
              <p className="text-gray-500">採用決定数</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>成功報酬（1人あたり）</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <p className="text-4xl font-bold">¥10,000</p>
              <p className="text-gray-500">採用決定時のみ発生</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
