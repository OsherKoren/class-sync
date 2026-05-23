# Student Registration & Enrollment Testing Guide

## Overview
This document describes how to test the independent student registration and two-way enrollment features.

---

## Feature 1: Student Registration (Email/Password)

### Test Steps:
1. Navigate to `http://localhost:3000/register`
2. Click the **"Student"** button (toggles from "Parent")
3. Fill in:
   - Full name: `Test Student`
   - Email: `student@example.com`
   - Password: `TestPass123`
   - Confirm: `TestPass123`
4. Click **"Create account"**

### Expected Results:
✅ Account created in database with `role: "STUDENT"`  
✅ User record created linked to Student record via `userId`  
✅ Student record has `familyId: null` (independent)  
✅ Redirects to `/student/dashboard`  
✅ Dashboard shows "Welcome, Test Student"  
✅ "Find classes" button visible in top right  

### Database Verification:
```sql
SELECT u.id, u.name, u.email, u.role, s.id as student_id, s.userId, s.familyId 
FROM "User" u 
LEFT JOIN "Student" s ON u.id = s.userId 
WHERE u.role = 'STUDENT' 
ORDER BY u.createdAt DESC LIMIT 1;
```

---

## Feature 2: Student Dashboard

### Test Steps:
1. Complete Feature 1 (student registration)
2. You should land on `/student/dashboard` automatically

### Expected Results:
✅ Shows "My Classes" heading  
✅ Shows student name below heading  
✅ "Find classes" button in top right  
✅ "Sign out" button in top right  
✅ Shows empty state: "You haven't enrolled in any classes yet."  
✅ "Browse available classes" button visible  

### Code Paths:
- Server Component: `app/student/dashboard/page.tsx`
- Action: `lib/actions/student.ts` → `getStudentEnrollments()`

---

## Feature 3: Browse All Classes

### Prerequisites:
- Logged in as a student
- A teacher has created at least one class

### Test Steps:
1. From student dashboard, click **"Find classes"** or go to `/student/classes`
2. View list of all classes (open and closed)
3. Click **"Request to join"** on any class (including closed/full ones)

### Expected Results:
✅ Page shows "Available Classes"  
✅ Each class card shows: name, subject, type, schedule  
✅ Closed classes show a "Closed" badge; full classes show "Class full" in red  
✅ GROUP classes show "X spots left" when capacity is set  
✅ "Request to join" button is always clickable (outline style when class is closed)  
✅ After clicking, button changes to "Requested"  
✅ Enrollment record created with `status: "PENDING"`  

### Database Verification:
```sql
SELECT e.id, e.status, c.name, s.name as student_name 
FROM "Enrollment" e 
JOIN "Class" c ON e.classId = c.id 
JOIN "Student" s ON e.studentId = s.id 
WHERE e.status = 'PENDING' 
ORDER BY e.createdAt DESC;
```

---

## Feature 4: Student Enrollments with Status

### Test Steps:
1. Student requests to join a class (Feature 3)
2. Teacher approves the request (Feature 6)
3. Student returns to dashboard

### Expected Results:
✅ Dashboard shows two sections:
   - **Active Classes** (status = ACTIVE) — green badge
   - **Pending Approval** (status = PENDING) — yellow badge  
✅ Cards show: class name, subject, day, time  
✅ Pending requests disappear once approved  

### Code Paths:
- Dashboard: `app/student/dashboard/page.tsx`
- Query: `lib/actions/student.ts` → `getStudentEnrollments()`

---

## Feature 5: Teacher Enrollment Management

### Prerequisites:
- Logged in as teacher
- At least one class created
- An independent student has registered

### Test Steps:
1. Go to teacher class detail page (`/teacher/classes/[id]`)
2. Look for **"Open Enrollment"** toggle section
3. Click "Close Enrollment" or "Open Enrollment" button

### Expected Results:
✅ Toggle section visible below class info  
✅ For GROUP classes: shows "X / Y enrolled" capacity display  
✅ Text changes between:
   - "This class is open for student self-enrollment requests"
   - "Only you can enroll students in this class"
   - "Reached capacity — reopen to accept more students" (when auto-closed)  
✅ `Class.isOpen` updated in database  
✅ Enrolled stats card shows "X / Y" when maxCapacity is set  

### Database Verification:
```sql
SELECT id, name, "isOpen", "maxCapacity" FROM "Class";
```

---

## Feature 6: Teacher Approves Student Requests

### Prerequisites:
- Student has requested to join a class (Feature 3)
- Teacher is viewing the class detail page

### Test Steps:
1. Teacher navigates to class detail page
2. Scroll to **"Pending Requests"** section
3. See student's request with Approve/Reject buttons
4. Click **"Approve"**

### Expected Results:
✅ "Pending Requests" section shows students requesting to join  
✅ "Approve" button changes to "Approved" (green text)  
✅ Enrollment status changes from PENDING → ACTIVE  
✅ Student sees class move from "Pending Approval" → "Active Classes"  

### Code Paths:
- Teacher component: `components/teacher/EnrollmentManagement.tsx`
- Action: `lib/actions/guardian.ts` → `approveEnrollment()`

---

## Feature 7: Teacher Direct Enrollment

### Prerequisites:
- Logged in as teacher
- An independent student has registered

### Test Steps:
1. Go to `/teacher/students`
2. Look for "Find student by email" input (if implemented)
3. OR go to class detail page and look for "Enroll by email" form
4. Type student's email and search/enroll

### Expected Results:
✅ Student found by email  
✅ Enrollment created with `status: "ACTIVE"` (no approval needed)  
✅ Class enrollment count increases  
✅ Student appears in "Active Classes" immediately  

### Code Paths:
- Action: `lib/actions/guardian.ts` → `enrollStudentByEmail()`

---

## Feature 8: Post-OAuth Role Selection

### Test Steps:
1. Go to `/register`
2. Toggle to **"Student"** (or stay on "Parent")
3. Click **"Sign up with Google"**
4. Complete Google sign-in
5. Should redirect to `/register/complete`

### Expected Results:
✅ Redirects to `/register/complete` after Google sign-in  
✅ Page shows: "Let's get your account set up"  
✅ Two buttons: "I'm a parent" and "I'm a student"  
✅ Clicking appropriate button:
   - Parent → creates Family record → redirects to `/family/dashboard`
   - Student → creates Student record → redirects to `/student/dashboard`  

### Code Paths:
- Page: `app/register/complete/page.tsx`
- Action: `lib/actions/auth.ts` → `completeOAuthRegistration()`

---

## Feature 9: Role-Based Login Redirect

### Test Steps:
1. Register as a student
2. Sign out
3. Go to `/login`
4. Enter student credentials
5. Click "Sign in"

### Expected Results:
✅ Redirects to `/student/dashboard` (not `/family/dashboard`)  
✅ TEACHER role would redirect to `/teacher/dashboard`  
✅ FAMILY role would redirect to `/family/dashboard`  

### Code Paths:
- Login page: `app/login/page.tsx`
- Redirect logic based on `session.user.role`

---

## Feature 10: Route Protection

### Test Steps:
1. Log out
2. Try to access `/student/dashboard`
3. Try to access `/student/classes`

### Expected Results:
✅ Redirects to `/login` (not authenticated)  

### Test with Wrong Role:
1. Log in as FAMILY user
2. Try to access `/student/dashboard`

### Expected Results:
✅ Redirects to `/login` (wrong role)  

### Code Paths:
- Proxy: `proxy.ts`
- Layout: `app/student/layout.tsx`

---

## Database Schema Verification

Run these queries to verify all schema changes are in place:

```sql
-- Check Role enum includes STUDENT
SELECT unnest(enum_range(NULL::"Role"));

-- Check Student table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'Student' 
ORDER BY ordinal_position;

-- Check Enrollment table has status
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'Enrollment' 
ORDER BY ordinal_position;

-- Check Class table has isOpen and maxCapacity
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'Class' 
ORDER BY ordinal_position;

-- Check sample data
SELECT u.role, COUNT(*) as count 
FROM "User" u 
GROUP BY u.role;
```

---

## Troubleshooting

### Issue: "Student not found" when searching by email
- Verify student registered with email/password (not Google)
- Check database: `SELECT * FROM "User" WHERE email = 'student@example.com';`
- Verify corresponding Student record exists

### Issue: Enrollment doesn't change status
- Clear browser cache and hard refresh
- Check network tab for API errors
- Verify teacher owns the class: `SELECT teacherId FROM "Class" WHERE id = '...';`

### Issue: Can't see pending requests section
- Verify student requested to join (status = PENDING)
- Check class detail page is loading correctly
- Verify `getClassById` is including enrollment status

---

## Success Checklist

- [ ] Student can register with email/password
- [ ] Student lands on correct dashboard
- [ ] Student can browse open classes
- [ ] Student can request to join class
- [ ] Teacher sees pending requests
- [ ] Teacher can approve requests
- [ ] Approved request moves to Active Classes
- [ ] Post-OAuth redirects to /register/complete
- [ ] Role selection works correctly
- [ ] Login redirects to correct dashboard
- [ ] Route protection working (can't access /student/* without STUDENT role)
