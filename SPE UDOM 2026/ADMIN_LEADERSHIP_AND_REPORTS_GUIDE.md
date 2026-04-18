# Admin Guide: Leadership Management & Annual Reports

## Problem Status

### ✅ FIXED: Annual Reports Endpoint
The `/api/annual-reports/2026/2027/` endpoint had a URL routing issue (slashes in year parameter). This has been fixed.

### ⚠️ ACTION REQUIRED: Add Leadership Members for 2026/2027

The system shows "No leadership members. Leadership records have not been filled in yet."

### ⚠️ ACTION REQUIRED: Fix Manager User Login
Gilbert (gilbert@gmail.com) cannot login with invalid credentials.

---

## Task 1: Add Leadership Members for 2026/2027

### Step 1: Access Admin Panel
1. Go to admin dashboard: `https://spe-udom-e-service-portal.onrender.com/admin/`
2. Login as admin: `speudomadmin@gmail.com` with your password
3. Click on **"Leadership Members"** in the left sidebar

### Step 2: Select the Correct Year
Should see "Leadership Members" list view. At the top right, look for:
- **Year filter** dropdown (should show "2026/2027" or similar)
- If it shows wrong year, click the year dropdown and select **"2026/2027"**

### Step 3: Add Leadership Members
Click the **"+ ADD LEADERSHIP MEMBER"** button and fill in:

#### President
- **Full Name:** [President Name]
- **Position:** President
- **Email:** [president email]
- **Year:** 2026/2027
- **Display Order:** 1

#### Vice President
- **Full Name:** [VP Name]
- **Position:** Vice President
- **Email:** [VP email]
- **Year:** 2026/2027
- **Display Order:** 2

#### General Secretary
- **Full Name:** Gilbert Muhanuzi (or actual person)
- **Position:** General Secretary
- **Email:** gilbert@gmail.com
- **Year:** 2026/2027
- **Display Order:** 3

#### Treasurer, Membership Chair, Program Chair, etc.
Continue adding other leadership positions as needed. Each gets a higher **Display Order** number.

### Step 4: Verify
- Click "Change" to view all members
- Should see all positions listed under "Leadership Members"
- Visit the public Leadership page or check the dashboard to see if they display

---

## Task 2: Fix Gilbert's Login (gilbert@gmail.com)

Gilbert is getting "Invalid credentials" errors. The password he was created with failed validation.

### Option A: Reset Password via Admin (Recommended)
1. Go to Admin > Users
2. Find "gilbert@gmail.com" in the user list
3. Click on the user record
4. In the password section, click **"Change password"**
5. Enter a STRONG password:
   - ✅ Must be 6+ characters
   - ✅ Mix of letters and numbers recommended
   - ✅ NOT all numbers (e.g., "123456" won't work)
   - ✅ NOT common words (e.g., "password", "admin", etc.)
   - ✅ Examples: `Gilbert@2026`, `SPEOfficer#1`, `Secretary2026!`
6. Also change "Confirm password" to the same value
7. Click **"Save"**

### Option B: Delete & Recreate User
1. Go to Admin Dashboard > Manage Users
2. Find "gilbert@gmail.com" in the table
3. Delete the user (confirm delete)
4. Click "+ Add User"
5. Fill in all fields:
   - Full Name: Gilbert Muhanuzi
   - Email: gilbert@gmail.com
   - Phone: (optional)
   - Role: General Secretary
   - Password: `Gilbert@2026` (or similar strong password)
   - Confirm Password: `Gilbert@2026`
6. Click "Add User" 

### Step 3: Test Login
1. Logout from admin
2. Go to Login page
3. Enter: gilbert@gmail.com / Gilbert@2026
4. Should see "Login successful" toast
5. Should see General Secretary dashboard

---

## Task 3: Annual Reports Setup (Optional)

Annual reports are now accessible via the Secretary Dashboard.

### Admin Access Annual Report
1. Login as General Secretary (gilbert@gmail.com) or admin
2. Go to **Secretary Dashboard** > **Annual Report**
3. Select year: **2026/2027**
4. Fill in sections:
   - President's Message
   - Membership Statistics
   - Technical Dissemination
   - Community Engagement
   - Member Recognition
   - Challenges & Recommendations
5. Upload images for each section
6. Fill in Financial items (if applicable)
7. Click **"Save Report"**

### View Annual Report
1. Public users can view completed reports
2. Link to reports available on President/Secretary dashboards

---

## Troubleshooting

### "Invalid credentials" error for gilbert
→ Reset password via Option A above with a stronger password

### Leadership members not showing on public page
→ Make sure you selected correct year (2026/2027) when adding members

### Annual report gives 404 error
→ Make sure year is in format `2026/2027` (with slash, not "-")
→ Annual report must exist in database first (visit page once to create it)

### Can't find Leadership Members in Admin
→ Go to Admin Dashboard > Leadership Management
→ Or use sidebar "Leadership" section

---

## Summary of Actions

- [ ] Add leadership members for 2026/2027 academic year
- [ ] Reset gilbert@gmail.com password to strong value
- [ ] Test gilbert's login works
- [ ] Fill in annual report if needed

After these steps, the system will show:
- ✅ Leadership members on Leadership page
- ✅ Gilbert can login and access Secretary Dashboard
- ✅ Annual reports endpoint responds with data (empty or populated)

