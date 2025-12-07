-- 管理者デモアカウント作成用SQL
-- Supabase Dashboard の SQL Editor で実行してください

-- ============================================
-- 方法1: 既存ユーザーを管理者に昇格させる（推奨）
-- ============================================

-- 特定のメールアドレスのユーザーを管理者にする
-- UPDATE profiles
-- SET is_admin = true
-- WHERE id = (
--   SELECT id FROM auth.users WHERE email = 'your-email@example.com'
-- );

-- ============================================
-- 方法2: 新規デモ管理者アカウントを作成
-- ============================================

DO $$
DECLARE
  new_user_id uuid;
  admin_email text := 'admin@demo.com';
BEGIN
  -- 既存のデモ管理者がいるか確認
  SELECT id INTO new_user_id
  FROM auth.users
  WHERE email = admin_email;

  IF new_user_id IS NULL THEN
    -- 新規ユーザーを作成
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      aud,
      role,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token
    ) VALUES (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      admin_email,
      -- パスワード: admin123456 (bcrypt hash)
      crypt('admin123456', gen_salt('bf')),
      now(),
      '{"provider": "email", "providers": ["email"]}',
      '{"display_name": "デモ管理者"}',
      'authenticated',
      'authenticated',
      now(),
      now(),
      '',
      ''
    )
    RETURNING id INTO new_user_id;

    RAISE NOTICE 'Created new admin user with ID: %', new_user_id;
  ELSE
    RAISE NOTICE 'Admin user already exists with ID: %', new_user_id;
  END IF;

  -- profilesテーブルにエントリを作成/更新（emailカラムを含む）
  INSERT INTO profiles (id, email, role, is_admin, display_name, created_at, updated_at)
  VALUES (
    new_user_id,
    admin_email,
    'user',
    true,
    'デモ管理者',
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    is_admin = true,
    display_name = COALESCE(profiles.display_name, 'デモ管理者'),
    updated_at = now();

  RAISE NOTICE 'Admin profile configured for user ID: %', new_user_id;
END $$;

-- ============================================
-- 確認クエリ
-- ============================================

-- 管理者一覧を確認
SELECT
  p.id,
  u.email,
  p.display_name,
  p.role,
  p.is_admin,
  p.created_at
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.is_admin = true;

-- ============================================
-- デモアカウント情報
-- ============================================
-- Email: admin@demo.com
-- Password: admin123456
-- URL: /admin
-- ============================================
