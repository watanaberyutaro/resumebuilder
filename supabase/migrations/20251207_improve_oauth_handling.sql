-- =====================================================
-- Improve OAuth User Handling
-- =====================================================
-- This migration improves the handle_new_user function to better
-- handle OAuth sign-ups (Google, etc.) by extracting user metadata

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create improved function with OAuth metadata handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role_value user_role;
  display_name_value TEXT;
  avatar_url_value TEXT;
BEGIN
  -- Determine role from metadata, default to 'user'
  user_role_value := COALESCE(
    (NEW.raw_user_meta_data->>'role')::user_role,
    'user'::user_role
  );

  -- Extract display name from various sources
  -- Priority: metadata 'full_name' > 'name' > 'display_name' > OAuth 'full_name' > email username
  display_name_value := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'display_name',
    SPLIT_PART(NEW.email, '@', 1)
  );

  -- Extract avatar URL from OAuth metadata
  avatar_url_value := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture'
  );

  -- Insert profile with OAuth metadata
  INSERT INTO public.profiles (
    id,
    email,
    role,
    display_name,
    avatar_url
  )
  VALUES (
    NEW.id,
    NEW.email,
    user_role_value,
    display_name_value,
    avatar_url_value
  );

  -- If user role is 'user' and signed up via OAuth, create initial resume
  IF user_role_value = 'user' AND NEW.raw_user_meta_data->>'provider' IS NOT NULL THEN
    INSERT INTO public.resumes (
      user_id,
      full_name,
      email
    )
    VALUES (
      NEW.id,
      display_name_value,
      NEW.email
    );
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log error but don't fail the signup
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, service_role;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Verify
SELECT '✅ OAuth handling improved!' as status;
