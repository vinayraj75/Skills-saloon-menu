-- =====================================================================
-- SKILLS SALOON — 002_storage.sql
-- Storage buckets (salon-logos, category-images, service-images)
-- with PLATFORM-NATIVE validation + secure policies.
--
-- NOTE (final design): validation uses the buckets' built-in
-- file_size_limit / allowed_mime_types — enforced by the Supabase
-- Storage engine itself on every upload path (can't be bypassed).
-- A custom before-insert trigger was tried and proved unreliable on
-- the hosted Storage API path, so it is intentionally not used.
--
-- Safe to re-run. Run AFTER 001_schema.sql.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. BUCKETS (public read; writes are admin-only through policies below)
--    Validation baked in: only image/jpeg, image/png, image/webp, max 2 MB
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('salon-logos',    'salon-logos',    true, 2097152, array['image/png','image/jpeg','image/webp']),
  ('category-images','category-images',true, 2097152, array['image/png','image/jpeg','image/webp']),
  ('service-images', 'service-images', true, 2097152, array['image/png','image/jpeg','image/webp'])
on conflict (id) do update
  set file_size_limit   = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------
-- 2. STORAGE POLICIES
--    Everyone can look at the images (they are shown on the menu),
--    but ONLY logged-in admins can upload / change / delete them.
-- ---------------------------------------------------------------------

-- public read
drop policy if exists "saloon_images_public_read" on storage.objects;
create policy "saloon_images_public_read" on storage.objects
  for select
  using (bucket_id in ('salon-logos', 'category-images', 'service-images'));

-- admin upload
drop policy if exists "saloon_images_admin_insert" on storage.objects;
create policy "saloon_images_admin_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('salon-logos', 'category-images', 'service-images')
    and public.is_admin()
  );

-- admin update
drop policy if exists "saloon_images_admin_update" on storage.objects;
create policy "saloon_images_admin_update" on storage.objects
  for update to authenticated
  using (
    bucket_id in ('salon-logos', 'category-images', 'service-images')
    and public.is_admin()
  )
  with check (
    bucket_id in ('salon-logos', 'category-images', 'service-images')
    and public.is_admin()
  );

-- admin delete
drop policy if exists "saloon_images_admin_delete" on storage.objects;
create policy "saloon_images_admin_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('salon-logos', 'category-images', 'service-images')
    and public.is_admin()
  );
