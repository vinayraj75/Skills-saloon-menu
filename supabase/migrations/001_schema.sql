-- =====================================================================
-- SKILLS SALOON — 001_schema.sql
-- Tables, constraints, indexes, triggers, audit logging, Row Level Security
--
-- Safe to re-run (idempotent). Run order:
--   001_schema.sql  ->  002_storage.sql  ->  003_auth_triggers.sql  ->  seed.sql
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 1. HELPER: keep updated_at fresh automatically
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 2. HELPER: is the current logged-in user an admin?
-- ---------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------
-- 3. HELPER: is an offer running right now? (IST / Asia/Kolkata)
--    Offer is "running" when: is_active = true
--      AND today (IST) is inside start_date..end_date
--      AND current IST time is inside start_time..end_time (if set)
--    Offer numbering: 'W1'..'W'+ '%05d'
-- ---------------------------------------------------------------------
create or replace function public.offer_is_running(offer public.offers)
returns boolean
language sql
stable
as $$
  select
    offer.is_active
    and (now() at time zone 'Asia/Kolkata')::date >= offer.start_date
    and (now() at time zone 'Asia/Kolkata')::date <= offer.end_date
    and (offer.start_time is null or (now() at time zone 'Asia/Kolkata')::time >= offer.start_time)
    and (offer.end_time   is null or (now() at time zone 'Asia/Kolkata')::time <= offer.end_time)
$$;

-- =====================================================================
-- 4. TABLES
-- =====================================================================

-- ----- salons (the salon + its public details) -----
create table if not exists public.salons (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  tagline     text,
  description text,
  logo_url    text,
  phone       text,
  address     text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ----- profiles (one row per Supabase auth user; role decides privileges) -----
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  salon_id   uuid references public.salons (id) on delete set null,
  full_name  text,
  role       text not null default 'staff' check (role in ('admin', 'staff')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----- categories (menu sections, e.g. CUT & STYLE, FACIALS) -----
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  salon_id    uuid not null references public.salons (id) on delete cascade,
  name        text not null,
  description text,
  image_url   text,
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ----- services (individual menu items) -----
create table if not exists public.services (
  id            uuid primary key default gen_random_uuid(),
  salon_id      uuid not null references public.salons (id) on delete cascade,
  category_id   uuid not null references public.categories (id) on delete cascade,
  name          text not null,
  description   text,
  image_url     text,
  price         numeric(10,2) check (price is null or price >= 0),
  price_status  text not null default 'confirmed'
                check (price_status in ('confirmed', 'needs_verification', 'pending')),
  is_available  boolean not null default true,
  is_published  boolean not null default false,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  -- HARD RULE at DB level: a service without a confirmed price can never be published
  constraint services_published_needs_confirmed_price check (
    is_published = false
    or (price is not null and price_status = 'confirmed')
  )
);

-- ----- offers (discounts with a schedule) -----
create table if not exists public.offers (
  id             uuid primary key default gen_random_uuid(),
  salon_id       uuid not null references public.salons (id) on delete cascade,
  title          text not null,
  description    text,
  discount_type  text not null check (discount_type in ('percent', 'fixed')),
  discount_value numeric(10,2) not null check (discount_value > 0),
  -- percent discounts can never exceed 100%
  constraint offers_percent_max_100 check (
    discount_type = 'fixed' or discount_value <= 100
  ),
  start_date     date not null,
  end_date       date not null,
  constraint offers_date_range check (start_date <= end_date),
  start_time     time,
  end_time       time,
  constraint offers_time_range check (
    start_time is null or end_time is null or start_time < end_time
  ),
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ----- offer_services (which services / whole categories an offer applies to) -----
create table if not exists public.offer_services (
  id          uuid primary key default gen_random_uuid(),
  offer_id    uuid not null references public.offers (id) on delete cascade,
  category_id uuid references public.categories (id) on delete cascade,
  service_id  uuid references public.services (id) on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  -- each row points at exactly one thing: a whole category OR one service
  constraint offer_target_exactly_one check (
    (category_id is not null and service_id is null)
    or (category_id is null and service_id is not null)
  )
);

-- a service/category can only be linked to the same offer once
create unique index if not exists uq_offer_services_service
  on public.offer_services (offer_id, service_id) where service_id is not null;
create unique index if not exists uq_offer_services_category
  on public.offer_services (offer_id, category_id) where category_id is not null;

-- ----- menu_settings (one row per salon: announcement shown on the menu) -----
create table if not exists public.menu_settings (
  id                  uuid primary key default gen_random_uuid(),
  salon_id            uuid not null unique references public.salons (id) on delete cascade,
  announcement_text   text,
  announcement_active boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ----- audit_logs (automatic diary of every admin change) -----
create table if not exists public.audit_logs (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  actor_id    uuid references auth.users (id) on delete set null,
  actor_email text,
  action      text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  table_name  text not null,
  record_id   uuid,
  old_data    jsonb,
  new_data    jsonb
);

-- =====================================================================
-- 5. updated_at TRIGGERS (auto-set on every update)
-- =====================================================================
drop trigger if exists trg_updated_at on public.salons;
create trigger trg_updated_at before update on public.salons
  for each row execute function public.set_updated_at();

drop trigger if exists trg_updated_at on public.profiles;
create trigger trg_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists trg_updated_at on public.categories;
create trigger trg_updated_at before update on public.categories
  for each row execute function public.set_updated_at();

drop trigger if exists trg_updated_at on public.services;
create trigger trg_updated_at before update on public.services
  for each row execute function public.set_updated_at();

drop trigger if exists trg_updated_at on public.offers;
create trigger trg_updated_at before update on public.offers
  for each row execute function public.set_updated_at();

drop trigger if exists trg_updated_at on public.offer_services;
create trigger trg_updated_at before update on public.offer_services
  for each row execute function public.set_updated_at();

drop trigger if exists trg_updated_at on public.menu_settings;
create trigger trg_updated_at before update on public.menu_settings
  for each row execute function public.set_updated_at();

-- =====================================================================
-- 6. AUDIT LOG TRIGGERS
--    Every INSERT / UPDATE / DELETE on admin data writes one audit row.
--    security definer = the trigger can write audit_logs even though
--    RLS blocks normal users from writing there.
-- =====================================================================
create or replace function public.log_admin_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_email text;
begin
  select u.email into v_email from auth.users u where u.id = v_actor;

  if tg_op = 'INSERT' then
    insert into public.audit_logs (actor_id, actor_email, action, table_name, record_id, new_data)
    values (v_actor, v_email, 'INSERT', tg_table_name, (to_jsonb(new) ->> 'id')::uuid, to_jsonb(new));
    return new;

  elsif tg_op = 'UPDATE' then
    insert into public.audit_logs (actor_id, actor_email, action, table_name, record_id, old_data, new_data)
    values (v_actor, v_email, 'UPDATE', tg_table_name, (to_jsonb(new) ->> 'id')::uuid, to_jsonb(old), to_jsonb(new));
    return new;

  else -- DELETE
    insert into public.audit_logs (actor_id, actor_email, action, table_name, record_id, old_data)
    values (v_actor, v_email, 'DELETE', tg_table_name, (to_jsonb(old) ->> 'id')::uuid, to_jsonb(old));
    return old;
  end if;
end;
$$;

drop trigger if exists trg_audit on public.salons;
create trigger trg_audit after insert or update or delete on public.salons
  for each row execute function public.log_admin_change();

drop trigger if exists trg_audit on public.profiles;
create trigger trg_audit after insert or update or delete on public.profiles
  for each row execute function public.log_admin_change();

drop trigger if exists trg_audit on public.categories;
create trigger trg_audit after insert or update or delete on public.categories
  for each row execute function public.log_admin_change();

drop trigger if exists trg_audit on public.services;
create trigger trg_audit after insert or update or delete on public.services
  for each row execute function public.log_admin_change();

drop trigger if exists trg_audit on public.offers;
create trigger trg_audit after insert or update or delete on public.offers
  for each row execute function public.log_admin_change();

drop trigger if exists trg_audit on public.offer_services;
create trigger trg_audit after insert or update or delete on public.offer_services
  for each row execute function public.log_admin_change();

drop trigger if exists trg_audit on public.menu_settings;
create trigger trg_audit after insert or update or delete on public.menu_settings
  for each row execute function public.log_admin_change();

-- =====================================================================
-- 7. INDEXES (fast menu loads on a phone)
-- =====================================================================
create index if not exists idx_categories_salon_sort
  on public.categories (salon_id, is_active, sort_order);
create index if not exists idx_services_salon
  on public.services (salon_id);
create index if not exists idx_services_category_sort
  on public.services (category_id, sort_order);
create index if not exists idx_services_published
  on public.services (salon_id, is_published, is_available);
create index if not exists idx_offers_salon_active
  on public.offers (salon_id, is_active, start_date, end_date);
create index if not exists idx_offer_services_offer
  on public.offer_services (offer_id);
create index if not exists idx_offer_services_service
  on public.offer_services (service_id);
create index if not exists idx_offer_services_category
  on public.offer_services (category_id);
create index if not exists idx_profiles_salon
  on public.profiles (salon_id);
create index if not exists idx_audit_logs_created
  on public.audit_logs (created_at desc);
create index if not exists idx_audit_logs_table
  on public.audit_logs (table_name, created_at desc);

-- =====================================================================
-- 8. ROW LEVEL SECURITY (the security guard on every sheet)
--    Public (strangers, not logged in):
--      - may READ published / active rows only
--    Admins (logged in with profiles.role = 'admin'):
--      - may read everything incl. drafts
--      - may INSERT / UPDATE / DELETE
-- =====================================================================

alter table public.salons         enable row level security;
alter table public.profiles       enable row level security;
alter table public.categories     enable row level security;
alter table public.services       enable row level security;
alter table public.offers         enable row level security;
alter table public.offer_services enable row level security;
alter table public.menu_settings  enable row level security;
alter table public.audit_logs     enable row level security;

-- ----- salons: menu info is public; only admins can change it -----
drop policy if exists "salons_public_read" on public.salons;
create policy "salons_public_read" on public.salons
  for select using (true);

drop policy if exists "salons_admin_all" on public.salons;
create policy "salons_admin_all" on public.salons
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ----- profiles: users see their own profile; admins manage all -----
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_admin_all" on public.profiles;
create policy "profiles_admin_all" on public.profiles
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ----- categories: public sees only ACTIVE; admins see and manage all -----
drop policy if exists "categories_public_read_active" on public.categories;
create policy "categories_public_read_active" on public.categories
  for select using (is_active = true);

drop policy if exists "categories_admin_select_all" on public.categories;
create policy "categories_admin_select_all" on public.categories
  for select to authenticated
  using (public.is_admin());

drop policy if exists "categories_admin_all" on public.categories;
create policy "categories_admin_all" on public.categories
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ----- services: public sees only PUBLISHED; admins see and manage all -----
drop policy if exists "services_public_read_published" on public.services;
create policy "services_public_read_published" on public.services
  for select using (is_published = true);

drop policy if exists "services_admin_select_all" on public.services;
create policy "services_admin_select_all" on public.services
  for select to authenticated
  using (public.is_admin());

drop policy if exists "services_admin_all" on public.services;
create policy "services_admin_all" on public.services
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ----- offers: public sees only offers RUNNING right now (IST schedule) -----
drop policy if exists "offers_public_read_running" on public.offers;
create policy "offers_public_read_running" on public.offers
  for select using (public.offer_is_running(offers));

drop policy if exists "offers_admin_select_all" on public.offers;
create policy "offers_admin_select_all" on public.offers
  for select to authenticated
  using (public.is_admin());

drop policy if exists "offers_admin_all" on public.offers;
create policy "offers_admin_all" on public.offers
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ----- offer_services: public sees links of running offers only -----
drop policy if exists "offer_services_public_read" on public.offer_services;
create policy "offer_services_public_read" on public.offer_services
  for select using (
    exists (
      select 1 from public.offers o
      where o.id = offer_services.offer_id
        and public.offer_is_running(o)
    )
  );

drop policy if exists "offer_services_admin_all" on public.offer_services;
create policy "offer_services_admin_all" on public.offer_services
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ----- menu_settings: info is public; admins manage -----
drop policy if exists "menu_settings_public_read" on public.menu_settings;
create policy "menu_settings_public_read" on public.menu_settings
  for select using (true);

drop policy if exists "menu_settings_admin_all" on public.menu_settings;
create policy "menu_settings_admin_all" on public.menu_settings
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ----- audit_logs: admins may read; writes happen only via the trigger -----
drop policy if exists "audit_logs_admin_read" on public.audit_logs;
create policy "audit_logs_admin_read" on public.audit_logs
  for select to authenticated
  using (public.is_admin());
