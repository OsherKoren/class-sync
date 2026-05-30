# ClassSync — Product Requirements Document

## Overview

**ClassSync** is a tutoring management and scheduling platform that helps teachers organize classes, manage students and their guardians, and coordinate rescheduling through voting. Guardians can view a child's upcoming sessions and participate in voting when sessions need to be rescheduled. Students can also manage their own schedule independently, and may optionally link one or more guardians to their account.

**Target Users:**
- Teachers: Tutors managing multiple classes and students
- Guardians: Parents, grandparents, or other adults enrolling and managing children's classes (one or more guardians per student supported)
- Students: Children with no own login (guardian-managed) OR teenagers (13+) managing their own schedule, optionally linked to one or more guardians

---

## User Personas

### Teacher (Oshrat)
- Has multiple tutoring classes (group and private)
- Needs to manage enrollments across many students and their guardians
- Wants classes synced to their Google Calendar
- May need to reschedule sessions and get guardian/student input
- Primary language: Hebrew

### Guardian (Parent, Grandparent, etc.)
- Has one or more children taking tutoring classes
- Wants to see each child's upcoming sessions on one dashboard
- May share access to a child with a co-guardian (e.g., other parent)
- Participates in voting when teacher offers alternative time slots
- Receives push notifications for important updates
- Primary language: Hebrew

### Independent Student (Teen, 13+)
- Has their own email and Google account
- Manages their own tutoring schedule independently
- Can request to join open classes (awaits teacher confirmation)
- Can be enrolled directly by teacher
- Sees pending requests and confirmed classes on their dashboard
- Participates in voting on reschedule offers
- May optionally link one or more guardians to their account via a link code
- Primary language: Hebrew or English

---

## Core Features

### Phase 1 ✅ — Authentication & Dashboards
- **Teacher Login:** Google OAuth (identified by `TEACHER_EMAIL`)
- **Guardian Registration:** Email + password OR Google OAuth
- **Student Registration:** Email + password OR Google OAuth (independent teens)
- **Teacher Dashboard:** Overview of classes and students
- **Guardian Dashboard:** View upcoming sessions across all linked children
- **Student Dashboard:** View own enrolled classes + pending requests
- **Password Reset:** Guardians and students can reset forgotten passwords

### Phase 2 ✅ — Class & Student Management
- **Create Classes:** Teacher defines name, subject, type (group/private), day, time, duration
- **Manage Students:** Teacher can create student records and link guardians to them
- **Add Students:** Teacher creates student records (with or without a login) OR finds independent students by email
- **Two-Way Enrollment:** Teacher enrolls students directly (auto-confirmed) OR students request to join open classes (teacher approves/rejects)
- **Pending Requests Dashboard:** Teacher dashboard surfaces all pending enrollment requests across all classes in one place, with inline approve/reject actions — no per-class navigation required
- **View Enrollments:** Class detail page shows all enrolled students + pending requests
- **Guardian-Student Link Codes:** Guardians and students generate single-use 6-character codes (with QR) to link accounts together, no email required
- **Multi-Guardian Per Student:** A student can have one or more linked guardians (e.g., both parents, or a parent + grandparent)
- **Session Cancellation:** Students can cancel a single upcoming session without dropping the class (recorded as a `SessionAbsence`)

### Phase 3 — Schedule View (Guardian & Student)
- **Guardian Dashboard:** Guardian sees upcoming sessions across all linked children as cards
- **Student Dashboard:** Independent student sees their own enrolled classes + pending requests
- **Session Cards:** Display subject, teacher, day, time, duration, enrollment status
- **Pending Requests:** Show classes awaiting teacher confirmation
- **Empty State:** Message when no sessions exist
- **Settings:** Guardian/student can adjust preferences (language, theme), manage links to other accounts

### Phase 4 — Google Calendar Integration
- **Calendar Sync:** Classes automatically sync to teacher's designated calendar
- **Recurring Events:** Group classes create recurring events
- **Onboarding:** Teacher picks which calendar to use (work/other)
- **Read-Only:** App never reads/modifies other calendars

### Phase 5 — Reschedule & Voting
- **Create Offer:** Teacher proposes 1–2 alternative time slots
- **Vote Page:** Guardian or student sees large buttons for Option A / Option B
- **Vote Tracking:** Students vote once; voting again updates their choice
- **Results Page:** Teacher sees live vote tally
- **Resolve Offer:** Teacher picks winning slot and updates calendar event

### Phase 6 — Push Notifications & PWA
- **Install Banner:** Users see PWA install prompt (Android/iOS)
- **Push Reminders:** 24-hour and 1-hour reminders before sessions
- **Reschedule Alerts:** Guardians and students get notified when teacher creates an offer
- **Offline Support:** App works offline once installed

### Phase 7 — Bilingual Support (Hebrew/English)
- **Hebrew RTL:** Default layout is right-to-left for Hebrew
- **English LTR:** Toggle to English switches to left-to-right
- **Persistent:** Language preference saved to user profile
- **All Strings:** Every UI label uses translation keys (zero hardcoding)

### Phase 8 — Dark Mode
- **System Default:** Respects OS theme on first visit
- **User Override:** Toggle between Light / System / Dark
- **Persistent:** Theme choice saved and restored
- **Flicker-Free:** Theme applied before page renders

### Phase 9 — Deploy & Polish
- **Mobile Responsive:** Works flawlessly on 375px (small) and 430px (medium) phones
- **Loading States:** Spinners on buttons, skeleton loaders on lists
- **Empty States:** Every list page has friendly "no data" message
- **Error Handling:** Error boundaries on all route sections
- **Production Ready:** Deployed to Vercel with Neon database

---

## User Workflows

### Teacher Workflow
1. Log in with Google (email matches `TEACHER_EMAIL`)
2. Land on dashboard with quick-access cards
3. Click "Classes" → see all classes or create a new one
4. Click "Students" → add students, optionally generate link codes to attach guardians or claim student logins
5. Create class → appears in class list with enrollment count
6. View class detail → see enrolled students, add more
7. (Future) Create reschedule offer → guardians and students vote → resolve

### Guardian Workflow
1. Register with email + password OR Google sign-up
2. Land on guardian dashboard
3. Add child (creates a Student record with no login of their own), OR enter a link code from an existing independent student to link to them
4. View each linked child's upcoming sessions as cards (date, time, subject)
5. Click session → see details
6. (Optional) Generate a link code to invite a co-guardian, or to invite the child to claim their own login
7. (Future) When teacher creates reschedule offer → get push notification → vote on new time slots
8. See updated session time once teacher resolves offer

### Independent Student Workflow
1. Register with email + password OR Google sign-up
2. Land on student dashboard → see enrolled classes + pending requests
3. Browse open classes → request to join
4. Receive confirmation once teacher approves
5. View enrolled sessions as cards
6. (Optional) Generate a link code to invite a guardian, or enter a code from a guardian to attach an account
7. (Future) Participate in reschedule voting if teacher creates offer

---

## Success Metrics

### Teacher Adoption
- Can create and manage 5+ classes without friction
- Can enroll 10+ students across multiple guardians
- Classes successfully sync to Google Calendar
- No data loss or sync errors

### Guardian & Student Engagement
- Guardians and students see upcoming sessions within 1 second of login
- Push notifications deliver reliably
- Voting interface is intuitive (>90% can vote on first try)
- Link codes are entered correctly on first try by >95% of users
- No errors when viewing sessions

### Technical
- Zero unhandled errors in production
- <2 second page load time on 4G
- App installable as PWA on Android and iOS
- Supports 100+ concurrent users

---

## Scope & Constraints

### In Scope (MVP)
- ✅ Teacher + guardian + student authentication
- ✅ Class and student CRUD
- ✅ Multi-guardian per student (via StudentGuardian join)
- ✅ Guardian–student link codes (in-app, no email service)
- ✅ Basic guardian dashboard
- ✅ Google Calendar sync
- ✅ Voting on reschedules
- ✅ Push notifications
- ✅ Bilingual (Hebrew/English) RTL
- ✅ Dark mode

### Out of Scope (Future)
- Payment/invoicing
- Parent-teacher messaging
- Homework assignments
- Real-time notifications (using WebSocket)
- Advanced reporting

### Technical Constraints
- **Auth:** NextAuth.js v5 with JWT strategy
- **Database:** Neon PostgreSQL (free tier)
- **Hosting:** Vercel (free tier)
- **Rate Limiting:** Upstash Redis (free tier)
- **Push:** Web Push API (VAPID keys)
- **No Email Service:** Password reset links only (no email sending initially). Guardian–student account linking uses in-app **link codes** (6-character, single-use, QR-renderable), not email invitations — this avoids transactional email costs and deliverability problems at the project's scale (~400 users)

---

## Data Model Overview

### Core Entities

- **User** — A login. Has a `role` of TEACHER, GUARDIAN, or STUDENT. Stores credentials (email, passwordHash, Google tokens), locale, theme. A User is just authentication identity — the real data lives on Student.
- **Student** — The canonical record for a person being tutored. Has zero or more linked guardians (via StudentGuardian) and an optional own `userId` (if the student has their own login).
  - Guardian-managed child: `userId = null`, one or more StudentGuardian links.
  - Independent student: `userId` set, zero StudentGuardian links.
  - Linked: `userId` set AND one or more StudentGuardian links (both child and guardian(s) can act on the record).
- **StudentGuardian** — Join table linking a Student to a Guardian User. Many guardians may link to one student; one guardian may link to many students (siblings).
  - Optional `relationship` field (e.g., "mother", "father", "grandparent") for display.
  - Authorization rule: a User can act on Student X if `student.userId === user.id` OR a `StudentGuardian (X, user.id)` row exists.
- **LinkCode** — Single-use 6-character code used to link a User to a Student.
  - `kind = CLAIM_STUDENT` — generated by a guardian, redeemed by a child to claim their own login on a Student row the guardian already created.
  - `kind = CLAIM_GUARDIAN` — generated by a student (or another guardian), redeemed by a guardian to create a StudentGuardian link.
  - Expires after 24 hours; max 5 active codes per Student.
- **Class** — Recurring tutoring session (name, subject, day, time, duration, teacher, isOpen flag).
- **Enrollment** — Student + Class relationship with status (PENDING, ACTIVE, REJECTED).
  - PENDING: student self-requested, awaiting teacher confirmation.
  - ACTIVE: confirmed by teacher or teacher-enrolled (auto-confirmed).
  - REJECTED: teacher declined student's request.
- **LessonSession** — Individual occurrence of a class.
- **RescheduleOffer** — Teacher's proposal for new time slots.
- **RescheduleOption** — Alternative time slot option.
- **Vote** — Student's vote on a reschedule offer. Cast by anyone authorized on the Student (the student themselves or any linked guardian); the vote is recorded under the `studentId`, not the acting User, so duplicate votes per student per offer are prevented.
- **PushSubscription** — Browser subscription endpoint (per User).

> **Removed in this design:** the previous `Family` entity (one parent → many students) — replaced by direct `StudentGuardian` links, which generalize to multiple guardians per student.

---

## Roadmap

| Phase | Focus | Timeline |
|-------|-------|----------|
| 1 | Auth & dashboards | ✅ Complete |
| 2 | Class & student management | ✅ Complete |
| 3 | Guardian + student schedule view | In progress |
| 4 | Google Calendar sync | Planned |
| 5 | Reschedule voting | Planned |
| 6 | Push & PWA | Planned |
| 7 | i18n (Hebrew/English) | ✅ Complete |
| 8 | Dark mode | Planned |
| 9 | Deploy & polish | Planned |
| 10 | AI assistant (v2) | Post-launch |

---

## Design Principles

1. **Mobile-First:** All features work flawlessly on phones first
2. **Offline-Ready:** PWA enables offline access to critical data
3. **Accessible:** WCAG 2.1 AA standards (contrast, keyboard nav, labels)
4. **Bilingual:** RTL layout works as well as LTR
5. **Fast:** <2 second loads, responsive interactions
6. **Simple:** Minimal UI, clear user flows, no cognitive overload
