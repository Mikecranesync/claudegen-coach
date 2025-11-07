# Authentication Testing Checklist

Quick checklist for testing ClaudeGen Coach authentication and Supabase integration.

**See [TESTING_GUIDE.md](../TESTING_GUIDE.md) for detailed test procedures.**

---

## Pre-Flight Check

```bash
# 1. Verify environment
cat .env | grep -E "VITE_SUPABASE_URL|VITE_SUPABASE_ANON_KEY"

# 2. Start dev server
npm run dev
# → http://localhost:5173
```

- [ ] Server starts without errors
- [ ] Console shows: "Supabase initialized successfully"
- [ ] No red errors in browser console

---

## Quick Smoke Test (5 min)

### 1. Sign Up
- [ ] Navigate to /signup
- [ ] Create user: test@example.com / TestPass123
- [ ] No validation errors
- [ ] Redirects to /dashboard
- [ ] Check Supabase Dashboard → Authentication → Users (user appears)

### 2. Logout
- [ ] Click "Logout" in header
- [ ] Redirects to /login
- [ ] Session cleared

### 3. Login
- [ ] Enter: test@example.com / TestPass123
- [ ] Redirects to /dashboard
- [ ] User info shown in header

### 4. Session Persistence
- [ ] Press F5 (refresh page)
- [ ] Still logged in
- [ ] No redirect to login

### 5. Protected Routes
- [ ] Logout
- [ ] Try accessing /stage1 directly
- [ ] Redirects to /login
- [ ] Login
- [ ] Redirects back to /stage1

### 6. Data Sync
- [ ] Navigate to /settings
- [ ] Enter fake Claude API key: sk-test-123
- [ ] Click Save
- [ ] Success message appears
- [ ] Check Supabase → Table Editor → user_settings (row appears)

**All Passed?** ✅ Authentication is working!

---

## Full Test Suite (30 min)

Refer to [TESTING_GUIDE.md](../TESTING_GUIDE.md) for comprehensive testing:

- [ ] Test Suite 1: Authentication Flows (3 tests)
- [ ] Test Suite 2: Session Persistence (3 tests)
- [ ] Test Suite 3: Protected Routes (3 tests)
- [ ] Test Suite 4: Data Persistence (3 tests)
- [ ] Test Suite 5: Multi-User Isolation (3 tests)
- [ ] Test Suite 6: Form Validation (2 tests)
- [ ] Test Suite 7: Error Handling (3 tests)
- [ ] Test Suite 8: Production Build (3 tests)

**Total**: 23 test cases

---

## Production Readiness (10 min)

### 1. Remove Dev Bypass
File: `src/pages/Auth/Login.tsx` lines 139-147

**Option 1**: Environment-based
```tsx
{import.meta.env.MODE === 'development' && (
  <div>...bypass button...</div>
)}
```

**Option 2**: Complete removal
- Delete lines 139-147

- [ ] Dev bypass removed or gated
- [ ] Test in dev mode (should show if using Option 1)
- [ ] Test in preview mode (should NOT show)

### 2. Build & Test
```bash
npm run build
npm run preview
```

- [ ] Build succeeds (0 errors)
- [ ] Preview starts
- [ ] Authentication works
- [ ] No dev bypass visible
- [ ] No console errors

---

## Issue Updates

### Issue #3 (Test Authentication)
```markdown
## Test Results - [Date]

✅ Quick Smoke Test: PASSED
- Signup: ✅
- Login: ✅
- Logout: ✅
- Session Persistence: ✅
- Protected Routes: ✅
- Data Sync: ✅

✅ Full Test Suite: [X/23] PASSED

Issues Found:
- [None / List any issues]

Ready for production: YES / NO
```

### Issue #4 (Supabase Setup)
- [ ] Mark as COMPLETE
- [ ] Add comment: "Database tables created and verified"

### Issue #5 (Remove Dev Bypass)
- [ ] Implement chosen option
- [ ] Test in production mode
- [ ] Mark as COMPLETE

---

## Troubleshooting

**Cannot signup/login:**
- Check Supabase Dashboard → Authentication → Providers (Email enabled?)
- Check browser console for errors
- Verify .env has correct credentials

**Data not syncing:**
- Check Supabase → Table Editor (tables exist?)
- Check RLS policies enabled
- Verify user is authenticated

**Session not persisting:**
- Check localStorage has 'auth-storage'
- Check Supabase token in localStorage
- Clear localStorage and try again

---

## Next Steps

1. ✅ Complete smoke test
2. ✅ Run full test suite
3. ✅ Update GitHub issues with results
4. ✅ Remove dev bypass
5. ✅ Test production build
6. ✅ Mark issues #3, #4, #5 as complete

**Happy Testing!** 🚀
