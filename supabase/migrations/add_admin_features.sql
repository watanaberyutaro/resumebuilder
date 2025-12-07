-- =====================================================
-- Admin Features Migration
-- =====================================================

-- API使用量トラッキングテーブル
CREATE TABLE IF NOT EXISTS public.api_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  endpoint TEXT NOT NULL,
  model TEXT,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  cost_usd DECIMAL(10, 6) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_api_usage_user_id ON public.api_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_created_at ON public.api_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_api_usage_endpoint ON public.api_usage(endpoint);

-- profilesテーブルにis_adminカラムを追加
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- RLSポリシー: api_usage
ALTER TABLE public.api_usage ENABLE ROW LEVEL SECURITY;

-- 管理者はすべてのAPI使用量を閲覧可能
CREATE POLICY "Admins can view all api_usage" ON public.api_usage
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- ユーザーは自分のAPI使用量のみ閲覧可能
CREATE POLICY "Users can view own api_usage" ON public.api_usage
  FOR SELECT USING (auth.uid() = user_id);

-- API使用量の挿入は認証済みユーザーのみ
CREATE POLICY "Authenticated users can insert api_usage" ON public.api_usage
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 管理者のみがprofilesのis_adminを更新可能
CREATE POLICY "Only admins can update is_admin" ON public.profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- 日次・月次の統計ビュー
CREATE OR REPLACE VIEW public.api_usage_daily AS
SELECT
  DATE(created_at) as date,
  COUNT(*) as request_count,
  SUM(input_tokens) as total_input_tokens,
  SUM(output_tokens) as total_output_tokens,
  SUM(total_tokens) as total_tokens,
  SUM(cost_usd) as total_cost_usd
FROM public.api_usage
GROUP BY DATE(created_at)
ORDER BY date DESC;

CREATE OR REPLACE VIEW public.api_usage_monthly AS
SELECT
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as request_count,
  SUM(input_tokens) as total_input_tokens,
  SUM(output_tokens) as total_output_tokens,
  SUM(total_tokens) as total_tokens,
  SUM(cost_usd) as total_cost_usd
FROM public.api_usage
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- ユーザー統計ビュー
CREATE OR REPLACE VIEW public.user_stats AS
SELECT
  COUNT(*) as total_users,
  COUNT(CASE WHEN role = 'user' THEN 1 END) as regular_users,
  COUNT(CASE WHEN role = 'company' THEN 1 END) as company_users,
  COUNT(CASE WHEN is_admin = true THEN 1 END) as admin_users,
  COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as new_users_7days,
  COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_users_30days
FROM public.profiles;

SELECT 'Admin features migration completed!' as status;
