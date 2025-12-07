import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get user stats
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, role, is_admin, created_at');

    if (profilesError) {
      throw profilesError;
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const userStats = {
      totalUsers: profiles?.length || 0,
      regularUsers: profiles?.filter(p => p.role === 'user').length || 0,
      companyUsers: profiles?.filter(p => p.role === 'company').length || 0,
      adminUsers: profiles?.filter(p => p.is_admin).length || 0,
      newUsers7Days: profiles?.filter(p => new Date(p.created_at) >= sevenDaysAgo).length || 0,
      newUsers30Days: profiles?.filter(p => new Date(p.created_at) >= thirtyDaysAgo).length || 0,
    };

    // Get API usage stats
    const { data: apiUsage, error: apiError } = await supabase
      .from('api_usage')
      .select('*')
      .order('created_at', { ascending: false });

    if (apiError && apiError.code !== 'PGRST116') {
      console.error('API usage error:', apiError);
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const apiStats = {
      totalRequests: apiUsage?.length || 0,
      totalTokens: apiUsage?.reduce((sum, u) => sum + (u.total_tokens || 0), 0) || 0,
      totalCostUsd: apiUsage?.reduce((sum, u) => sum + parseFloat(u.cost_usd || 0), 0) || 0,
      todayRequests: apiUsage?.filter(u => new Date(u.created_at) >= todayStart).length || 0,
      todayTokens: apiUsage?.filter(u => new Date(u.created_at) >= todayStart)
        .reduce((sum, u) => sum + (u.total_tokens || 0), 0) || 0,
      monthRequests: apiUsage?.filter(u => new Date(u.created_at) >= monthStart).length || 0,
      monthTokens: apiUsage?.filter(u => new Date(u.created_at) >= monthStart)
        .reduce((sum, u) => sum + (u.total_tokens || 0), 0) || 0,
      monthCostUsd: apiUsage?.filter(u => new Date(u.created_at) >= monthStart)
        .reduce((sum, u) => sum + parseFloat(u.cost_usd || 0), 0) || 0,
    };

    // Get daily usage for chart (last 30 days)
    const dailyUsage: Record<string, { requests: number; tokens: number; cost: number }> = {};
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dailyUsage[dateStr] = { requests: 0, tokens: 0, cost: 0 };
    }

    apiUsage?.forEach(u => {
      const dateStr = new Date(u.created_at).toISOString().split('T')[0];
      if (dailyUsage[dateStr]) {
        dailyUsage[dateStr].requests++;
        dailyUsage[dateStr].tokens += u.total_tokens || 0;
        dailyUsage[dateStr].cost += parseFloat(u.cost_usd || 0);
      }
    });

    // Get recent users
    const recentUsers = profiles
      ?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)
      .map(p => ({
        id: p.id,
        role: p.role,
        createdAt: p.created_at,
      })) || [];

    // Get resume stats
    const { count: resumeCount } = await supabase
      .from('resumes')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      userStats,
      apiStats,
      dailyUsage: Object.entries(dailyUsage).map(([date, data]) => ({
        date,
        ...data,
      })),
      recentUsers,
      resumeCount: resumeCount || 0,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
