# Student Registration & Enrollment Testing - Complete Summary

**Dev Server Status:** ✅ Running on `http://localhost:3000`

---

## Quick Start Testing

### Step 1: Test Student Registration (Email/Password)
**Navigate to:** `http://localhost:3000/register`

**Test Flow:**
1. Click the **"Student"** toggle button (should highlight in blue)
2. Description below heading should change to: "Sign up to manage your tutoring schedule"
3. Fill form:
   - Full name: `Alice Student`
   - Email: `alice@example.com`
   - Password: `SecurePass123`
   - Confirm: `SecurePass123`
4. Click "Create account"

**Expected Results:**
- ✅ Redirects to `http://localhost:3000/student/dashboard`
- ✅ Displays "Welcome, Alice Student"
- ✅ Shows empty state: "You haven't enrolled in any classes yet."
- ✅ Has "Find classes" button available

**Under the Hood:**
- User created with `role: "STUDENT"`
- Student record created with `userId: <user_id>` and `familyId: null`

---

### Step 2: Test Parent Registration (Comparison)
**Navigate to:** `http://localhost:3000/register`

**Test Flow:**
1. Click the **"Parent"** toggle button
2. Description should change to: "Sign up to follow your child's schedule"
3. Fill form with parent details
4. Click "Create account"

**Expected Results:**
- ✅ Redirects to `http://localhost:3000/family/dashboard`
- ✅ User has `role: "FAMILY"`
- ✅ Family record created (not Student record)

**Why This Matters:**
- Proves both registration paths work
- Shows role-based redirects are working
- Independent students (Student path) vs. parents (Family path)

---

### Step 3: Test Student Dashboard
**After completing Step 1, you're already on:** `http://localhost:3000/student/dashboard`

**Visual Elements to Check:**
- ✅ Header: "My Classes"
- ✅ Subheader: "Welcome, Alice Student"
- ✅ Top right: "Find classes" + "Sign out" buttons
- ✅ Main content: "You haven't enrolled in any classes yet."
- ✅ CTA button: "Browse available classes"

**Code Verification:**
- Page: `app/student/dashboard/page.tsx` (Server Component)
- Gets enrollments via: `lib/actions/student.ts` → `getStudentEnrollments()`
- Shows status badges (Active | Pending) when enrollments exist

---

### Step 4: Set Up Teacher for Testing
**Scenario:** A teacher needs to create an open class for students to request

**As a Teacher:**
1. Sign in with your TEACHER_EMAIL (Google OAuth)
2. Go to `/teacher/classes` → "Create class"
3. Fill: Name: `Spanish 101`, Subject: `Spanish`, Type: `Group`, Day: `Monday`, Time: `16:00`, Duration: `45`
4. Create class
5. Go to class detail page
6. Look for **"Open Enrollment"** section
7. Click **"Open Enrollment"** button

**What Should Happen:**
- ✅ Card appears below class stats
- ✅ Text shows: "This class is open for student self-enrollment requests"
- ✅ `Class.isOpen` set to `true` in database

---

### Step 5: Test Student Browse & Request
**As the Student (Alice):**
1. From `/student/dashboard`, click "Find classes" or go to `/student/classes`
2. Should see "Spanish 101" in the list
3. Card shows:
   - Name: Spanish 101
   - Subject: Spanish
   - Type: Group
   - Schedule: Monday at 16:00
   - Duration: 45 minutes
4. Click **"Request to join"**

**Expected Results:**
- ✅ Button changes to "Requested"
- ✅ Enrollment record created with `status: "PENDING"`
- ✅ Student can request again (will update existing, not duplicate)

**Database Query to Verify:**
```sql
SELECT e.id, e.status, c.name, s.name 
FROM "Enrollment" e 
JOIN "Class" c ON e.classId = c.id 
JOIN "Student" s ON e.studentId = s.id 
WHERE s.user.email = 'alice@example.com';
```

---

### Step 6: Test Teacher Approval
**As the Teacher:**
1. Go to `/teacher/classes/<class-id>`
2. Scroll down to **"Pending Requests"** section
3. Should see "Alice Student" with **"Approve"** and **"Reject"** buttons
4. Click **"Approve"**

**Expected Results:**
- ✅ Buttons disappear
- ✅ Text changes to "Approved" (green)
- ✅ Enrollment status changed to `"ACTIVE"`
- ✅ Student count in stats increases

---

### Step 7: Verify Student Dashboard Updated
**As Student (Alice):**
1. Go back to `/student/dashboard` (refresh)
2. Previously "Pending Approval" section should be gone
3. Now shows **"Active Classes"** with green badge

**Card Should Show:**
- ✅ Class name: Spanish 101
- ✅ Subject: Spanish
- ✅ Status badge: "Active" (green)
- ✅ Schedule: Monday at 16:00

---

## Advanced Test Scenarios

### Scenario A: Teacher Direct Enrollment (Bypasses Approval)
**As Teacher:**
1. Create a second student: `bob@example.com` (as STUDENT)
2. Go to class detail page
3. (Implementation needed) Look for "Enroll by email" section
4. Type `bob@example.com` and click Enroll

**Expected:**
- ✅ Enrollment created with `status: "ACTIVE"` (no approval needed)
- ✅ Bob sees class immediately in "Active Classes"
- ✅ No pending request

**Code:** `lib/actions/family.ts` → `enrollStudentByEmail()`

---

### Scenario B: Post-Google Registration (OAuth)
**As New User:**
1. Go to `/register`
2. Toggle to "Student"
3. Click "Sign up with Google"
4. Complete Google authentication

**Expected:**
- ✅ Redirects to `/register/complete`
- ✅ Page shows: "Welcome [Name]! Are you a parent or a student?"
- ✅ Two buttons: "I'm a parent" | "I'm a student"
5. Click "I'm a student"

**Expected:**
- ✅ Creates Student record linked to User
- ✅ Sets `user.role = "STUDENT"`
- ✅ Redirects to `/student/dashboard`

**Code:** `app/register/complete/page.tsx` + `completeOAuthRegistration()`

---

### Scenario C: Login with Different Roles
**Test 1 - Student Login:**
1. Go to `/login`
2. Enter `alice@example.com` + password
3. Click Sign in

**Expected:**
- ✅ Redirects to `/student/dashboard`

**Test 2 - Parent Login:**
1. Register as parent
2. Log out
3. Login with parent email

**Expected:**
- ✅ Redirects to `/family/dashboard`

**Test 3 - Teacher Login:**
1. Go to `/login`
2. Click "Continue with Google" (using TEACHER_EMAIL)

**Expected:**
- ✅ Redirects to `/teacher/dashboard`

**Code:** `app/login/page.tsx` with role-based redirect logic

---

## Database Verification Queries

### Verify Student Registration
```sql
-- Find all students with their linked users
SELECT 
  u.id as user_id,
  u.email,
  u.role,
  s.id as student_id,
  s.name,
  s.userId,
  s.familyId,
  s.createdAt
FROM "User" u
FULL OUTER JOIN "Student" s ON u.id = s.userId
WHERE u.role = 'STUDENT'
ORDER BY u.createdAt DESC;
```

### Verify Enrollment Status
```sql
-- Check all enrollments with their status
SELECT 
  e.id,
  e.status,
  c.name as class_name,
  c.isOpen,
  s.name as student_name,
  u.email,
  e.createdAt
FROM "Enrollment" e
JOIN "Class" c ON e.classId = c.id
JOIN "Student" s ON e.studentId = s.id
JOIN "User" u ON s.userId = u.id
ORDER BY e.createdAt DESC;
```

### Verify Open Classes
```sql
-- Classes available for student self-enrollment
SELECT id, name, subject, isOpen, teacherId
FROM "Class"
WHERE isOpen = true;
```

### Role Distribution
```sql
-- Count users by role
SELECT role, COUNT(*) as count
FROM "User"
GROUP BY role;
```

---

## Common Issues & Solutions

### Issue 1: Register page doesn't show Student/Parent toggle
**Cause:** Browser cache or JavaScript not loaded
**Solution:** Hard refresh (Ctrl+Shift+R) or clear localStorage
**Check:** Open DevTools → Application → Local Storage → clear all

### Issue 2: Student redirects to Family dashboard instead of Student
**Cause:** Role not set correctly in session
**Solution:** 
- Clear session cookies
- Log out and log back in
- Check database: `SELECT * FROM "User" WHERE email = 'alice@example.com';`
- Verify role is `'STUDENT'` not `'FAMILY'`

### Issue 3: Can't find "Pending Requests" section on class detail
**Cause:** No pending enrollments exist
**Solution:**
1. Ensure student requested to join (not directly enrolled)
2. Verify enrollment status is `'PENDING'`: 
   ```sql
   SELECT * FROM "Enrollment" WHERE status = 'PENDING';
   ```

### Issue 4: Student can't see "Find classes" button
**Cause:** Page didn't load correctly
**Solution:**
- Refresh page
- Check console for errors: F12 → Console tab
- Verify user role in database

---

## Manual Testing Checklist

- [ ] **Registration Page**
  - [ ] Parent/Student toggle works
  - [ ] Correct placeholder text updates
  - [ ] Email validation works
  - [ ] Password matching validation works

- [ ] **Student Registration**
  - [ ] User created with role: STUDENT
  - [ ] Student record created with userId set
  - [ ] Redirects to /student/dashboard

- [ ] **Student Dashboard**
  - [ ] Shows correct student name
  - [ ] Empty state shows when no enrollments
  - [ ] "Find classes" button visible
  - [ ] "Sign out" button works

- [ ] **Browse Classes**
  - [ ] Only shows classes with isOpen = true
  - [ ] Displays all class info (name, subject, schedule, duration)
  - [ ] "Request to join" button functional
  - [ ] Button changes to "Requested" after click

- [ ] **Enrollment Requests**
  - [ ] Enrollment created with status PENDING
  - [ ] Prevents duplicate requests for same class
  - [ ] Teacher sees pending requests section
  - [ ] Shows student name in pending request

- [ ] **Approval Process**
  - [ ] Teacher can approve request
  - [ ] Enrollment status changes to ACTIVE
  - [ ] Student sees class in "Active Classes"
  - [ ] Status badge shows "Active" (green)

- [ ] **Role-Based Access**
  - [ ] STUDENT can't access /family/* (redirects to /login)
  - [ ] FAMILY can't access /student/* (redirects to /login)
  - [ ] TEACHER can't access /family/* or /student/*
  - [ ] Unauthenticated users redirected to /login

- [ ] **OAuth Flow**
  - [ ] Google signup redirects to /register/complete
  - [ ] Role selection works
  - [ ] Creates correct records (Family vs Student)
  - [ ] Redirects to correct dashboard

- [ ] **Login Redirects**
  - [ ] STUDENT → /student/dashboard
  - [ ] FAMILY → /family/dashboard
  - [ ] TEACHER → /teacher/dashboard

---

## Next Steps

After manual testing completes:
1. Create sample data (teacher + student + class + enrollments)
2. Test full workflow start to finish
3. Verify database consistency
4. Check for any console errors or warnings
5. Document any issues found
6. Move to Phase 3 (Schedule View implementation)

---

**Ready to test?** Start with Step 1: Student Registration (Email/Password)  
**Dev server running at:** http://localhost:3000
