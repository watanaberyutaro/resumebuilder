-- ============================================
-- 管理者デモアカウント作成（シンプル版）
-- Supabase Dashboard > SQL Editor で実行
-- ============================================

-- 方法A: 既存ユーザーを管理者にする（推奨）
-- メールアドレスを自分のものに変更して実行
UPDATE profiles
SET is_admin = true, updated_at = now()
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'your-email@example.com'
);

-- 方法B: ユーザーIDで直接指定
-- UPDATE profiles SET is_admin = true WHERE id = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';

-- ============================================
-- 管理者一覧を確認
-- ============================================
SELECT
  p.id,
  u.email,
  p.display_name,
  p.is_admin,
  p.created_at
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.is_admin = true;
