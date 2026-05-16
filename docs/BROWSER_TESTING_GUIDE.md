# Browser Testing Guide - Student Registration Flow

**Dev Server:** http://localhost:3000 ✅ Running

---

## Test 1: Student Registration (Email/Password)

### Step-by-Step Instructions

**1. Navigate to Register Page**
- Open browser: `http://localhost:3000/register`
- You should see the ClassSync logo and "Create account" heading

**Expected:**
- ✅ Card with toggle options: "Parent" (default) and "Student"
- ✅ Parent is selected by default
- ✅ Description shows: "Sign up to follow your child's schedule"
- ✅ Google sign-up button visible
- ✅ Email/password form visible

---

**2. Toggle to Student**
- Click the **"Student"** button on the left
- Observe the change

**Expected:**
- ✅ Button highlights (blue background)
- ✅ Description changes to: "Sign up to manage your tutoring schedule"
- ✅ Form stays the same (still shows email/password fields)
- ✅ Google button now says "Sign up with Google" (ready for student auth)

---

**3. Fill Registration Form**
Enter the following:
```
Full name:      Alice Chen
Email:          alice.chen@example.com
Password:       SecurePass123
Confirm:        SecurePass123
```

**Expected:**
- ✅ Each field accepts input
- ✅ Password field shows/hides password toggle (eye icon)
- ✅ Confirm field also has eye icon
- ✅ No errors while typing valid data

---

**4. Submit Form**
- Click **"Create account"** button
- Wait 2-3 seconds for server response

**Expected:**
- ✅ Button shows "Creating account…" while loading
- ✅ NO errors displayed
- ✅ Page redirects to `http://localhost:3000/student/dashboard`
- ✅ URL changes (you can see it in the address bar)

---

## Test 2: Verify Student Dashboard

After successful registration, you should be on `/student/dashboard`

### Dashboard Elements

**Top Section:**
- ✅ Heading: "My Classes"
- ✅ Subheading: "Welcome, Alice Chen"
- ✅ Two buttons in top right:
  - "Find classes"
  - "Sign out"

**Main Content:**
- ✅ Shows message: "You haven't enrolled in any classes yet."
- ✅ Has a blue button: "Browse available classes"

**Visual Check:**
- ✅ Dark theme support (check if your OS is in dark mode, text adjusts)
- ✅ Responsive layout (try resizing window to mobile size ~375px)
- ✅ All text is legible and properly spaced

---

## Test 3: Student Login Redirect

### Test the Login Redirect Logic

**Step 1: Sign Out**
- Click **"Sign out"** button in top right
- Wait for redirect

**Expected:**
- ✅ Redirects to `http://localhost:3000/login`
- ✅ Session is cleared

---

**Step 2: Log Back In as Student**
- On login page, fill in:
  ```
  Email:    alice.chen@example.com
  Password: SecurePass123
  ```
- Click **"Sign in"**
- Wait for redirect

**Expected:**
- ✅ NO redirect to `/family/dashboard` ❌ (that would be wrong)
- ✅ Redirects to `/student/dashboard` ✅ (correct!)
- ✅ Shows "Welcome, Alice Chen" again
- ✅ Proves role-based redirect is working

---

## Test 4: Browse Available Classes (Setup Required)

This test requires a teacher to create an open class first.

### Part A: Teacher Setup (if you have access)

**1. Open new browser tab/window**
- Go to `http://localhost:3000/login`
- Sign in with your **TEACHER_EMAIL** using Google
  - (Should redirect to `/teacher/dashboard`)

**2. Create a Class**
- Go to `/teacher/classes`
- Click "Create class"
- Fill in:
  ```
  Class name:     Spanish 101
  Subject:        Spanish
  Class type:     Group
  Day:            Monday
  Start time:     4:00 PM (16:00)
  Duration:       45 minutes
  ```
- Click "Create class"
- Wait for redirect to class list

**3. Open the Class for Enrollment**
- Click the "Spanish 101" class card
- Scroll down to **"Open Enrollment"** section
- Click **"Open Enrollment"** button
- Text should change to: "This class is open for student self-enrollment requests"

---

### Part B: Student Browsing Classes

**Back in Student Browser Tab:**
- Refresh `/student/dashboard` (or reload)
- Click **"Find classes"** button

**Expected:**
- ✅ Redirects to `/student/classes`
- ✅ Shows "Available Classes" heading
- ✅ Shows "Spanish 101" card with:
  - Name: Spanish 101
  - Subject: Spanish
  - Type: Group
  - Day: Monday at 4:00 PM
  - Duration: 45 minutes
- ✅ **"Request to join"** button is visible and clickable

---

## Test 5: Request to Join Class

**On `/student/classes` page:**
- Click **"Request to join"** button on the Spanish 101 card
- Wait 1-2 seconds

**Expected:**
- ✅ Button text changes to **"Requested"**
- ✅ Button becomes disabled (greyed out)
- ✅ No error message
- ✅ URL stays the same (still on `/student/classes`)

**Why this matters:**
- Enrollment created in database with `status: "PENDING"`
- Teacher can now approve this request

---

## Test 6: Teacher Approval

### Teacher Side:

**1. Go to Class Detail**
- Teacher opens `/teacher/classes` in their tab
- Clicks on "Spanish 101" class
- Scrolls to **"Pending Requests"** section

**Expected:**
- ✅ Section appears (only if there are pending requests)
- ✅ Shows "Alice Chen" or student name
- ✅ Two buttons: **"Approve"** and **"Reject"**

**2. Approve the Request**
- Click **"Approve"** button
- Wait 1-2 seconds

**Expected:**
- ✅ Buttons disappear
- ✅ Text changes to: "Approved" (in green)
- ✅ Enrollment status changes to ACTIVE in database
- ✅ Class enrollment count increases (bottom of page)

---

## Test 7: Verify Student Sees Active Enrollment

### Back in Student Browser Tab:

**1. Return to Dashboard**
- Go to `/student/dashboard` or click "Back to dashboard" link
- Reload the page (F5)

**Expected:**
- ✅ NO longer shows "You haven't enrolled in any classes yet."
- ✅ New section appears: **"Active Classes"**
- ✅ Shows "Spanish 101" card with:
  - Green badge: "Active"
  - Name: Spanish 101
  - Subject: Spanish
  - Schedule: Monday at 4:00 PM
  - Duration: 45 minutes

**Why this matters:**
- Proves the enrollment workflow end-to-end
- Student sees real-time status change
- Role-based dashboards working correctly

---

## Test 8: Test Parent Registration (Comparison)

**Optional but recommended for completeness**

**1. Open New Incognito Window**
- Ctrl+Shift+N (or Cmd+Shift+N on Mac)
- Go to `http://localhost:3000/register`

**2. Register as Parent**
- Click **"Parent"** button (toggle)
- Fill in:
  ```
  Full name:      Bob Johnson
  Email:          bob.johnson@example.com
  Password:       SecurePass123
  Confirm:        SecurePass123
  ```
- Click "Create account"

**Expected:**
- ✅ Redirects to `/family/dashboard` (NOT `/student/dashboard`)
- ✅ Shows "Welcome, Bob Johnson"
- ✅ Different UI from student dashboard
- ✅ Proves different roles route to different dashboards

---

## Test 9: Route Protection

**Test that unauthorized access is blocked**

**1. Student Accessing Family Routes**
- As logged-in student, try to go to: `http://localhost:3000/family/dashboard`

**Expected:**
- ✅ Redirects to `/login`
- ✅ Session cleared (proves role check worked)

---

**2. Family Accessing Student Routes**
- Log out
- Log in as parent (if you created one)
- Try to go to: `http://localhost:3000/student/dashboard`

**Expected:**
- ✅ Redirects to `/login`
- ✅ Access denied

---

**3. Unauthenticated Access**
- Log out
- Try to go to: `http://localhost:3000/student/dashboard`

**Expected:**
- ✅ Immediately redirects to `/login`
- ✅ No access to protected routes

---

## Test 10: Google OAuth (Post-Selection)

**Optional - Tests OAuth flow**

**1. Start New Registration**
- Go to `http://localhost:3000/register`
- Toggle to **"Student"**
- Click **"Sign up with Google"**

**Expected:**
- ✅ Redirects to Google login
- ✅ After signing in with Google, redirects to `http://localhost:3000/register/complete`

**2. Role Selection Page**
- Should see: "Welcome [Your Name]! Let's get your account set up"
- Two buttons: "I'm a parent" | "I'm a student"
- Click **"I'm a student"**

**Expected:**
- ✅ Processing message shows briefly
- ✅ Redirects to `/student/dashboard`
- ✅ Student record created in database
- ✅ User.role = "STUDENT"

---

## Testing Checklist

**Registration Flow:**
- [ ] Can toggle between Parent and Student
- [ ] Description text changes with toggle
- [ ] Form validation works (try empty fields)
- [ ] Password confirmation validation works
- [ ] Student registration redirects to `/student/dashboard`
- [ ] Parent registration redirects to `/family/dashboard`

**Student Dashboard:**
- [ ] Shows correct student name
- [ ] Shows empty state when no enrollments
- [ ] "Find classes" button is clickable
- [ ] "Sign out" button works

**Browsing Classes:**
- [ ] Only shows classes with `isOpen = true`
- [ ] All class info displays correctly
- [ ] "Request to join" button works

**Enrollment Request:**
- [ ] Button changes to "Requested"
- [ ] Prevents duplicate requests
- [ ] Database stores enrollment with PENDING status

**Teacher Approval:**
- [ ] Teacher sees pending requests
- [ ] Approve button updates status
- [ ] Student dashboard reflects change immediately (after refresh)

**Role-Based Access:**
- [ ] STUDENT can't access `/family/*`
- [ ] FAMILY can't access `/student/*`
- [ ] TEACHER can't access family/student routes
- [ ] Unauthenticated users redirected to `/login`

**Visual/UX:**
- [ ] Responsive at 375px (mobile)
- [ ] Responsive at 1920px (desktop)
- [ ] Dark mode works correctly
- [ ] No console errors (F12 → Console)
- [ ] Loading states show (buttons say "Creating…", "Approving…")

---

## Common Issues & Solutions

### Issue: Form submits but nothing happens
**Solution:**
- Check console (F12 → Console tab)
- Look for red error messages
- Try refreshing the page
- Check if database is accessible

### Issue: Redirects to wrong dashboard
**Solution:**
- Clear browser cookies: F12 → Application → Cookies → delete all
- Clear localStorage: F12 → Application → Local Storage → delete all
- Try logging in again
- Verify user role in database

### Issue: "Can't find /register/complete"
**Solution:**
- This page is only shown after Google OAuth
- It's not accessible directly
- Complete a full Google sign-up flow

### Issue: Button disabled after requesting class
**Solution:**
- This is normal - prevents duplicate requests
- Refresh the page to verify the enrollment exists
- Check database for PENDING enrollment

---

## Success Indicators

If all tests pass, you'll see:

✅ Student can register with email/password  
✅ Student sees their own dashboard  
✅ Student can browse open classes  
✅ Student can request to join classes  
✅ Teacher can approve requests  
✅ Student sees enrollment status update  
✅ Different roles see different dashboards  
✅ Unauthorized access blocked  
✅ All UX flows smooth and error-free  

---

## Next Steps

After manual testing:
1. Document any issues found
2. Test on mobile device (iPhone/Android)
3. Test with multiple browsers (Chrome, Firefox, Safari)
4. Create sample data for screenshots
5. Move to Phase 3 (Schedule View)

**Ready to test?** Start with Test 1 above! 🚀
