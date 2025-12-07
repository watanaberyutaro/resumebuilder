-- =====================================================
-- AI Resume Builder - Clean Migration
-- =====================================================
-- 既存のオブジェクトをクリーンアップしてから再作成

-- Drop existing triggers first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_companies_updated_at ON public.companies;
DROP TRIGGER IF EXISTS update_resumes_updated_at ON public.resumes;
DROP TRIGGER IF EXISTS update_work_histories_updated_at ON public.work_histories;
DROP TRIGGER IF EXISTS update_skills_updated_at ON public.skills;
DROP TRIGGER IF EXISTS update_chat_sessions_updated_at ON public.chat_sessions;
DROP TRIGGER IF EXISTS update_offers_updated_at ON public.offers;

-- Drop existing functions
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.update_updated_at_column();

-- Drop existing tables (in correct order due to foreign keys)
DROP TABLE IF EXISTS public.photo_jobs CASCADE;
DROP TABLE IF EXISTS public.profile_imports CASCADE;
DROP TABLE IF EXISTS public.billing_events CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.offer_messages CASCADE;
DROP TABLE IF EXISTS public.offers CASCADE;
DROP TABLE IF EXISTS public.chat_messages CASCADE;
DROP TABLE IF EXISTS public.chat_sessions CASCADE;
DROP TABLE IF EXISTS public.ai_generations CASCADE;
DROP TABLE IF EXISTS public.skills CASCADE;
DROP TABLE IF EXISTS public.work_histories CASCADE;
DROP TABLE IF EXISTS public.resumes CASCADE;
DROP TABLE IF EXISTS public.companies CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop existing types
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS offer_status CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;
DROP TYPE IF EXISTS notification_channel CASCADE;
DROP TYPE IF EXISTS billing_event_type CASCADE;
DROP TYPE IF EXISTS job_category CASCADE;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ENUM Types
-- =====================================================

CREATE TYPE user_role AS ENUM ('user', 'company', 'admin');
CREATE TYPE offer_status AS ENUM ('pending', 'interested', 'declined', 'accepted', 'hired');
CREATE TYPE notification_type AS ENUM ('scout', 'message', 'reminder', 'system');
CREATE TYPE notification_channel AS ENUM ('app', 'email', 'line');
CREATE TYPE billing_event_type AS ENUM ('scout_success', 'subscription', 'refund');
CREATE TYPE job_category AS ENUM ('engineer', 'sales', 'marketing', 'design', 'hr', 'finance', 'medical', 'other');

-- =====================================================
-- Users Table (extends Supabase Auth)
-- =====================================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'user',
  display_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  scout_enabled BOOLEAN DEFAULT false,
  blocked_company_ids UUID[] DEFAULT '{}',
  preferred_language TEXT DEFAULT 'ja',
  line_user_id TEXT,
  line_notify_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Company Profiles
-- =====================================================

CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  company_name_kana TEXT,
  industry TEXT,
  employee_count TEXT,
  website_url TEXT,
  logo_url TEXT,
  description TEXT,
  address TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- =====================================================
-- Resumes
-- =====================================================

CREATE TABLE public.resumes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name TEXT,
  full_name_kana TEXT,
  birth_date DATE,
  gender TEXT,
  postal_code TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  education JSONB DEFAULT '[]',
  desired_job_category job_category,
  desired_industries TEXT[],
  desired_positions TEXT[],
  desired_salary_min INTEGER,
  desired_salary_max INTEGER,
  desired_work_locations TEXT[],
  photo_url TEXT,
  photo_processed_url TEXT,
  ai_summary TEXT,
  ai_self_pr TEXT,
  ai_career_objective TEXT,
  certifications TEXT[],
  languages JSONB DEFAULT '[]',
  is_public BOOLEAN DEFAULT false,
  is_complete BOOLEAN DEFAULT false,
  template_type TEXT DEFAULT 'jis',
  last_generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Work Histories
-- =====================================================

CREATE TABLE public.work_histories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resume_id UUID NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  company_name_hidden TEXT,
  industry TEXT,
  employee_count TEXT,
  position TEXT,
  department TEXT,
  job_category job_category,
  employment_type TEXT,
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN DEFAULT false,
  description TEXT,
  achievements TEXT,
  ai_description TEXT,
  ai_achievements TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Skills
-- =====================================================

CREATE TABLE public.skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resume_id UUID NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  skill_type TEXT NOT NULL,
  proficiency_level INTEGER,
  years_of_experience NUMERIC(3,1),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- AI Generation History
-- =====================================================

CREATE TABLE public.ai_generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  resume_id UUID REFERENCES public.resumes(id) ON DELETE SET NULL,
  generation_type TEXT NOT NULL,
  prompt TEXT NOT NULL,
  response TEXT NOT NULL,
  model TEXT DEFAULT 'gpt-4o-mini',
  input_tokens INTEGER,
  output_tokens INTEGER,
  cost_jpy NUMERIC(10,4),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Chat Sessions & Messages
-- =====================================================

CREATE TABLE public.chat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  resume_id UUID REFERENCES public.resumes(id) ON DELETE SET NULL,
  title TEXT,
  session_type TEXT DEFAULT 'resume_edit',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  tokens_used INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Scout/Offers
-- =====================================================

CREATE TABLE public.offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  sender_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_resume_id UUID REFERENCES public.resumes(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  position_title TEXT,
  salary_range TEXT,
  status offer_status DEFAULT 'pending',
  status_changed_at TIMESTAMPTZ,
  candidate_response TEXT,
  is_contact_disclosed BOOLEAN DEFAULT false,
  disclosed_at TIMESTAMPTZ,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.offer_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  offer_id UUID NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  sender_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Notifications
-- =====================================================

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  notification_type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_entity_type TEXT,
  related_entity_id UUID,
  sent_via_app BOOLEAN DEFAULT true,
  sent_via_email BOOLEAN DEFAULT false,
  sent_via_line BOOLEAN DEFAULT false,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Billing Events
-- =====================================================

CREATE TABLE public.billing_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  event_type billing_event_type NOT NULL,
  offer_id UUID REFERENCES public.offers(id) ON DELETE SET NULL,
  amount_jpy INTEGER NOT NULL,
  currency TEXT DEFAULT 'JPY',
  is_paid BOOLEAN DEFAULT false,
  paid_at TIMESTAMPTZ,
  external_payment_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Profile Imports
-- =====================================================

CREATE TABLE public.profile_imports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  resume_id UUID REFERENCES public.resumes(id) ON DELETE SET NULL,
  source_type TEXT NOT NULL,
  source_url TEXT NOT NULL,
  raw_data JSONB,
  parsed_data JSONB,
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- =====================================================
-- Photo Processing Jobs
-- =====================================================

CREATE TABLE public.photo_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  resume_id UUID REFERENCES public.resumes(id) ON DELETE SET NULL,
  original_url TEXT NOT NULL,
  processed_url TEXT,
  processing_options JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- =====================================================
-- Indexes
-- =====================================================

CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_scout_enabled ON public.profiles(scout_enabled) WHERE scout_enabled = true;
CREATE INDEX idx_resumes_user_id ON public.resumes(user_id);
CREATE INDEX idx_resumes_is_public ON public.resumes(is_public) WHERE is_public = true;
CREATE INDEX idx_resumes_job_category ON public.resumes(desired_job_category);
CREATE INDEX idx_work_histories_resume_id ON public.work_histories(resume_id);
CREATE INDEX idx_skills_resume_id ON public.skills(resume_id);
CREATE INDEX idx_skills_skill_name ON public.skills(skill_name);
CREATE INDEX idx_offers_company_id ON public.offers(company_id);
CREATE INDEX idx_offers_recipient_user_id ON public.offers(recipient_user_id);
CREATE INDEX idx_offers_status ON public.offers(status);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read) WHERE is_read = false;
CREATE INDEX idx_chat_sessions_user_id ON public.chat_sessions(user_id);
CREATE INDEX idx_chat_messages_session_id ON public.chat_messages(session_id);
CREATE INDEX idx_ai_generations_user_id ON public.ai_generations(user_id);

-- =====================================================
-- Row Level Security (RLS)
-- =====================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_histories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photo_jobs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Companies can view public profiles for scouting" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'company'
    )
    AND scout_enabled = true
    AND NOT (auth.uid() = ANY(blocked_company_ids))
  );

-- Companies policies
CREATE POLICY "Users can view own company" ON public.companies
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own company" ON public.companies
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert own company" ON public.companies
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Public can view verified companies" ON public.companies
  FOR SELECT USING (is_verified = true);

-- Resumes policies
CREATE POLICY "Users can manage own resumes" ON public.resumes
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Companies can view public resumes" ON public.resumes
  FOR SELECT USING (
    is_public = true
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'company'
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = resumes.user_id
      AND auth.uid() = ANY(p.blocked_company_ids)
    )
  );

-- Work histories policies
CREATE POLICY "Users can manage own work histories" ON public.work_histories
  FOR ALL USING (user_id = auth.uid());

-- Skills policies
CREATE POLICY "Users can manage own skills" ON public.skills
  FOR ALL USING (user_id = auth.uid());

-- AI generations policies
CREATE POLICY "Users can view own ai generations" ON public.ai_generations
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own ai generations" ON public.ai_generations
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Chat sessions policies
CREATE POLICY "Users can manage own chat sessions" ON public.chat_sessions
  FOR ALL USING (user_id = auth.uid());

-- Chat messages policies
CREATE POLICY "Users can manage own chat messages" ON public.chat_messages
  FOR ALL USING (user_id = auth.uid());

-- Offers policies
CREATE POLICY "Companies can manage sent offers" ON public.offers
  FOR ALL USING (sender_user_id = auth.uid());

CREATE POLICY "Users can view received offers" ON public.offers
  FOR SELECT USING (recipient_user_id = auth.uid());

CREATE POLICY "Users can update received offers (respond)" ON public.offers
  FOR UPDATE USING (recipient_user_id = auth.uid());

-- Offer messages policies
CREATE POLICY "Participants can view offer messages" ON public.offer_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.offers o
      WHERE o.id = offer_id
      AND (o.sender_user_id = auth.uid() OR o.recipient_user_id = auth.uid())
    )
  );

CREATE POLICY "Participants can send offer messages" ON public.offer_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.offers o
      WHERE o.id = offer_id
      AND (o.sender_user_id = auth.uid() OR o.recipient_user_id = auth.uid())
    )
  );

-- Notifications policies
CREATE POLICY "Users can manage own notifications" ON public.notifications
  FOR ALL USING (user_id = auth.uid());

-- Billing events policies
CREATE POLICY "Companies can view own billing" ON public.billing_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = company_id AND c.user_id = auth.uid()
    )
  );

-- Profile imports policies
CREATE POLICY "Users can manage own imports" ON public.profile_imports
  FOR ALL USING (user_id = auth.uid());

-- Photo jobs policies
CREATE POLICY "Users can manage own photo jobs" ON public.photo_jobs
  FOR ALL USING (user_id = auth.uid());

-- =====================================================
-- Functions
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'role', 'user')::user_role);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_resumes_updated_at
  BEFORE UPDATE ON public.resumes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_work_histories_updated_at
  BEFORE UPDATE ON public.work_histories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_skills_updated_at
  BEFORE UPDATE ON public.skills
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chat_sessions_updated_at
  BEFORE UPDATE ON public.chat_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_offers_updated_at
  BEFORE UPDATE ON public.offers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- Done!
-- =====================================================
SELECT '✅ Database schema created successfully!' as status;
