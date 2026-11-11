-- =====================================================================
-- SKILLS SALOON — 003_auth_triggers.sql
-- Creates a profile automatically when someone signs up.
--
-- SAFE FIRST-ADMIN RULE:
--   - The VERY FIRST user to sign up becomes 'admin'.
--   - Everyone after that becomes 'staff' (which currently has no
--     special powers, so strangers can never become admins).
--   - The first admin is also linked to the seeded salon.
--
-- Safe to re-run. Run AFTER 001_schema.sql.
-- =====================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role, salon_id)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      split_part(new.email, '@', 1)
    ),
    case
      when exists (select 1 from public.profiles where role = 'admin')
      then 'staff'   -- someone is already admin; latecomers get no powers
      else 'admin'   -- first ever signup = the owner's admin account
    end,
    (select id from public.salons order by created_at limit 1)
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
