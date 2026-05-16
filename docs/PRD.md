# ClassSync — Product Requirements Document

## Overview

**ClassSync** is a tutoring management and scheduling platform that helps teachers organize classes, manage students/families, and coordinate rescheduling through voting. Families can view their child's upcoming sessions and participate in voting when sessions need to be rescheduled.

**Target Users:**
- Teachers: Tutors managing multiple classes and students
- Families: Parents/guardians enrolling their children in tutoring classes
- Independent Students: Teenagers (13+) managing their own tutoring schedule

---

## User Personas

### Teacher (Oshrat)
- Has multiple tutoring classes (group and private)
- Needs to manage enrollments across families
- Wants classes synced to their Google Calendar
- May need to reschedule sessions and get family input
- Primary language: Hebrew

### Family/Parent (Family Tester)
- Has one or more children taking tutoring classes
- Wants to see their child's upcoming sessions
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
- Primary language: Hebrew or English

---

## Core Features

### Phase 1 ✅ — Authentication & Dashboards
- **Teacher Login:** Google OAuth (identified by `TEACHER_EMAIL`)
- **Family Registration:** Email + password OR Google OAuth
- **Teacher Dashboard:** Overview of classes and students
- **Family Dashboard:** View upcoming sessions
- **Password Reset:** Families can reset forgotten passwords

### Phase 2 ✅ — Class & Student Management
- **Create Classes:** Teacher defines name, subject, type (group/private), day, time, duration
- **Manage Families:** Teacher can create family accounts and manage students
- **Add Students:** Teacher adds students to families OR finds independent students by email
- **Two-Way Enrollment:** Teacher enrolls students directly (auto-confirmed) OR students request to join open classes (teacher approves/rejects)
- **View Enrollments:** Class detail page shows all enrolled students + pending requests
- **Student Registration:** Independent students register with email/password or Google OAuth, create their own account

### Phase 3 — Schedule View (Family & Student)
- **Family Dashboard:** Parent sees child's upcoming sessions as cards
- **Student Dashboard:** Independent student sees their own enrolled classes + pending requests
- **Session Cards:** Display subject, teacher, day, time, duration, enrollment status
- **Pending Requests:** Show classes awaiting teacher confirmation
- **Empty State:** Message when no sessions exist
- **Settings:** Family/student can adjust preferences (language, theme)

### Phase 4 — Google Calendar Integration
- **Calendar Sync:** Classes automatically sync to teacher's designated calendar
- **Recurring Events:** Group classes create recurring events
- **Onboarding:** Teacher picks which calendar to use (work/other)
- **Read-Only:** App never reads/modifies other calendars

### Phase 5 — Reschedule & Voting
- **Create Offer:** Teacher proposes 1–2 alternative time slots
- **Vote Page:** Family sees large buttons for Option A / Option B
- **Vote Tracking:** Students vote once; voting again updates their choice
- **Results Page:** Teacher sees live vote tally
- **Resolve Offer:** Teacher picks winning slot and updates calendar event

### Phase 6 — Push Notifications & PWA
- **Install Banner:** Users see PWA install prompt (Android/iOS)
- **Push Reminders:** 24-hour and 1-hour reminders before sessions
- **Reschedule Alerts:** Families get notified when teacher creates an offer
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
4. Click "Students" → add families and manage their students
5. Create class → appears in class list with enrollment count
6. View class detail → see enrolled students, add more
7. (Future) Create reschedule offer → families vote → resolve

### Family Workflow
1. Register with email + password OR Google sign-up
2. Land on family dashboard
3. View child's upcoming sessions as cards (date, time, subject)
4. Click session → see details
5. (Future) When teacher creates reschedule offer → get push notification
6. Click notification → vote on new time slots
7. See updated session time once teacher resolves offer

### Independent Student Workflow
1. Register with email + password OR Google sign-up
2. Land on student dashboard → see enrolled classes + pending requests
3. Browse open classes → request to join
4. Receive confirmation once teacher approves
5. View enrolled sessions as cards
6. (Future) Participate in reschedule voting if teacher creates offer

---

## Success Metrics

### Teacher Adoption
- Can create and manage 5+ classes without friction
- Can enroll 10+ students across families
- Classes successfully sync to Google Calendar
- No data loss or sync errors

### Family Engagement
- Families see upcoming sessions within 1 second of login
- Push notifications deliver reliably
- Voting interface is intuitive (>90% can vote on first try)
- No errors when viewing sessions

### Technical
- Zero unhandled errors in production
- <2 second page load time on 4G
- App installable as PWA on Android and iOS
- Supports 100+ concurrent users

---

## Scope & Constraints

### In Scope (MVP)
- ✅ Teacher + family authentication
- ✅ Class and student CRUD
- ✅ Basic family dashboard
- ✅ Google Calendar sync
- ✅ Voting on reschedules
- ✅ Push notifications
- ✅ Bilingual (Hebrew/English) RTL
- ✅ Dark mode

### Out of Scope (Future)
- Attendance tracking
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
- **No Email Service:** Password reset links only (no email sending initially)

---

## Data Model Overview

### Core Entities
- **User** — Teachers, families, and independent students (email, passwordHash, role, locale, theme, Google tokens)
- **Family** — Groups students under a parent account (optional, null for independent students)
- **Student** — Either a child (linked to Family) OR an independent teen (linked to User)
  - Has optional `familyId` (parent-managed) or `userId` (self-managed)
- **Class** — Recurring tutoring session (name, subject, day, time, duration, teacher, isOpen flag)
- **Enrollment** — Student + Class relationship with status (PENDING, ACTIVE, REJECTED)
  - PENDING: student self-requested, awaiting teacher confirmation
  - ACTIVE: confirmed by teacher or teacher-enrolled (auto-confirmed)
  - REJECTED: teacher declined student's request
- **LessonSession** — Individual occurrence of a class
- **RescheduleOffer** — Teacher's proposal for new time slots
- **RescheduleOption** — Alternative time slot option
- **Vote** — Student's vote on a reschedule offer
- **PushSubscription** — Browser subscription endpoint

---

## Roadmap

| Phase | Focus | Timeline |
|-------|-------|----------|
| 1 | Auth & dashboards | ✅ Complete |
| 2 | Class & student management | ✅ Complete |
| 3 | Family schedule view | In progress |
| 4 | Google Calendar sync | Planned |
| 5 | Reschedule voting | Planned |
| 6 | Push & PWA | Planned |
| 7 | i18n (Hebrew/English) | Planned |
| 8 | Dark mode | Planned |
| 9 | Deploy & polish | Planned |

---

## Design Principles

1. **Mobile-First:** All features work flawlessly on phones first
2. **Offline-Ready:** PWA enables offline access to critical data
3. **Accessible:** WCAG 2.1 AA standards (contrast, keyboard nav, labels)
4. **Bilingual:** RTL layout works as well as LTR
5. **Fast:** <2 second loads, responsive interactions
6. **Simple:** Minimal UI, clear user flows, no cognitive overload
