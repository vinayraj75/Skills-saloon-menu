# SKILLS SALOON — Deployment Guide (Phase 8)

A step-by-step guide to put the salon menu online for free on **Vercel**, with the
database already hosted on **Supabase**. Follow the steps in order. No coding needed.

> **What you get at the end:** one permanent link like
> `https://skills-saloon.vercel.app` that the QR code points to. Customers scan
> once, forever; the menu updates whenever you edit the admin dashboard.

---

## 0. What is already done

| Piece | Status |
|---|---|
| Code (Next.js 15 + TypeScript + Tailwind) | ✅ Finished |
| Database, login, storage, realtime (Supabase, hosted) | ✅ Live |
| Admin dashboard (services, categories, offers, salon, QR) | ✅ Working |
| Production build (`npm run build`) | ✅ Passes |
| Lint (`npm run lint`) | ✅ No warnings |
| **Hosting on the internet (Vercel)** | ❌ **This guide** |

Current stage: **Phase 8 — Test & deploy**. The site runs only on
`http://localhost:3000` until the steps below are finished.

---

## 1. Things you need (10 minutes to collect)

1. A **GitHub** account — you already have one: `vinayraj75`.
2. A **Vercel** account — sign in with GitHub at <https://vercel.com/signup> (free).
3. Your **Supabase** project open: <https://supabase.com/dashboard>.
4. The file **`.env.local`** in this project folder — it holds the secret values.
   Never email it, screenshot it, or commit it to GitHub.

### Check your `.env.local` has all 4 lines filled

Open `C:\Users\mypc\Desktop\saloon1\.env.local` in Notepad. Each line must have a
value after the `=`:

```
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<long public key>
SUPABASE_SERVICE_ROLE_KEY=<long SECRET key>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

The last line is changed to the Vercel link in **Step 6**.

---

## 2. Install Git (needed once)

Git is not installed on this computer yet. The GitHub website upload method below
avoids Git, but Git is recommended because every future update becomes one click.

**Beginner option (no Git):** skip to **Step 3B**.

**Recommended option:** download Git from <https://git-scm.com/download/win>, run
the installer, keep clicking **Next**, then **close and reopen** PowerShell.

---

## 3. Put the code on GitHub

### Step 3A — with Git (recommended)

Open **PowerShell** and run these commands one line at a time:

```powershell
cd "C:\Users\mypc\Desktop\saloon1"
git init
git add .
git commit -m "Skills Saloon ready for deployment"
git branch -M main
```

Now create an empty repository:

1. Open <https://github.com/new>.
2. **Repository name:** `skills-saloon`
3. Choose **Private** (recommended).
4. Do **NOT** tick "Add a README", ".gitignore", or a license.
5. Click **Create repository**.
6. Copy the two lines GitHub shows under **"…or push an existing repository"**.
   They look like this (replace the URL with the one GitHub shows you):

```powershell
git remote add origin https://github.com/vinayraj75/skills-saloon.git
git push -u origin main
```

If GitHub asks for a password, it wants a **Personal Access Token**, not your
account password: GitHub → Settings → Developer settings → Personal access
tokens → Tokens (classic) → Generate new token → tick `repo` → copy the token →
paste it as the password.

### Step 3B — without Git (upload in the browser)

1. Open <https://github.com/new>, name it `skills-saloon`, choose **Private**,
   click **Create repository**.
2. Click **"uploading an existing file"**.
3. In File Explorer open `C:\Users\mypc\Desktop\saloon1`.
4. **Do not** drag these folders/files (they are huge or secret):
   `node_modules`, `.next`, `.env.local`.
5. Select everything else (including the `src`, `public`, `supabase` folders,
   `package.json`, `next.config.js`, `tsconfig.json`, `DEPLOY.md`, `AGENTS.md`)
   and drag it into the browser.
6. Click **Commit changes**.

> `.gitignore` already protects `.env.local`, so it can never be uploaded by Git.
> When uploading manually, just make sure you never select `.env.local`.

---

## 4. Import the project into Vercel

1. Go to <https://vercel.com/new>.
2. If asked, click **Continue with GitHub** and allow access.
3. Find **`skills-saloon`** in the list and click **Import**.
   (If it is missing, click **Adjust GitHub App Permissions** and grant access.)
4. Vercel auto-detects **Next.js**. **Leave every build setting as it is.**
5. **Do not click Deploy yet** — first add the environment variables.

---

## 5. Add the environment variables (the secret step)

Still on the import screen, open **Environment Variables** and add these four,
one at a time. Copy the values from your `.env.local` file.

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | your Supabase publishable/anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | your Supabase **secret** key |
| `NEXT_PUBLIC_SITE_URL` | `https://skills-saloon.vercel.app` (we verify the exact name after the first deploy) |

For each row: type the **Name**, paste the **Value**, leave all environments
ticked (Production, Preview, Development), click **Add**.

> ⚠️ The `SUPABASE_SERVICE_ROLE_KEY` is a master key. Vercel stores it encrypted,
> and the app is built so it can never reach a customer's browser. Never paste it
> into GitHub, chat, or a screenshot. This key was exposed during setup — rotate
> it in Supabase after the app is live, then update it in Vercel and redeploy.

Now click **Deploy**. Wait 1–3 minutes. You should see **Congratulations!**

---

## 6. Set the real site URL (important for the QR code)

1. On the success screen, copy your live link (top of the page), e.g.
   `https://skills-saloon-xxxx.vercel.app`.
2. In Vercel open **Settings → Environment Variables**.
3. Edit `NEXT_PUBLIC_SITE_URL` and set it to that exact link
   (no slash at the end).
4. Go to **Deployments → … (three dots on the newest) → Redeploy** and confirm.
   A redeploy is required because this value is baked in at build time.

> Why it matters: the QR page builds the QR from this URL. If it still says
> `localhost`, the printed QR will not work for customers.

---

## 7. Tell Supabase about the new address (login redirects)

1. Open your project at <https://supabase.com/dashboard>.
2. Go to **Authentication → URL Configuration**.
3. **Site URL:** paste your Vercel link.
4. **Redirect URLs:** click **Add URL** and paste the same link, plus
   `https://<your-vercel-link>/admin/login`.
5. Click **Save**.

This keeps admin login and password-reset links working from the internet.

---

## 8. Create the owner admin account (one time only)

The setup link must be used **before** anyone else signs up, and only once.

1. In Vercel open **Settings → Environment Variables** and confirm
   `ADMIN_SETUP_TOKEN` exists. (It is in your local `.env.local`; it was not
   listed in Step 5 because it is optional for the build. If it is missing, add
   it with the same value as local, then redeploy.)
2. Open this address in your browser, replacing the two placeholders:

   ```
   https://<your-vercel-link>/admin/setup?t=<your ADMIN_SETUP_TOKEN value>
   ```

3. Create the admin with the owner's email and a strong password.
4. Log in at `https://<your-vercel-link>/admin/login`.
5. **After it works:** delete the `ADMIN_SETUP_TOKEN` line from Vercel
   (Settings → Environment Variables) and from `.env.local`, then redeploy.
   The setup page self-locks permanently once an admin exists — this is a second
   lock, on purpose.

---

## 9. Test everything on a phone (5-minute checklist)

Open your Vercel link on a phone using mobile data (not Wi-Fi), then check:

- [ ] Menu loads; salon name, tagline, logo show.
- [ ] Category buttons scroll to the right section.
- [ ] Search finds a service by name.
- [ ] Only published services appear (draft ones stay hidden).
- [ ] A running offer shows the offer strip and the crossed-out price.
- [ ] Tapping a service opens its detail page.
- [ ] Editing a price in `/admin` updates the menu after a refresh.
- [ ] `https://<your-link>/admin` while logged out redirects to login.
- [ ] The admin QR page shows your **https** link, not `localhost`.

---

## 10. Print the QR poster (only after all tests pass)

1. Log in and open **`/admin/qr`**.
2. Confirm the warning banner is **gone** and the link is your Vercel link.
3. Click **Download PNG** for a table card, or **Print poster** for the A4 stand.
4. Print at high quality, place it at the counter. The QR never changes.

---

## 11. Future updates (zero-downtime)

Every time you change code:

```powershell
cd "C:\Users\mypc\Desktop\saloon1"
git add .
git commit -m "describe the change"
git push
```

Vercel automatically rebuilds and publishes in about a minute. Menu edits made in
`/admin` do **not** need a deploy — they appear instantly.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Build fails on Vercel: "supabaseUrl is required" | A variable name is misspelled or missing. Check Step 5 exactly, then redeploy. |
| Menu is empty online but full locally | Wrong Supabase project URL/key, or the production deploy used an old key. Re-copy from Supabase → Project Settings → API. |
| Images do not load | `next.config.js` allows images only from the Supabase host in `NEXT_PUBLIC_SUPABASE_URL`. Fix that variable and redeploy. |
| QR still shows `localhost` | `NEXT_PUBLIC_SITE_URL` was changed but not redeployed. Step 6. |
| `/admin` logs in then bounces back | Supabase **Site URL / Redirect URLs** still point to localhost. Step 7. |
| "Setup is closed" on `/admin/setup` | An admin already exists. Use `/admin/login`. If the password is lost, reset it in Supabase → Authentication → Users. |
| Vercel shows 404 on refresh of a sub-page | Should not happen with Next.js App Router. Confirm the framework preset is **Next.js**, not "Other". |
| Need to see server errors | Vercel → your project → **Logs** (Runtime Logs). |

---

## Security checklist before you print the poster

- [ ] `.env.local` is **not** on GitHub (open the repo and search — it must be absent).
- [ ] `SUPABASE_SERVICE_ROLE_KEY` appears **only** in `.env.local` and Vercel.
- [ ] `ADMIN_SETUP_TOKEN` removed from both places after setup.
- [ ] The old secret key is revoked and replaced with a fresh one.
- [ ] Supabase RLS is still enabled (it is; migrations 004–007 hardened it).
- [ ] Only the owner knows the admin password; it is not shared over chat.
- [ ] The QR page warning banner is gone.

---

## Done

When every box above is ticked, Phase 8 is complete and the salon is live.
Update the checklist in `AGENTS.md` to mark Phase 8 done.
