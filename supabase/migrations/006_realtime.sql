-- =====================================================================
-- SKILLS SALOON — 006_realtime.sql
-- Adds the public menu tables to the supabase_realtime publication so
-- the client (anon session, RLS-filtered) receives live changes.
-- =====================================================================

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'salons') then
    alter publication supabase_realtime add table public.salons;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'categories') then
    alter publication supabase_realtime add table public.categories;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'services') then
    alter publication supabase_realtime add table public.services;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'offers') then
    alter publication supabase_realtime add table public.offers;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'offer_services') then
    alter publication supabase_realtime add table public.offer_services;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'menu_settings') then
    alter publication supabase_realtime add table public.menu_settings;
  end if;
end;
$$;
