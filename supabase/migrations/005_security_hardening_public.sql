-- =====================================================================
-- SKILLS SALOON — 005_security_hardening_public.sql
-- Second advisor pass: also revoke the blanket PUBLIC EXECUTE grant
-- (Postgres grants EXECUTE to the special "public" role by default,
-- which made the anon/authenticated revokes ineffective until this).
-- =====================================================================

revoke execute on function public.handle_new_user() from public;
revoke execute on function public.log_admin_change() from public;
