# class-sync — Task Breakdown

Each phase ends with a testable success criteria block.
Check off each item only after manually testing it.

---

## Phase 0 — Project Init

Set up Next.js with all dependencies and base configuration.

- [x] `npx create-next-app@latest` — TypeScript, Tailwind, App Router, src/ off
- [x] Install core: `prisma @prisma/client next-auth next-intl next-themes`
- [x] Install UI: `shadcn/ui` (init), `sonner`, `lucide-react`
- [x] Install PWA/push: `serwist`, `web-push`, `@types/web-push`
- [x] Install utils: `zod`, `clsx`, `tailwind-merge`
- [x] `tsconfig.json` — strict mode on, path alias `@/` → root
- [x] Tailwind v4 dark mode via `@custom-variant dark` in globals.css (no config file needed)
- [x] `.env.local` — placeholder keys for all secrets
- [x] Delete Python `main.py` stub

### ✅ Phase 0 Success — check each after testing manually
- [x] `npm run dev` starts clean at http://localhost:3000
- [x] `npm run build` compiles with zero TypeScript errors
- [x] Tailwind styles visible (ClassSync landing page renders correctly)

**→ Do not start Phase 1 until all Phase 0 boxes above are checked.**

---

## Phase 1 — Database, Auth & Rate Limiting

Prisma schema live on Neon; teacher and family login working; abuse protection in place.

**Design decisions:**
- Teacher signs in with Google only (identified by `TEACHER_EMAIL` env var)
- Families self-register with Google OR email + password — no teacher setup required
- Young children share a parent's account; parents manage scheduling on their behalf

**Prerequisites before starting:**
- Neon account → create free project → copy `DATABASE_URL`
- Google Cloud Console → OAuth 2.0 credentials → copy client ID + secret
- Upstash account → create free Redis DB → copy REST URL + token

- [x] Write full `prisma/schema.prisma` (all models from plan)
- [x] Connect Neon — set `DATABASE_URL` in `.env.local`
- [x] `npx prisma db push` — tables created
- [x] `prisma.config.ts` — Prisma v7 config with Neon adapter
- [x] `lib/db.ts` — Prisma singleton via `@prisma/adapter-neon`
- [x] `lib/auth.ts` — NextAuth v5 config (Google provider + credentials provider)
- [x] `app/api/auth/[...nextauth]/route.ts`
- [x] `app/login/page.tsx` — Google button + email/password form + register link
- [x] `lib/actions/auth.ts` — `registerFamily` server action
- [x] `app/register/page.tsx` — self-registration form for families
- [x] Install `@upstash/ratelimit @upstash/redis`
- [x] Add `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` to `.env.local`
- [x] `lib/rate-limit.ts` — shared rate limiter helpers
- [x] `proxy.ts` — auth redirect + global 60 req/min rate limit per IP (Next.js 16)
- [x] Per-route limits: 10/min on auth, 5/min on votes, 20/min on push

### ✅ Phase 1 Success — check each after testing manually
- [ ] Teacher logs in with Google → session exists → lands on `/teacher/dashboard`
- [ ] Family self-registers with email + password → lands on `/family/dashboard`
- [ ] Family logs in with Google → lands on `/family/dashboard`
- [ ] Visiting `/teacher/dashboard` without a session → redirects to `/login`
- [ ] Tables visible in Neon dashboard (check via `npx prisma studio`)
- [ ] Hitting login 11+ times/min from same IP → receives 429 response

**→ Do not start Phase 2 until all Phase 1 boxes above are checked.**

---

## Phase 2 — Teacher: Class & Student Management

Teacher can create classes and enroll students.

- [ ] `app/(teacher)/layout.tsx` — sidebar nav, teacher auth guard
- [ ] `app/(teacher)/dashboard/page.tsx` — static placeholder
- [ ] `app/(teacher)/classes/new/page.tsx` — form: name, subject, type, day, time
- [ ] `app/(teacher)/classes/[id]/page.tsx` — detail + enrolled students
- [ ] `app/(teacher)/students/page.tsx` — families + students list
- [ ] Server Actions: `createClass`, `updateClass`, `deleteClass`
- [ ] Server Actions: `createFamily`, `addStudent`, `enrollStudent`
- [ ] Zod validation on all form inputs

### ✅ Phase 2 Success
- [x] Teacher creates a group class → appears in class list
- [x] Teacher creates a family (name + email) → appears in students page
- [x] Teacher adds a student and enrolls them in a class
- [x] Enrollment appears in the class detail page
- [x] Invalid form inputs show inline error messages

---

## Phase 3 — Family: Schedule View

Family logs in and sees their child's upcoming sessions.

- [ ] `app/(family)/layout.tsx` — minimal nav, family auth guard
- [ ] `app/(family)/dashboard/page.tsx` — upcoming session cards
- [ ] `components/schedule/SessionCard.tsx` — date, time, subject, status badge
- [ ] Seed script: create test family + student + 3 upcoming sessions
- [ ] `app/(family)/settings/page.tsx` — placeholder (locale, theme, install)

### ✅ Phase 3 Success
- [ ] Family logs in → sees child's upcoming sessions as cards
- [ ] Session cards show correct date, time, and subject
- [ ] Empty state message shown when no sessions exist
- [ ] Settings page loads without errors

---

## Phase 4 — Google Calendar Integration

Classes sync to the teacher's Google Calendar.

- [ ] Google Cloud Console: OAuth app, Calendar scope, redirect URIs
- [ ] Store access + refresh tokens in `User` after teacher login
- [ ] `lib/google-calendar.ts`: `listCalendars`, `createEvent`, `updateEvent`,
      `deleteEvent`
- [ ] Teacher onboarding screen: list all visible calendars → teacher picks ONE
      as the designated tutoring calendar → save `designatedCalendarId` to `User`
- [ ] Class creation → recurring event written to designated calendar only
- [ ] Session cancel → event marked CANCELLED on designated calendar
- [ ] Verify: no other calendar is read or written after onboarding

### ✅ Phase 4 Success
- [ ] Teacher onboarding shows a calendar picker (lists work + any shared cals)
- [ ] After picking, `designatedCalendarId` saved to DB
- [ ] Creating a class → recurring event appears in the designated work calendar
- [ ] The personal/private calendar is never read or modified by the app
- [ ] Family dashboard shows sessions from DB only — no Google Calendar data
- [ ] Cancelling a session updates only the designated calendar
- [ ] Token refresh works — teacher stays connected after 1 hour

---

## Phase 5 — Reschedule & Voting

Teacher offers new slots; families vote; teacher confirms.

- [ ] `app/(teacher)/reschedule/[sessionId]/page.tsx` — pick 1–2 new time slots
- [ ] `app/(teacher)/reschedule/[offerId]/results/page.tsx` — live vote tally
- [ ] `app/(family)/vote/[offerId]/page.tsx` — large Option A / Option B buttons
- [ ] Server Actions: `createRescheduleOffer`, `submitVote`, `resolveOffer`
- [ ] On resolve: update Google Calendar event to winning time slot
- [ ] Unique DB constraint prevents double-voting per student per offer

### ✅ Phase 5 Success
- [ ] Teacher creates offer with 2 options → `RescheduleOffer` row in DB
- [ ] Family sees vote page with 2 large, clearly labelled buttons
- [ ] Student can vote once; voting twice updates (does not duplicate) the record
- [ ] Vote tally on teacher results page reflects current counts
- [ ] Teacher resolves offer → Google Calendar event moves to winning time
- [ ] Resolved offer page shows the confirmed slot; voting buttons disabled

---

## Phase 6 — Push Notifications & PWA

Browser push + service worker; install prompt flow.

- [ ] Generate VAPID keys → add to `.env.local`
- [ ] `public/manifest.json` — name, icons (192 + 512), `display: standalone`
- [ ] `app/sw.ts` — serwist service worker
- [ ] `app/api/push/subscribe/route.ts` — save subscription to DB
- [ ] `app/api/push/send/route.ts` — send via web-push
- [ ] `hooks/usePwaInstall.ts` — capture `beforeinstallprompt`, iOS detection,
      check `display-mode: standalone`
- [ ] `components/pwa/InstallBanner.tsx` — bottom-sheet on first login
- [ ] `components/pwa/InstallButton.tsx` — persistent in settings page
- [ ] Vercel Cron: `app/api/cron/reminders/route.ts` — 24h + 1h push reminders
- [ ] Trigger push to enrolled families when reschedule offer is created

### ✅ Phase 6 Success
- [ ] Android Chrome: install banner appears after first login
- [ ] Dismissing banner re-shows it on next login (not installed yet)
- [ ] Install button visible in settings at all times
- [ ] iOS Safari: custom instruction banner shown (no native prompt)
- [ ] Once installed (`standalone`), no install prompts shown anywhere
- [ ] Family receives push when teacher creates a reschedule offer
- [ ] Reminder push fires ~24h before an upcoming session

---

## Phase 7 — i18n: Hebrew + English

Full bilingual support with RTL layout.

- [ ] Install + configure `next-intl` with middleware
- [ ] `messages/he.json` — all UI strings in Hebrew
- [ ] `messages/en.json` — all UI strings in English
- [ ] `<html dir="rtl" lang="he">` applied when locale is Hebrew
- [ ] Audit all layouts: flex direction, margins, icon placement in RTL
- [ ] Language toggle in profile → saved to `User.locale`
- [ ] Language toggle shortcut visible in nav

### ✅ Phase 7 Success
- [ ] App loads in Hebrew RTL by default
- [ ] Zero hardcoded strings — every label uses a translation key
- [ ] Toggling to English flips layout to LTR and replaces all text
- [ ] Locale preference persists after logout and re-login
- [ ] RTL layout correct at 375px mobile width

---

## Phase 8 — Light / Dark Theme

System-default theme with per-user override.

- [ ] Wrap root layout in `next-themes` `ThemeProvider`
- [ ] Add `dark:` variants to all components and pages
- [ ] 3-way toggle (Light / System / Dark) in profile settings
- [ ] Save choice to `User.theme`; restore on login

### ✅ Phase 8 Success
- [ ] App matches OS theme on first visit (no manual choice needed)
- [ ] User switches to Dark → preference saved → restored after re-login
- [ ] All pages look correct in both light and dark mode
- [ ] No color flash on page load (theme class applied before paint)

---

## Phase 9 — Polish & Deploy

Final UX pass and production deployment.

- [ ] Mobile audit: every page at 375px and 430px viewport
- [ ] Loading states: skeleton loaders on lists, spinners on submit buttons
- [ ] Empty states: friendly message on every list page when no data
- [ ] `error.tsx` boundary files on all route groups
- [ ] Vercel project created — GitHub repo connected, auto-deploy on push
- [ ] All env vars added to Vercel dashboard
- [ ] Neon prod DB created, `prisma db push` run against it
- [ ] Smoke test all critical flows on production URL

### ✅ Phase 9 Success
- [ ] All pages load on mobile without horizontal scroll or overflow
- [ ] Teacher full flow works end-to-end on production URL
- [ ] Family full flow (vote + push notification) works on production URL
- [ ] Zero console errors in production build
- [ ] App installable as PWA from the production URL on Android + iOS
