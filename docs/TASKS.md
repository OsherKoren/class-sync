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

Prisma schema live on Neon; teacher, guardian, and student login working; abuse protection in place.

**Design decisions:**
- Teacher signs in with Google only (identified by `TEACHER_EMAIL` env var)
- Guardians self-register with Google OR email + password — no teacher setup required
- Students self-register with Google OR email + password (independent teens, 13+)
- Young children have no login of their own — one or more guardians act on their behalf via `StudentGuardian` links
- A Student record can be linked to multiple guardians (mother + father, parent + grandparent, etc.) and may *also* have its own login — both child and guardian(s) can act on the same record
- Guardian–student linking happens via in-app **link codes** (6-char, single-use, 24h expiry, QR-renderable) — no email service required
- Two-way enrollment: teachers can enroll students directly (auto-confirmed) OR students request to join open classes (teacher approves/rejects)

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
- [x] `lib/actions/auth.ts` — `registerFamily` server action *(to be renamed `registerGuardian` in Phase 2 refactor)*
- [x] `app/register/page.tsx` — self-registration form for guardians
- [x] Install `@upstash/ratelimit @upstash/redis`
- [x] Add `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` to `.env.local`
- [x] `lib/rate-limit.ts` — shared rate limiter helpers
- [x] `proxy.ts` — auth redirect + global 60 req/min rate limit per IP (Next.js 16)
- [x] Per-route limits: 10/min on auth, 5/min on votes, 20/min on push

### ✅ Phase 1 Success — check each after testing manually
- [x] Teacher logs in with Google → session exists → lands on `/teacher/dashboard`
- [x] Guardian self-registers with email + password → lands on `/guardian/dashboard`
- [x] Guardian logs in with Google → lands on `/guardian/dashboard`
- [x] Student self-registers (independent teen) → lands on `/student/dashboard`
- [x] Visiting `/teacher/dashboard` without a session → redirects to `/login`
- [ ] Tables visible in Neon dashboard (check via `npx prisma studio`)
- [ ] Hitting login 11+ times/min from same IP → receives 429 response

**→ Do not start Phase 2 until all Phase 1 boxes above are checked.**

---

## Phase 2 — Class & Student Management

Teacher can create classes and manage guardian-linked students and independent students. Guardians and students can also link to each other via link codes.

**Core schema changes (multi-guardian + link-code model):**
- [x] Rename `Role.FAMILY` → `Role.GUARDIAN` (and update `User.role` default)
- [x] Drop the `Family` model entirely (no longer needed — guardians link directly to students)
- [x] Drop `Student.familyId` and the `Student.family` relation
- [x] Keep `Student.userId String? @unique` (child's own login, optional)
- [x] Change `Student.user` relation to `onDelete: SetNull` — deleting a student's User keeps the Student row for any linked guardians
- [x] Add `STUDENT` to `Role` enum (already present in current schema — verify)
- [x] Add `StudentGuardian` join model: `(studentId, guardianId)` composite PK, optional `relationship String?`, `@@index([guardianId])`
- [x] Add `LinkCodeKind` enum: `CLAIM_STUDENT | CLAIM_GUARDIAN`
- [x] Add `LinkCode` model: `code` (6-char PK), `kind`, `studentId`, `createdById`, `expiresAt`, `usedAt`, `usedById`, `@@index([studentId])`
- [x] Add `EnrollmentStatus` enum: `PENDING | ACTIVE | REJECTED` (already present — verify)
- [x] Update `Enrollment` model: ensure `status` field present (already in current schema — verify)
- [x] Add `Class.isOpen Boolean @default(false)` — toggle for student self-enrollment (already in current schema — verify)
- [x] `npx prisma db push --force-reset` (dev only — no prod data yet) + `npx prisma generate`

**Teacher class/enrollment features:**
- [x] `app/teacher/classes/new/page.tsx` — form: name, subject, type, day, time
- [x] `app/teacher/classes/[id]/page.tsx` — detail + enrolled students
- [x] `app/teacher/classes/page.tsx` — class list
- [x] `app/teacher/dashboard/page.tsx` — quick-access cards
- [x] `app/teacher/dashboard/page.tsx` — add "Pending Requests" section: fetch all PENDING enrollments across teacher's classes; show student name + class name + approve/reject buttons; hide section when empty
- [x] Server Action: `getPendingEnrollments()` — returns all PENDING enrollments for the logged-in teacher's classes (student name, class name, enrollmentId)
- [x] `app/teacher/students/page.tsx` — students list (currently grouped by family — to be regrouped by Student with guardian column in refactor)
- [x] `app/teacher/students/new/page.tsx` — add student + initial guardian form (currently "add family" — to be renamed in refactor)
- [x] `app/teacher/students/[id]/page.tsx` — student detail + linked guardians + enroll button (currently "family detail" — to be renamed in refactor)
- [x] `app/teacher/students/[id]/[studentId]/enroll/page.tsx` — enroll into class

**Student management features (new):**
- [x] `app/teacher/classes/[id]/page.tsx` — add "Enroll by email" UI section (pending requests list already done)
- [x] `app/teacher/students/page.tsx` — add "Find student by email" search UI (independent students)
- [x] Server Action: `findStudentByEmail(email)` — teacher searches for existing student
- [x] Server Action: `enrollStudentByEmail(email, classId)` — create ACTIVE enrollment
- [x] Server Action: `approveEnrollment(enrollmentId)` — change PENDING → ACTIVE (auto-closes class when maxCapacity reached)
- [x] Server Action: `rejectEnrollment(enrollmentId)` — change PENDING → REJECTED
- [x] Update `enrollStudent()` to set `status: ACTIVE` (teacher-enrolled always confirmed)

**Class capacity features (added):**
- [x] `Class.maxCapacity Int?` schema field — optional cap on active enrollments
- [x] GROUP classes default to capacity 4; PRIVATE classes have no limit
- [x] Auto-close (`isOpen = false`) when active enrollment count reaches `maxCapacity` (transactional, applied on approve + direct enroll)
- [x] Teacher can reopen manually via `ToggleOpenEnrollment` regardless of capacity
- [x] Students see ALL classes (open and closed); request button always available; teacher approves/rejects
- [x] Capacity info shown on class detail page (X / Y enrolled) and student classes list (X spots left)

**Student/Guardian registration/auth features (new):**
- [x] Update `lib/auth.ts` — handle post-OAuth role selection
- [x] `lib/actions/auth.ts` — add `registerStudent(name, email, password)` server action
- [x] `lib/actions/auth.ts` — add `registerGuardian(name, email, password)` server action (replaces `registerFamily`)
- [x] `lib/actions/auth.ts` — add `completeOAuthRegistration(role)` for Google post-signup
- [x] `app/register/page.tsx` — add "Guardian / Student" toggle
- [x] `app/register/complete/page.tsx` (new) — post-Google role selection page
- [x] `app/login/page.tsx` — role-based redirect (TEACHER → `/teacher/dashboard`, GUARDIAN → `/guardian/dashboard`, STUDENT → `/student/dashboard`)
- [x] `proxy.ts` — add `/student/*` and `/guardian/*` protection, add `/register/complete` to public routes

**Link-code features (new):**
- [x] `lib/link-code.ts` — `generateCode()` (6-char from `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`), `normalizeCode(input)` (uppercase + strip whitespace), `consumeCode(code, redeemerUserId)` (single transaction)
- [x] Server Action: `createLinkCode(studentId, kind)` — creates LinkCode row for Guardian inviting Student or Student inviting Guardian; enforces max 5 active per Student
- [x] Server Action: `redeemLinkCode(code)` — validates kind/role match, atomically sets `Student.userId` OR creates `StudentGuardian` row, marks code used
- [x] Server Action: `revokeLinkCode(code)` — generator can cancel before redemption
- [x] `app/guardian/students/new/page.tsx` — add child (creates Student row, optionally generates a CLAIM_STUDENT code on the spot)
- [x] `app/guardian/students/[id]/link/page.tsx` — generate CLAIM_STUDENT or CLAIM_GUARDIAN code, show as large text + QR
- [x] `app/guardian/link/page.tsx` — enter a CLAIM_GUARDIAN code received from a student
- [x] `app/student/link/page.tsx` — enter a CLAIM_STUDENT code received from a guardian
- [x] Optional `?code=XXXXXX` query param on `/register` to pre-fill link code during signup
- [x] Install `qrcode` npm package for server-side QR rendering
- [x] Per-route rate limit: 10/min on code generation, 20/min on redemption (per IP + per User)

### ✅ Phase 2 Success (Pending requests dashboard)
- [x] Teacher dashboard shows a "Pending Requests" section when at least one request exists
- [x] Each row shows the student's name and the class they requested
- [x] Approving a request removes it from the list and activates the enrollment
- [x] Rejecting a request removes it from the list
- [x] Section is hidden when there are no pending requests

### ✅ Phase 2 Success (Guardian-managed students)
- [x] Teacher creates a group class → appears in class list
- [x] Teacher creates a student record with an initial guardian (guardian name + email) → appears in students page
- [x] Teacher adds a student and enrolls them in a class
- [x] Enrollment appears in the class detail page
- [x] Invalid form inputs show inline error messages

### Phase 2 Success (Independent students)
- [x] Independent student registers with email + password → lands on student dashboard
- [x] Independent student registers with Google → confirms "I'm a student" → lands on student dashboard
- [x] Teacher finds independent student by email → enrolls them in a class (ACTIVE status)
- [x] Independent student browses all classes → requests to join (creates PENDING enrollment)
- [x] Teacher approves pending request → status becomes ACTIVE → student sees confirmed class

### Phase 2 Success (Multi-guardian + link codes)
- [x] Guardian creates a child (no login) → Student row created with one StudentGuardian link
- [x] Guardian generates a CLAIM_STUDENT code → child enters code at `/register` → child account created and linked to the existing Student row; original guardian still linked
- [x] Student generates a CLAIM_GUARDIAN code → existing guardian User redeems it → StudentGuardian row created; student still has own login
- [x] Two guardians link to the same Student → both see the same enrollments on their dashboards
- [x] Linked guardian and student both see the same data; either can act on enrollments
- [x] Expired code (>24h) is rejected with a clear error
- [x] Used code cannot be redeemed twice
- [x] Role-mismatched code rejected (e.g., a Guardian trying to redeem a CLAIM_STUDENT code)
- [x] Generating a 6th active code for the same Student is rejected

---

## Phase 3 — Schedule View (Guardian & Student)

Guardian logs in to see all linked children's sessions. Independent student logs in to see their own sessions. Both surfaces query the same `Student` rows, so a linked child + guardian see identical data.

**Guardian dashboard:**
- [x] `app/guardian/layout.tsx` — minimal nav, GUARDIAN auth guard
- [x] `app/guardian/dashboard/page.tsx` — upcoming sessions across all linked children as cards (grouped by child if >1)
- [x] `app/guardian/students/page.tsx` — list of linked children with status badges + "Link child by code" / "Add child" actions
- [x] `app/guardian/settings/page.tsx` — placeholder (locale, theme, install, link/unlink children)

**Student dashboard (NEW):**
- [x] `app/student/layout.tsx` — student auth guard (STUDENT role required)
- [x] `app/student/dashboard/page.tsx` — upcoming sessions + pending requests as cards
- [x] `app/student/classes/page.tsx` — browse open classes, "Request to join" button
- [x] `app/student/settings/page.tsx` — placeholder (locale, theme, install, link/unlink guardian)
- [x] `lib/actions/student.ts` — `getStudentEnrollments()`, `requestEnrollment()`, `getOpenClasses()`

**Shared:**
- [x] `lib/auth-helpers.ts` — `canActOnStudent(studentId, userId)`: returns true if `student.userId === userId` OR a `StudentGuardian (studentId, userId)` row exists. Used in every guardian/student server action.
- [x] `components/schedule/SessionCard.tsx` — date, time, subject, status badge (ACTIVE | PENDING), child name (when guardian view + multiple children)
- [x] Seed script: create test guardian + 2 children + 1 co-guardian linked to one of them + test independent student + upcoming sessions
- [x] Light styling improvements to distinguish ACTIVE vs PENDING status

### ✅ Phase 3 Success (Guardian)
- [x] Guardian logs in → sees upcoming sessions for *all* linked children as cards
- [x] Session cards show correct date, time, subject, and (if >1 child) which child the card belongs to
- [x] Empty state message shown when no sessions exist
- [x] Settings page loads without errors

### Phase 3 Success (Independent Student)
- [x] Student logs in → sees enrolled classes as cards (ACTIVE status)
- [x] Student sees pending requests with "Waiting for teacher confirmation" badge
- [x] Student browses open classes → can request to join
- [x] Student settings page loads without errors

### Phase 3 Success (Linked guardian + student see same data)
- [x] Linked guardian and child both view the same upcoming sessions for that child
- [x] Either can request enrollment for the child → request appears on both dashboards
- [x] Two co-guardians of the same child see identical data

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
- [ ] Guardian and student dashboards show sessions from DB only — no Google Calendar data
- [ ] Cancelling a session updates only the designated calendar
- [ ] Token refresh works — teacher stays connected after 1 hour

---

## Phase 5 — Reschedule & Voting

Teacher offers new slots; guardians and students vote; teacher confirms.

- [ ] `app/teacher/reschedule/[sessionId]/page.tsx` — pick 1–2 new time slots
- [ ] `app/teacher/reschedule/[offerId]/results/page.tsx` — live vote tally
- [ ] `app/vote/[offerId]/page.tsx` — large Option A / Option B buttons (accessible to any User authorized on the underlying Student — guardian or student)
- [ ] Server Actions: `createRescheduleOffer`, `submitVote`, `resolveOffer`
- [ ] `submitVote` records vote under `studentId`, not the acting User — so a co-guardian voting after the other guardian (or after the student) updates the same vote rather than duplicating
- [ ] On resolve: update Google Calendar event to winning time slot
- [ ] Unique DB constraint `@@unique([offerId, studentId])` prevents double-voting per student per offer

### ✅ Phase 5 Success
- [ ] Teacher creates offer with 2 options → `RescheduleOffer` row in DB
- [ ] Guardian or student sees vote page with 2 large, clearly labelled buttons
- [ ] Anyone authorized on a Student can vote once; voting twice updates (does not duplicate) the record
- [ ] When a guardian votes and then the linked student (or co-guardian) votes again, only the latest choice is counted
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
- [ ] Trigger push to all Users linked to enrolled students (guardian + student themselves) when reschedule offer is created

### ✅ Phase 6 Success
- [ ] Android Chrome: install banner appears after first login
- [ ] Dismissing banner re-shows it on next login (not installed yet)
- [ ] Install button visible in settings at all times
- [ ] iOS Safari: custom instruction banner shown (no native prompt)
- [ ] Once installed (`standalone`), no install prompts shown anywhere
- [ ] Guardian (and linked student, if any) receives push when teacher creates a reschedule offer
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
- [ ] Guardian + student full flow (vote + push notification) works on production URL
- [ ] Zero console errors in production build
- [ ] App installable as PWA from the production URL on Android + iOS
