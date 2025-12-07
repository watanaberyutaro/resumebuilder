-- =====================================================
-- Fix RLS Recursion Issue
-- =====================================================

-- Drop problematic policies
DROP POLICY IF EXISTS "Companies can view public profiles for scouting" ON public.profiles;
DROP POLICY IF EXISTS "Companies can view public resumes" ON public.resumes;

-- Simplified profiles policies (avoid recursion)
CREATE POLICY "Companies can view scout-enabled profiles" ON public.profiles
  FOR SELECT USING (
    scout_enabled = true
    AND role = 'user'
  );

-- Simplified resumes policies (avoid recursion)
CREATE POLICY "Anyone can view public resumes" ON public.resumes
  FOR SELECT USING (is_public = true);

-- Ensure users can insert their own profiles (needed for signup)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

SELECT '✅ RLS policies fixed!' as status;
