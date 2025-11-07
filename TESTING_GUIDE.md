# Testing Guide - ClaudeGen Coach

## Overview

This guide provides comprehensive testing procedures for ClaudeGen Coach, focusing on authentication, Supabase integration, and end-to-end workflow testing.

**Last Updated**: November 7, 2025
**Related Issues**: #3 (Authentication Testing), #4 (Supabase Setup), #5 (Production Readiness)

---

## Prerequisites

Before testing, ensure the following are configured:

### 1. Environment Setup
```bash
# Verify .env file exists with required variables
cat .env | grep -E "VITE_SUPABASE_URL|VITE_SUPABASE_ANON_KEY|VITE_CLAUDE_API_KEY"
```

Required variables:
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anon key
- `VITE_CLAUDE_API_KEY` - Your Claude API key (optional for auth testing)

### 2. Supabase Database Setup
- [ ] `projects` table created with RLS enabled
- [ ] `user_settings` table created with RLS enabled
- [ ] Email authentication provider enabled
- [ ] All 7 RLS policies active

**Verification**: Check in Supabase Dashboard → Table Editor and Authentication → Policies

### 3. Development Server
```bash
npm install  # Ensure dependencies installed
npm run dev  # Start development server
```

**Expected**: Server starts at `http://localhost:5173`

---

## Test Suite 1: Authentication Flows

### 1.1 User Signup Flow

**Test Case**: New user can create an account successfully

**Steps**:
1. Navigate to `http://localhost:5173/signup`
2. Fill in form:
   - Display Name: `Test User`
   - Email: `test@example.com`
   - Password: `TestPass123`
   - Confirm Password: `TestPass123`
3. Click "Create Account"

**Expected Results**:
- ✅ No validation errors
- ✅ Form submits successfully
- ✅ Redirect to `/dashboard`
- ✅ User shown in Supabase Dashboard → Authentication → Users
- ✅ No console errors

**Failure Scenarios to Test**:
- Empty fields → should show "required" errors
- Invalid email format → should show email format error
- Weak password (< 6 chars) → should show password length error
- Password without uppercase → should show password strength error
- Mismatched passwords → should show "passwords don't match" error

### 1.2 User Login Flow

**Test Case**: Existing user can log in successfully

**Pre-requisite**: User created in test 1.1

**Steps**:
1. If logged in, click Logout in header
2. Navigate to `http://localhost:5173/login`
3. Fill in form:
   - Email: `test@example.com`
   - Password: `TestPass123`
4. Click "Sign In"

**Expected Results**:
- ✅ No validation errors
- ✅ Form submits successfully
- ✅ Redirect to `/dashboard`
- ✅ User display name shown in header
- ✅ User email shown in header
- ✅ Logout button visible
- ✅ No console errors

**Failure Scenarios**:
- Wrong password → should show "Invalid credentials" error
- Non-existent email → should show authentication error
- Empty fields → should show validation errors

### 1.3 User Logout Flow

**Test Case**: User can log out and session is cleared

**Pre-requisite**: User logged in

**Steps**:
1. While on any page (e.g., `/dashboard`), click "Logout" button in header
2. Confirm logout in dialog (if prompted)

**Expected Results**:
- ✅ Redirect to `/login`
- ✅ Session cleared (check DevTools → Application → Local Storage → `auth-storage`)
- ✅ Attempting to access `/dashboard` redirects to `/login`
- ✅ Header no longer shows user info

---

## Test Suite 2: Session Persistence

### 2.1 Page Refresh Persistence

**Test Case**: User session persists across page refreshes

**Steps**:
1. Log in as `test@example.com`
2. Navigate to `/stage1`
3. Press `F5` (refresh page)

**Expected Results**:
- ✅ User remains logged in
- ✅ Still on `/stage1` (no redirect to login)
- ✅ User info still in header
- ✅ No console errors
- ✅ localStorage still has `auth-storage` entry

### 2.2 Browser Session Persistence

**Test Case**: User session persists across browser sessions

**Steps**:
1. Log in as `test@example.com`
2. Navigate to `/stage3`
3. Close browser completely
4. Reopen browser
5. Navigate to `http://localhost:5173`

**Expected Results**:
- ✅ User automatically logged in
- ✅ Redirect to `/dashboard` (or last page if saved)
- ✅ User info shown in header
- ✅ No login prompt

### 2.3 Session Expiry Handling

**Test Case**: App handles expired sessions gracefully

**Steps**:
1. Log in as `test@example.com`
2. In DevTools Console, run:
   ```javascript
   localStorage.removeItem('sb-' + import.meta.env.VITE_SUPABASE_URL.split('//')[1].split('.')[0] + '-auth-token')
   ```
3. Try navigating to `/stage2`

**Expected Results**:
- ✅ Redirect to `/login`
- ✅ Session cleared
- ✅ No infinite redirect loop

---

## Test Suite 3: Protected Routes

### 3.1 Unauthenticated Access Prevention

**Test Case**: Unauthenticated users cannot access protected routes

**Pre-requisite**: User logged out

**Steps**:
1. Open incognito/private browser window
2. Navigate directly to `http://localhost:5173/dashboard`

**Expected Results**:
- ✅ Immediately redirect to `/login`
- ✅ URL shows `/login?` (may have state parameter)
- ✅ No flash of dashboard content

**Repeat for all protected routes**:
- `/` → redirects to `/dashboard` → redirects to `/login`
- `/stage1` → redirects to `/login`
- `/stage2` → redirects to `/login`
- `/stage3` → redirects to `/login`
- `/stage4` → redirects to `/login`
- `/stage5` → redirects to `/login`
- `/stage6` → redirects to `/login`
- `/settings` → redirects to `/login`

### 3.2 Post-Login Redirect to Intended Page

**Test Case**: After login, user redirected to originally requested page

**Steps**:
1. Ensure logged out
2. Navigate directly to `http://localhost:5173/stage4`
3. Should redirect to `/login`
4. Log in with valid credentials

**Expected Results**:
- ✅ After successful login, redirect to `/stage4` (NOT `/dashboard`)
- ✅ URL shows `/stage4`
- ✅ Page content loads correctly

### 3.3 Authenticated Navigation

**Test Case**: Logged-in users can navigate freely between protected pages

**Steps**:
1. Log in as `test@example.com`
2. Navigate: Dashboard → Stage 1 → Stage 2 → Stage 3 → Settings → Dashboard

**Expected Results**:
- ✅ All pages load without login prompt
- ✅ No redirects to `/login`
- ✅ User info persists in header throughout
- ✅ No console errors

---

## Test Suite 4: Data Persistence & Sync

### 4.1 Project Creation & Supabase Sync

**Test Case**: Projects are saved to Supabase database

**Steps**:
1. Log in as `test@example.com`
2. Navigate to `/stage1`
3. Fill in Stage 1 form:
   - Concept: `Test App Concept`
   - Target User: `Developers`
   - Problem: `Testing data sync`
4. Click "Analyze & Refine" (or save button)
5. Open Supabase Dashboard → Table Editor → `projects`

**Expected Results**:
- ✅ Project saved (check localStorage if no stage save button yet)
- ✅ Project appears in Supabase `projects` table
- ✅ `user_id` matches logged-in user's ID
- ✅ `stages` JSONB contains Stage 1 data
- ✅ `created_at` and `updated_at` timestamps populated

### 4.2 Settings Sync to Supabase

**Test Case**: User settings sync to Supabase

**Steps**:
1. Log in as `test@example.com`
2. Navigate to `/settings`
3. Enter dummy Claude API key: `sk-test-123456789`
4. Check notification preference
5. Click "Save Settings"
6. Open Supabase Dashboard → Table Editor → `user_settings`

**Expected Results**:
- ✅ Success message: "Settings saved successfully (synced to cloud)"
- ✅ Row appears in `user_settings` table
- ✅ `user_id` matches logged-in user
- ✅ `claude_api_key` shows entered value
- ✅ `notifications` is `true`
- ✅ `updated_at` timestamp updated

### 4.3 Cross-Session Data Persistence

**Test Case**: User data persists across logout/login

**Steps**:
1. Log in as `test@example.com`
2. Create project in Stage 1 (test 4.1)
3. Save settings (test 4.2)
4. Logout
5. Close browser
6. Reopen browser, navigate to app
7. Log in as `test@example.com`
8. Navigate to Dashboard and Settings

**Expected Results**:
- ✅ Created project appears in Dashboard
- ✅ Settings show previously saved values
- ✅ No data loss
- ✅ All data loaded from Supabase

---

## Test Suite 5: Multi-User Isolation (RLS)

### 5.1 Create Second Test User

**Test Case**: Multiple users can exist independently

**Steps**:
1. Open **incognito/private browser window**
2. Navigate to `http://localhost:5173/signup`
3. Create second user:
   - Display Name: `Test User 2`
   - Email: `test2@example.com`
   - Password: `TestPass456`

**Expected Results**:
- ✅ Signup successful
- ✅ Redirect to `/dashboard`
- ✅ Second user shown in Supabase Authentication → Users

### 5.2 Verify Data Isolation

**Test Case**: Users cannot access each other's data (RLS working)

**Pre-requisite**: Two users created with separate projects

**Steps**:
1. **Regular Window** (test@example.com):
   - Create project "User 1 Project"
   - Check Dashboard (should see "User 1 Project")
2. **Incognito Window** (test2@example.com):
   - Create project "User 2 Project"
   - Check Dashboard (should see "User 2 Project")
3. **Verification**:
   - Regular window: verify CANNOT see "User 2 Project"
   - Incognito window: verify CANNOT see "User 1 Project"
4. **Supabase Dashboard**: Table Editor → `projects`
   - Should see BOTH projects (you're admin)
   - Each has different `user_id`

**Expected Results**:
- ✅ User 1 sees only own project
- ✅ User 2 sees only own project
- ✅ No cross-user data leakage
- ✅ RLS policies enforced correctly

### 5.3 Settings Isolation

**Test Case**: User settings are isolated per user

**Steps**:
1. **Regular Window** (test@example.com):
   - Settings → Enter Claude key: `sk-user1-key`
   - Save
2. **Incognito Window** (test2@example.com):
   - Settings → Enter Claude key: `sk-user2-key`
   - Save
3. **Supabase**: Table Editor → `user_settings`

**Expected Results**:
- ✅ Two separate rows in `user_settings`
- ✅ Each has different `user_id`
- ✅ Each has different `claude_api_key`
- ✅ Users cannot see each other's settings

---

## Test Suite 6: Form Validation

### 6.1 Signup Form Validation

**Test Cases**:

| Input | Expected Result |
|-------|----------------|
| Empty name | "Display name is required" |
| Name < 2 chars | "Display name must be at least 2 characters" |
| Invalid email (`test@`) | "Please enter a valid email address" |
| Password < 6 chars | "Password must be at least 6 characters" |
| Password without uppercase | "Password must include uppercase, lowercase, and number" |
| Password without number | "Password must include uppercase, lowercase, and number" |
| Mismatched confirm password | "Passwords do not match" |

### 6.2 Login Form Validation

**Test Cases**:

| Input | Expected Result |
|-------|----------------|
| Empty email | "Email is required" |
| Invalid email format | "Please enter a valid email address" |
| Empty password | "Password is required" |
| Wrong password | Authentication error from Supabase |
| Non-existent user | Authentication error from Supabase |

---

## Test Suite 7: Error Handling

### 7.1 Network Failure Handling

**Test Case**: App handles network failures gracefully

**Steps**:
1. Log in as `test@example.com`
2. Open DevTools → Network tab
3. Set throttling to "Offline"
4. Try creating a project or saving settings

**Expected Results**:
- ✅ Error message displayed to user
- ✅ No app crash
- ✅ Data falls back to localStorage
- ✅ Console shows graceful error handling

### 7.2 Invalid Credentials Handling

**Test Case**: Invalid Supabase credentials handled

**Steps**:
1. Stop dev server
2. Temporarily change `VITE_SUPABASE_ANON_KEY` in `.env` to invalid value
3. Restart dev server: `npm run dev`
4. Navigate to app

**Expected Results**:
- ✅ Console shows Supabase connection error
- ✅ App loads (doesn't crash)
- ✅ Falls back to localStorage
- ✅ Warning shown (check console)

**Cleanup**: Restore correct VITE_SUPABASE_ANON_KEY

### 7.3 Supabase Unavailable Fallback

**Test Case**: App works offline (localStorage fallback)

**Steps**:
1. Block Supabase domain in browser DevTools or use wrong URL
2. Try using app features

**Expected Results**:
- ✅ App continues to function
- ✅ Data saved to localStorage
- ✅ Console warnings about Supabase unavailability
- ✅ No user-facing errors (graceful degradation)

---

## Test Suite 8: Production Build

### 8.1 Production Build Success

**Test Case**: App builds successfully for production

**Steps**:
```bash
npm run build
```

**Expected Results**:
- ✅ Build completes with 0 TypeScript errors
- ✅ Output in `dist/` directory
- ✅ No warnings about critical issues
- ✅ Bundle size reasonable (< 1 MB)

### 8.2 Production Preview Testing

**Test Case**: Production build works correctly

**Steps**:
```bash
npm run preview
```

**Expected Results**:
- ✅ Server starts (usually at `http://localhost:4173`)
- ✅ App loads without errors
- ✅ Authentication works
- ✅ No development bypass button visible (Issue #5)

### 8.3 Environment Variables in Production

**Test Case**: Production build uses correct environment variables

**Steps**:
1. Create `.env.production` if needed
2. Run `npm run build`
3. Check if environment-specific configs applied

**Expected Results**:
- ✅ Production uses production Supabase URL
- ✅ No development tools visible
- ✅ API keys loaded correctly

---

## Test Results Template

Use this template to document your test results:

```markdown
## Test Results - [Date]

**Tester**: [Your Name]
**Environment**: Development / Production
**Supabase Project**: [Project Name]

### Test Suite 1: Authentication Flows
- [ ] 1.1 User Signup Flow: PASS / FAIL - [Notes]
- [ ] 1.2 User Login Flow: PASS / FAIL - [Notes]
- [ ] 1.3 User Logout Flow: PASS / FAIL - [Notes]

### Test Suite 2: Session Persistence
- [ ] 2.1 Page Refresh: PASS / FAIL - [Notes]
- [ ] 2.2 Browser Session: PASS / FAIL - [Notes]
- [ ] 2.3 Session Expiry: PASS / FAIL - [Notes]

### Test Suite 3: Protected Routes
- [ ] 3.1 Unauthenticated Access: PASS / FAIL - [Notes]
- [ ] 3.2 Post-Login Redirect: PASS / FAIL - [Notes]
- [ ] 3.3 Authenticated Navigation: PASS / FAIL - [Notes]

### Test Suite 4: Data Persistence
- [ ] 4.1 Project Creation: PASS / FAIL - [Notes]
- [ ] 4.2 Settings Sync: PASS / FAIL - [Notes]
- [ ] 4.3 Cross-Session: PASS / FAIL - [Notes]

### Test Suite 5: Multi-User Isolation
- [ ] 5.1 Second User: PASS / FAIL - [Notes]
- [ ] 5.2 Data Isolation: PASS / FAIL - [Notes]
- [ ] 5.3 Settings Isolation: PASS / FAIL - [Notes]

### Test Suite 6: Form Validation
- [ ] 6.1 Signup Validation: PASS / FAIL - [Notes]
- [ ] 6.2 Login Validation: PASS / FAIL - [Notes]

### Test Suite 7: Error Handling
- [ ] 7.1 Network Failure: PASS / FAIL - [Notes]
- [ ] 7.2 Invalid Credentials: PASS / FAIL - [Notes]
- [ ] 7.3 Fallback Mode: PASS / FAIL - [Notes]

### Test Suite 8: Production Build
- [ ] 8.1 Build Success: PASS / FAIL - [Notes]
- [ ] 8.2 Preview Testing: PASS / FAIL - [Notes]
- [ ] 8.3 Environment Variables: PASS / FAIL - [Notes]

### Summary
- **Total Tests**: X
- **Passed**: X
- **Failed**: X
- **Blocked**: X

### Issues Found
1. [Issue description]
2. [Issue description]

### Recommendations
1. [Recommendation]
2. [Recommendation]
```

---

## Quick Smoke Test (5 minutes)

If you just need to verify basic functionality:

1. **Start Server**: `npm run dev`
2. **Signup**: Create test user
3. **Verify**: Check user in Supabase Dashboard
4. **Login**: Log in with test user
5. **Navigate**: Visit Dashboard → Stage 1 → Settings
6. **Logout**: Click logout button
7. **Re-login**: Verify session works

**All Pass?** ✅ Authentication working!

---

## Troubleshooting

### Issue: Cannot create user
- Check Supabase Dashboard → Authentication → Providers (Email enabled?)
- Check `.env` has correct VITE_SUPABASE_ANON_KEY
- Check browser console for specific error

### Issue: User created but cannot login
- Verify password meets requirements (6+ chars, uppercase, lowercase, number)
- Check Supabase logs for authentication errors
- Ensure RLS policies don't block auth.users access

### Issue: Data not syncing to Supabase
- Check `isSupabaseAvailable()` in console
- Verify tables exist in Supabase
- Check RLS policies allow user data access
- Verify user_id matches between auth and data

### Issue: Session doesn't persist
- Check localStorage has `auth-storage` entry
- Verify Supabase token in localStorage
- Check browser's cookie/storage settings

---

## Related Documentation

- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) - Database setup guide
- [README.md](./README.md) - Project overview
- [JUMPSTART.md](./JUMPSTART.md) - Project state
- [GitHub Issue #3](https://github.com/Mikecranesync/claudegen-coach/issues/3) - Authentication testing checklist
- [GitHub Issue #4](https://github.com/Mikecranesync/claudegen-coach/issues/4) - Database setup
- [GitHub Issue #5](https://github.com/Mikecranesync/claudegen-coach/issues/5) - Production readiness

---

**Happy Testing!** 🚀

For questions or issues, create a GitHub issue or comment on existing issues #3, #4, or #5.
