# Admin Guide: Creating System Users

## Overview
When creating manager users (officers, presidents, general secretaries) through the Admin Dashboard, follow these guidelines to ensure users can successfully login.

---

## Password Requirements

When creating a new user, the password **must**:

✓ **DO:**
- Have minimum 6 characters
- Include a mix of letters and numbers
- Be unique and strong
- Examples: `SPEUdom@2026`, `Manager123!`, `Ch@pter2026`, `Officer#2026`

✗ **DON'T:**
- Use all numbers (❌ "123456", "202425")
- Use dictionary words (❌ "password", "admin", "chapter", "secret")
- Use common sequences (❌ "12345678", "abcdef")
- Include user's name or email (❌ gilbert@gmail.com → don't use "gilbert")
- Use overly simple patterns (❌ "111111", "aaaaaa")

---

## Step-by-Step: Creating a Manager User

### Example: Creating General Secretary "Gilbert"

1. **Click "+ Add User"** on the Admin Dashboard, Manage Users section

2. **Fill Required Fields:**
   - **Full Name:** Gilbert Muhanuzi
   - **Email:** gilbert@gmail.com
   - **Role:** General Secretary (select from dropdown)
   - **Phone:** +255 123 456 789 (optional but recommended)
   - **Year of Study:** Leave blank if not a student role

3. **Set Password:**
   - **Password:** `SPEUdom@2026` (or similar - see examples below)
   - **Confirm Password:** Repeat the same password
   
   ⚠️ Look for the "Password Requirements" box above the password fields - it shows exactly what's allowed

4. **Click "Add User"**
   - If successful: ✅ Green toast: "User gilbert@muhanuzi added successfully!"
   - If failed: ❌ Red error message showing what's wrong

---

## Password Examples by Role

### Officers/Leadership (Strong Passwords)
- `SPEUdom@2026`
- `President#2026`
- `Secretary123!`
- `Leadership2024@UDOM`
- `Officer#General2026`

### Why These Work:
- Mix of letters, numbers, and symbols
- Not dictionary words
- Not similar to any user name/email
- 6+ characters
- Unique and hard to guess

---

## Troubleshooting

### Error: "Passwords do not match"
**Issue:** Password and confirm password fields have different values
**Fix:** Make sure both password fields contain exactly the same text

### Error: ["This password is too common."]
**Issue:** Password is a common/weak password
**Solution:** Use a stronger password with more variety. Examples:
- ❌ Bad: "password", "admin", "123456", "chapter"
- ✅ Good: "SPEUdom@2026", "Ch@pter#2024"

### Error: ["This password is entirely numeric."]
**Issue:** Password contains only numbers
**Solution:** Add letters or symbols
- ❌ Bad: "202425", "123456"
- ✅ Good: "2024Apr25", "SPE202425"

### Error: ["The password is too similar to the username."]
**Issue:** Password is too similar to email/name
**Solution:** Use a completely different password
- If user is "gilbert@gmail.com", ❌ don't use: "gilbert123", "gilbert2024"
- ✅ Use instead: "SPEUdom@2026", "Leader#2024"

### User Created But Can't Login
**Issue:** Backend accepted password but user still gets "invalid credentials"
**Cause:** Password validation may have rejected password at creation time
**Fix:** 
1. Delete the broken user
2. Try creating again with example password from list above
3. Check exact error message shown in red on form

---

## After Creating User

1. **Verify User Created:** User appears in the "Manage Users" table below the form
2. **Share Credentials:** Securely give the user:
   - Email: (what you entered)
   - Temporary Password: (what you set)
3. **User Should:** Login and change password immediately in Settings > Password Change
4. **Security:** Passwords are hashed and never visible after creation

---

## Manager User Roles

Available roles when creating users:
- **Admin** - Full system access (create users, manage events, etc.)
- **President** - Leadership access with content management
- **General Secretary** - Officer access with event/election management
- **Member** - Regular student access

---

## Tips

💡 **Password Pattern:** Use acronyms + year + symbol:
- UDOM Officers created in 2026: `UDOMOff@2026`
- SPE chapter leaders: `SPELead#2026`
- Event organizers: `EventOrg@2024`

💡 **Security:** 
- Each password should be unique
- Don't reuse passwords across users
- After creation, users should set their own password

---

## Getting Help

If creating users fails:
1. Check the red error message - it tells you what's wrong
2. Verify password matches the requirements list at top
3. Ensure email hasn't been used before
4. Try a different password from the examples above
5. Contact admin if error persists

---

**Last Updated:** 2024
**Version:** 1.0
