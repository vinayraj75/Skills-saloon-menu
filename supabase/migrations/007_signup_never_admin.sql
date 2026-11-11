-- =====================================================================
-- SKILLS SALOON — 007_signup_never_admin.sql
-- SECURITY FIX: public signups must NEVER become admin automatically.
-- Every signup now creates a plain 'staff' profile. Exactly one admin is
-- created later through the one-time, token-guarded /admin/setup page
-- (see Phase 4 app code), which elevates that account server-side.
-- Idempotent: safe to re-apply.
-- =====================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  insert into public.profiles (id, full_name, role, salon_id)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      split_part(new.email, '@', 1)
    ),
    'staff',
    (select id from public.salons order by created_at limit 1)
  );

  return new;
end;
$$;

-- Guard: only ONE admin may exist per salon, ever (enforced at the DB level).
create unique index if not exists profiles_single_admin_idx
  on public.profiles (salon_id) where role = 'admin';
