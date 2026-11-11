-- =====================================================================
-- SKILLS SALOON — 004_security_hardening.sql
-- Fixes flagged by Supabase's built-in security advisor:
--   1. Pin search_path on remaining trigger functions.
--   2. SECURITY DEFINER functions that are only used by triggers
--      or internal flows must NOT be callable via RPC by anon/auth.
--   NOTE: public.is_admin() stays executable — RLS policies need it.
-- =====================================================================

alter function public.set_updated_at() set search_path = public;
alter function public.offer_is_running(offer public.offers) set search_path = public;

revoke execute on function public.handle_new_user() from anon, authenticated, public;
revoke execute on function public.log_admin_change() from anon, authenticated, public;
