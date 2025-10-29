-- SQL Triggers for bidirectional email sync between auth.users and public.users
-- Run this in Supabase SQL Editor

-- ============================================
-- TRIGGER 1: Sync FROM auth.users TO public.users
-- ============================================
CREATE OR REPLACE FUNCTION sync_email_from_auth_to_public()
RETURNS TRIGGER AS $$
BEGIN
  -- Update public.users.email when auth.users.email changes
  UPDATE public.users
     SET email = NEW.email,
         updated_at = NOW()
   WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_email_updated ON auth.users;

-- Create trigger that fires after email update in auth.users
CREATE TRIGGER on_auth_user_email_updated
AFTER UPDATE OF email ON auth.users
FOR EACH ROW
WHEN (OLD.email IS DISTINCT FROM NEW.email)
EXECUTE FUNCTION sync_email_from_auth_to_public();


-- ============================================
-- TRIGGER 2: Sync FROM public.users TO auth.users
-- ============================================
CREATE OR REPLACE FUNCTION sync_email_from_public_to_auth()
RETURNS TRIGGER AS $$
BEGIN
  -- Update auth.users.email when public.users.email changes
  UPDATE auth.users
     SET email = NEW.email,
         email_confirmed_at = CASE 
           WHEN NEW.email != OLD.email THEN NULL 
           ELSE email_confirmed_at 
         END,
         updated_at = NOW()
   WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_public_user_email_updated ON public.users;

-- Create trigger that fires after email update in public.users
CREATE TRIGGER on_public_user_email_updated
AFTER UPDATE OF email ON public.users
FOR EACH ROW
WHEN (OLD.email IS DISTINCT FROM NEW.email)
EXECUTE FUNCTION sync_email_from_public_to_auth();


-- ============================================
-- Grant necessary permissions
-- ============================================
GRANT USAGE ON SCHEMA auth TO postgres, anon, authenticated, service_role;
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- ============================================
-- Verification Query (run after creating triggers)
-- ============================================
-- Check if triggers are created:
-- SELECT trigger_name, event_object_table, action_statement 
-- FROM information_schema.triggers 
-- WHERE trigger_name IN ('on_auth_user_email_updated', 'on_public_user_email_updated');
