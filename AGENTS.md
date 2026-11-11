# SKILLS SALOON — Agent Rules & Progress

Unisex salon digital menu. Tagline: `CUT · STYLE · REPEAT`. Currency: ₹ (INR).
A customer scans one **permanent QR code** and always sees the latest menu. The
owner manages everything (services, prices, offers, images) from a secure admin
dashboard with **zero code changes**.

---

## 1. HARD RULES (never break these)

1. **Stack is fixed.** Next.js (App Router) + TypeScript + Tailwind CSS +
   lucide-react + Supabase (hosted — never local/Docker) + `qrcode` npm package.
2. **Never invent data.** Every feature must read/write the real database.
   No placeholder buttons, no dead code.
3. **Secrets only in `.env.local`** (gitignored). Ship a `.env.example` with
   empty values. Never commit keys. The Supabase **service-role key must never
   reach the browser** — server-side only.
4. **Ask before any destructive action** (deleting files, resetting the DB).
5. **After every phase:** run lint + build, fix all errors, summarize in 5 lines,
   then STOP and wait for the user to say "continue".
6. **When a step needs browser action** (Supabase dashboard, Vercel, GitHub),
   stop and give numbered click-by-click instructions.
7. **Memory-friendly dev server.** Warn the user if a command may be slow.
8. Plans must be stored in /plans directory (if required).
9. Explain every step in simple words. Assume the user is a beginner.

## 2. STACK

| Layer | Choice |
|---|---|
| Framework | Next.js App Router + TypeScript |
| Styling | Tailwind CSS |
| Icons | lucide-react |
| Database / Auth / Storage / Realtime | Supabase (hosted, RLS enabled) |
| QR | `qrcode` npm package |
| Validation | zod (server actions) |
| Hosting | Vercel |
| Git | GitHub — user: vinayraj75 |

## 3. BRAND & DESIGN

- Premium, elegant, minimalist: black / white / subtle grey.
- Refined **serif headings**, clean **sans-serif body**.
- Smooth transitions, mobile-first, fully responsive.
- Logo at `public/logo.png` used unchanged.
- Loading skeletons + empty states everywhere data can be empty.
- It must feel like a luxury salon brand, NOT a restaurant template.

## 4. DATA MODEL (summary — full details in Phase 2)

Tables: `salons`, `profiles`, `categories`, `services`, `offers`,
`offer_services`, `menu_settings`, `audit_logs`.

- UUID primary keys, FKs, `created_at`/`updated_at` with triggers.
- Money: `numeric` prices (INR).
- Multi-salon ready: `salon_id` on every data table.
- RLS: public reads **only published** data; writes only for authenticated
  users whose `profiles.role = 'admin'`.
- Audit log triggers on all admin changes.
- Storage buckets: `logos`, `categories`, `services` — image type/size
  validation, public read, admin-only write.
- `services.price_status`: `'confirmed' | 'needs_verification' | 'pending'`;
  nullable `price`. Services without a confirmed price are **DRAFT
  (unpublished)** and cannot be published until price is confirmed.

## 5. SEED MENU DATA (all editable in admin, never hardcoded in frontend)

- CUT & STYLE: Hair Cut 199 · Advanced Hair Cut 249 · Shave / Trim 79 · Hair Wash 69 · Head Massage 99
- HAIR COLOUR: Hair Dye 199 (needs_verification) · Revlon 349 · Bigen 349 · L'Oréal 399 · Global Hair Colour 1499
- FACIALS: Basic Clean Up (pending, no price) · De-Tan / Scrub 199 · Fruit Facial 1199 · Gold / Bleach Facial 2399 · Diamond Facial 3499 (needs_verification) · Bridal Facial (pending, no price)
- HAIR SPA: Basic Hair Spa (pending) · Anti-Dandruff Hair Spa (pending) · Hair Fall Treatment (pending)
- HAIR TREATMENTS: Hair Straightening 2499 · Keratin 3499 · Botox 3999 · Nano Plastia 4999 · Hair Curling 3499

## 6. PROGRESS CHECKLIST

- [x] **Phase 1 — Architecture**: folder structure, data model, route map,
      security model. ← current phase
- [x] **Phase 2 — Database**: `supabase/migrations/` (tables, RLS, triggers,
      indexes, Storage policies) + `seed.sql`.
      ✅ APPLIED to Supabase project `qehdfwuprohlobsibazt` (5 migrations in ledger)
      ✅ Data live: 1 salon, 5 categories, 24 services (17 published, 7 drafts)
      ✅ RLS enabled on all 8 tables, stranger writes tested & blocked
      ✅ Storage buckets native-validated (JPG/PNG/WebP ≤ 2 MB)
- [x] **Phase 3 — Public menu**: logo, name, tagline, "Unisex Salon" label,
      sticky category nav, smooth scroll, search, service cards (image,
      description, original + discounted price, offer badge, availability),
      service detail view, active offers; live via Realtime + ISR fallback.
      ✅ Built & verified against live DB (17 published shown, 7 drafts hidden)
      ✅ Realtime enabled on 6 tables (001–006 migrations applied)
      ✅ Dev server runs on http://localhost:3000
- [x] **Phase 4 — Auth**: email+password via Supabase Auth; middleware-protected
      `/admin/*` (login & one-time token-guarded `/admin/setup` open),
      server-side admin role check in dashboard layout, logout, discreet
      top-right admin icon on the customer menu.
      ✅ Migration 007 applied: signup ALWAYS creates `staff`; first-signup-admin
         rule removed; DB-level unique index caps ONE admin per salon
      ✅ Service-role key isolated via `server-only` (browser import fails build)
      ✅ One-time `/admin/setup?t=<token>`: token from .env.local, timing-safe
         compare, self-closes permanently once an admin exists
      ✅ Tested: anon /admin → 307 login; bad/missing token → locked screen;
         login page renders; admin icon present on menu
      ⏳ Owner must create the admin via the one-time setup link (pending user)
- [x] **Phase 5 — Admin CRUD**: `/admin` dashboard (stats + recent audit),
      categories page (create/edit/visibility/reorder/delete), services page
      (create/edit/search/filter/publish/unpublish/reorder/availability/delete),
      per-service edit page with image upload/replace/remove (live preview,
      JPG/PNG/WebP ≤2 MB validated client+server+bucket), salon settings +
      announcement editor, full audit page. Customer menu updates via on-demand
      revalidation + Realtime.
      ✅ DB-layer test suite passed: create/edit/publish/reorder/availability/
         image upload-replace-delete/audit all verified; state restored
         (24 services / 17 published / 24 images, zero test leftovers)
      ✅ Caught + fixed: inserts must stamp salon_id (real runtime bug found by
         the test suite before any user-visible failure)
      ⏳ Owner should create the admin account (Desktop shortcut) and do the
         10-minute click-through pass; PB REQ: password reset UI in Phase 6+
- [x] **Phase 6 — Offers**: `/admin/offers` — create/edit/toggle/delete offers,
      percent or fixed, presets (today / week / month) or custom date+time
      range, IST-based schedule, scope = services / whole categories / whole
      menu, price-safety check (fixed discount may not exceed cheapest linked
      price), status chips (Running now / Scheduled / Ended / Switched off),
      live "e.g. ₹A → ₹B" effect preview.
      ✅ DB-enforced auto-start/auto-expire verified via anon REST (future &
         expired offers invisible; switch-off wins during window)
      ✅ Customer menu shows running offers + best discounted price live
         (offer strip + crossed-out original price + offer badge)
      ✅ Audit trail records every offer action; test offer fully cleaned up
      ✅ Services untouched (24 / 17 published / 24 images)
- [x] **Phase 7 — QR**: `/admin/qr` — permanent QR of `NEXT_PUBLIC_SITE_URL`,
      live preview, PNG download (900 px, error-correction H), and a print
      friendly A4 poster (logo, name, tagline, "Scan for our menu") that
      prints isolated via @media print styles.
      ✅ qrcode lib generates valid 900px PNG (verified at node level)
      ✅ /admin/qr protected (307 → login with ?next)
      ✅ Loud warning while URL is still localhost — do not print yet
- [ ] **Phase 8 — Test & deploy**: fix bugs, write beginner-friendly `DEPLOY.md`.
      - ✅ `DEPLOY.md` written (GitHub → Vercel → env vars → domain URL → admin setup → QR print).
      - ✅ `npm run build` passes (14 routes); `npm run lint` has zero warnings.
      - ⏳ Not yet hosted: `NEXT_PUBLIC_SITE_URL` is still `http://localhost:3000`,
         no Git repo / GitHub remote, no Vercel project. Remaining work is the
         click-through in `DEPLOY.md` (needs the owner's browser + accounts).

## 7. SECURITY CHECKLIST (verify before done)

- [x] RLS on every table
- [x] No service-role key in client code (`server-only` guard on admin client)
- [x] Admin routes protected server-side (middleware + role check in layout)
- [x] Image upload type/size checks (client + Storage policies + bucket limits)
- [x] zod validation on every server action (login, setup, categories,
      services, salon settings; offers follow in Phase 6)
- [x] Audit logs for every admin change (Phase 5 actions will also log actions)
- [x] No secrets in git (`.env.local` stays out of version control)

## 8. DEFINITION OF DONE

Customer scans one permanent QR → sees latest menu on a phone. Owner logs in
and manages categories, services, prices, images and offers with no code
changes. Build passes. All CRUD works against the real DB. `DEPLOY.md` complete.
