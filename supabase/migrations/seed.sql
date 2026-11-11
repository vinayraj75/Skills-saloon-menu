-- =====================================================================
-- SKILLS SALOON — seed.sql
-- Real starter menu data. Everything here can later be edited (or
-- deleted) in the admin dashboard — nothing is hardcoded in the site.
--
-- Safe to re-run (idempotent via fixed UUIDs + ON CONFLICT DO NOTHING).
-- Run AFTER 001_schema.sql + 002_storage.sql + 003_auth_triggers.sql.
--
-- price_status rules:
--   'confirmed'           -> price trusted -> published
--   'needs_verification'  -> draft until owner confirms price
--   'pending'             -> draft until owner enters a price
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. SALON (fixed UUIDs keep re-runs and references stable)
-- ---------------------------------------------------------------------
insert into public.salons (id, name, tagline, is_active)
values (
  '11111111-1111-4111-8111-111111111111',
  'Skills Saloon',
  'CUT · STYLE · REPEAT',
  true
)
on conflict (id) do nothing;

-- phone, address, description: the owner fills them in admin settings.
-- (Left empty on purpose — we never invent real contact details.)

-- ---------------------------------------------------------------------
-- 2. CATEGORIES (in menu display order)
-- ---------------------------------------------------------------------
insert into public.categories (id, salon_id, name, sort_order, is_active)
values
  ('22222222-2222-4222-8222-000000000001', '11111111-1111-4111-8111-111111111111', 'CUT & STYLE',      1, true),
  ('22222222-2222-4222-8222-000000000002', '11111111-1111-4111-8111-111111111111', 'HAIR COLOUR',      2, true),
  ('22222222-2222-4222-8222-000000000003', '11111111-1111-4111-8111-111111111111', 'FACIALS',          3, true),
  ('22222222-2222-4222-8222-000000000004', '11111111-1111-4111-8111-111111111111', 'HAIR SPA',         4, true),
  ('22222222-2222-4222-8222-000000000005', '11111111-1111-4111-8111-111111111111', 'HAIR TREATMENTS',  5, true)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 3. SERVICES (your exact menu; drafts stay hidden on the public menu)
-- ---------------------------------------------------------------------
insert into public.services
  (id, salon_id, category_id, name, description, price, price_status, is_published, sort_order)
values
  -- ---------- CUT & STYLE ----------
  ('33333333-3333-4333-8333-000000000001', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-000000000001',
   'Hair Cut', 'Classic precision cut with wash and styling.', 199.00, 'confirmed', true, 1),
  ('33333333-3333-4333-8333-000000000002', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-000000000001',
   'Advanced Hair Cut', 'Premium layered cut, wash and finish.', 249.00, 'confirmed', true, 2),
  ('33333333-3333-4333-8333-000000000003', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-000000000001',
   'Shave / Trim', 'Clean shave or a tidy beard trim.', 79.00, 'confirmed', true, 3),
  ('33333333-3333-4333-8333-000000000004', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-000000000001',
   'Hair Wash', 'Relaxing shampoo and condition.', 69.00, 'confirmed', true, 4),
  ('33333333-3333-4333-8333-000000000005', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-000000000001',
   'Head Massage', 'Soothing oil champi for the head.', 99.00, 'confirmed', true, 5),

  -- ---------- HAIR COLOUR ----------
  ('33333333-3333-4333-8333-000000000006', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-000000000002',
   'Hair Dye', 'Standard dye application.', 199.00, 'needs_verification', false, 1),
  ('33333333-3333-4333-8333-000000000007', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-000000000002',
   'Revlon', 'Revlon colour for rich, even tones.', 349.00, 'confirmed', true, 2),
  ('33333333-3333-4333-8333-000000000008', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-000000000002',
   'Bigen', 'Gentle, natural-looking permanent colour.', 349.00, 'confirmed', true, 3),
  ('33333333-3333-4333-8333-000000000009', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-000000000002',
   'L''Oréal', 'L''Oréal professional colouring.', 399.00, 'confirmed', true, 4),
  ('33333333-3333-4333-8333-000000000010', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-000000000002',
   'Global Hair Colour', 'Full-head global colour with nourishing care.', 1499.00, 'confirmed', true, 5),

  -- ---------- FACIALS ----------
  ('33333333-3333-4333-8333-000000000011', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-000000000003',
   'Basic Clean Up', 'Quick cleanse and freshening.', null, 'pending', false, 1),
  ('33333333-3333-4333-8333-000000000012', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-000000000003',
   'De-Tan / Scrub', 'Removes tan with an exfoliating scrub.', 199.00, 'confirmed', true, 2),
  ('33333333-3333-4333-8333-000000000013', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-000000000003',
   'Fruit Facial', 'Refreshing fruit-based facial.', 1199.00, 'confirmed', true, 3),
  ('33333333-3333-4333-8333-000000000014', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-000000000003',
   'Gold / Bleach Facial', 'Gold facial with bleach for a natural glow.', 2399.00, 'confirmed', true, 4),
  ('33333333-3333-4333-8333-000000000015', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-000000000003',
   'Diamond Facial', 'Luxury diamond polish for deep radiance.', 3499.00, 'needs_verification', false, 5),
  ('33333333-3333-4333-8333-000000000016', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-000000000003',
   'Bridal Facial', 'Complete pre-bridal glow treatment.', null, 'pending', false, 6),

  -- ---------- HAIR SPA (all need price confirmation from the owner) ----------
  ('33333333-3333-4333-8333-000000000017', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-000000000004',
   'Basic Hair Spa', 'Deep conditioning hair spa.', null, 'pending', false, 1),
  ('33333333-3333-4333-8333-000000000018', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-000000000004',
   'Anti-Dandruff Hair Spa', 'Anti-dandruff treatment and scalp care.', null, 'pending', false, 2),
  ('33333333-3333-4333-8333-000000000019', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-000000000004',
   'Hair Fall Treatment', 'Strengthening treatment for hair fall.', null, 'pending', false, 3),

  -- ---------- HAIR TREATMENTS ----------
  ('33333333-3333-4333-8333-000000000020', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-000000000005',
   'Hair Straightening', 'Permanent straightening with aftercare.', 2499.00, 'confirmed', true, 1),
  ('33333333-3333-4333-8333-000000000021', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-000000000005',
   'Keratin', 'Keratin smoothing and shine.', 3499.00, 'confirmed', true, 2),
  ('33333333-3333-4333-8333-000000000022', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-000000000005',
   'Botox', 'Botox repair for frizz-free hair.', 3999.00, 'confirmed', true, 3),
  ('33333333-3333-4333-8333-000000000023', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-000000000005',
   'Nano Plastia', 'Advanced nano-plastia smoothing.', 4999.00, 'confirmed', true, 4),
  ('33333333-3333-4333-8333-000000000024', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-000000000005',
   'Hair Curling', 'Stylish perming with conditioning.', 3499.00, 'confirmed', true, 5)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 4. MENU SETTINGS (one row; announcement off until owner writes one)
-- ---------------------------------------------------------------------
insert into public.menu_settings (id, salon_id, announcement_text, announcement_active)
values (
  '44444444-4444-4444-8444-444444444444',
  '11111111-1111-4111-8111-111111111111',
  null,
  false
)
on conflict (id) do nothing;
-- (menu_settings.salon_id is UNIQUE, so ON CONFLICT (salon_id) also applies;
--  the id conflict above keeps re-runs quiet.)

-- =====================================================================
-- DONE. 5 categories, 24 services (7 drafts pending price confirmation),
-- 1 salon, 1 menu settings row. Zero offers — the owner creates them.
-- =====================================================================
