-- =====================================================
-- Test Accounts Seed Data
-- =====================================================
--
-- このSQLをSupabase SQL Editorで実行してください
-- テストアカウント:
--   1. 求職者: test@example.com / password123
--   2. 企業: company@example.com / password123
-- =====================================================

-- 1. テスト求職者アカウント作成
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  role,
  aud
) VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  '00000000-0000-0000-0000-000000000000',
  'test@example.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"role": "user"}',
  NOW(),
  NOW(),
  'authenticated',
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- 求職者プロフィール
INSERT INTO public.profiles (
  id,
  email,
  role,
  display_name,
  phone,
  scout_enabled,
  preferred_language
) VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'test@example.com',
  'user',
  'テスト 太郎',
  '090-1234-5678',
  true,
  'ja'
) ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  scout_enabled = EXCLUDED.scout_enabled;

-- 2. テスト企業アカウント作成
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  role,
  aud
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f23456789012',
  '00000000-0000-0000-0000-000000000000',
  'company@example.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"role": "company"}',
  NOW(),
  NOW(),
  'authenticated',
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- 企業プロフィール
INSERT INTO public.profiles (
  id,
  email,
  role,
  display_name,
  preferred_language
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f23456789012',
  'company@example.com',
  'company',
  '採用担当者',
  'ja'
) ON CONFLICT (id) DO UPDATE SET
  role = 'company',
  display_name = EXCLUDED.display_name;

-- 企業情報
INSERT INTO public.companies (
  id,
  user_id,
  company_name,
  company_name_kana,
  industry,
  employee_count,
  website_url,
  description,
  address,
  contact_email,
  is_verified
) VALUES (
  'c3d4e5f6-a7b8-9012-cdef-345678901234',
  'b2c3d4e5-f6a7-8901-bcde-f23456789012',
  '株式会社テストカンパニー',
  'カブシキガイシャテストカンパニー',
  'IT・通信',
  '100-500名',
  'https://example.com',
  '私たちはテスト用の企業です。優秀な人材を求めています。',
  '東京都渋谷区テスト町1-2-3',
  'hr@example.com',
  true
) ON CONFLICT (user_id) DO UPDATE SET
  company_name = EXCLUDED.company_name,
  is_verified = true;

-- =====================================================
-- サンプル履歴書データ（求職者用）
-- =====================================================

-- 履歴書基本情報
INSERT INTO public.resumes (
  id,
  user_id,
  full_name,
  full_name_kana,
  birth_date,
  gender,
  postal_code,
  address,
  phone,
  email,
  education,
  desired_job_category,
  desired_industries,
  desired_positions,
  desired_salary_min,
  desired_salary_max,
  desired_work_locations,
  certifications,
  languages,
  is_public,
  is_complete,
  template_type
) VALUES (
  'd4e5f6a7-b8c9-0123-def0-456789012345',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'テスト 太郎',
  'テスト タロウ',
  '1990-05-15',
  'male',
  '150-0001',
  '東京都渋谷区神宮前1-2-3',
  '090-1234-5678',
  'test@example.com',
  '[{"school_name": "東京大学", "faculty": "工学部", "degree": "学士", "start_date": "2009-04", "end_date": "2013-03", "is_current": false}]',
  'engineer',
  ARRAY['IT・通信', 'Web・インターネット'],
  ARRAY['フルスタックエンジニア', 'バックエンドエンジニア'],
  500,
  800,
  ARRAY['東京都', 'リモート勤務可'],
  ARRAY['基本情報技術者', 'AWS認定ソリューションアーキテクト'],
  '[{"language": "英語", "level": "ビジネスレベル"}, {"language": "日本語", "level": "ネイティブ"}]',
  true,
  true,
  'jis'
) ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  is_public = true;

-- 職務経歴1
INSERT INTO public.work_histories (
  id,
  resume_id,
  user_id,
  company_name,
  industry,
  employee_count,
  position,
  department,
  job_category,
  employment_type,
  start_date,
  end_date,
  is_current,
  description,
  achievements,
  display_order
) VALUES (
  'e5f6a7b8-c9d0-1234-ef01-567890123456',
  'd4e5f6a7-b8c9-0123-def0-456789012345',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  '株式会社テックスタート',
  'IT・通信',
  '50-100名',
  'シニアエンジニア',
  '開発部',
  'engineer',
  '正社員',
  '2018-04-01',
  NULL,
  true,
  'BtoB SaaSプロダクトの開発をリード。React/TypeScriptでのフロントエンド開発、Node.js/PostgreSQLでのバックエンド開発を担当。',
  'チーム生産性を30%向上、新機能リリースサイクルを2週間から1週間に短縮',
  0
) ON CONFLICT (id) DO NOTHING;

-- 職務経歴2
INSERT INTO public.work_histories (
  id,
  resume_id,
  user_id,
  company_name,
  industry,
  employee_count,
  position,
  department,
  job_category,
  employment_type,
  start_date,
  end_date,
  is_current,
  description,
  achievements,
  display_order
) VALUES (
  'f6a7b8c9-d0e1-2345-f012-678901234567',
  'd4e5f6a7-b8c9-0123-def0-456789012345',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  '株式会社ウェブサービス',
  'IT・通信',
  '100-500名',
  'エンジニア',
  'プロダクト開発部',
  'engineer',
  '正社員',
  '2013-04-01',
  '2018-03-31',
  false,
  'ECサイトの開発・運用。PHP/Laravelでのバックエンド開発、jQuery/Vueでのフロントエンド開発を担当。',
  '月間PV100万のサービスの安定運用、レスポンスタイム50%改善',
  1
) ON CONFLICT (id) DO NOTHING;

-- スキル
INSERT INTO public.skills (resume_id, user_id, skill_name, skill_type, proficiency_level, years_of_experience)
VALUES
  ('d4e5f6a7-b8c9-0123-def0-456789012345', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'TypeScript', 'hard', 5, 5),
  ('d4e5f6a7-b8c9-0123-def0-456789012345', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'React', 'hard', 5, 5),
  ('d4e5f6a7-b8c9-0123-def0-456789012345', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Node.js', 'hard', 4, 4),
  ('d4e5f6a7-b8c9-0123-def0-456789012345', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'PostgreSQL', 'hard', 4, 6),
  ('d4e5f6a7-b8c9-0123-def0-456789012345', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'AWS', 'hard', 4, 4),
  ('d4e5f6a7-b8c9-0123-def0-456789012345', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Docker', 'hard', 4, 3),
  ('d4e5f6a7-b8c9-0123-def0-456789012345', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'リーダーシップ', 'soft', 4, NULL),
  ('d4e5f6a7-b8c9-0123-def0-456789012345', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'コミュニケーション', 'soft', 5, NULL)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 確認用クエリ
-- =====================================================
-- 以下のクエリで作成されたデータを確認できます：
-- SELECT * FROM auth.users WHERE email IN ('test@example.com', 'company@example.com');
-- SELECT * FROM public.profiles;
-- SELECT * FROM public.companies;
-- SELECT * FROM public.resumes;
-- SELECT * FROM public.work_histories;
-- SELECT * FROM public.skills;

SELECT
  '✅ テストアカウント作成完了' as status,
  'test@example.com / password123 (求職者)' as user_account,
  'company@example.com / password123 (企業)' as company_account;
