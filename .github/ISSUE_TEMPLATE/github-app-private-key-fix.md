# 🔑 Fix GitHub App Private Key Format Error

## Status
- **Phase**: Autonomous Bot Phase 4 (Git Operations)
- **Issue**: JWT generation failing due to incorrect private key format
- **Priority**: HIGH (blocks all bot functionality)
- **Blocker**: Yes (prevents PR creation)

## Problem Summary

The autonomous bot successfully receives and validates GitHub webhooks, but fails when attempting to authenticate with the GitHub App due to a private key formatting error.

### Error Message
```
❌ Failed to generate JWT: TypeError: "pkcs8" must be PKCS#8 formatted string
```

### What's Working ✅
- ✅ Cloudflare Worker deployed (Version 1.2.0, ID: c4c727a8-b8f0-4139-a523-f3d1d16609a3)
- ✅ Phase 4 code complete (Git Data API choreography implemented)
- ✅ GitHub App configured with Issues permission
- ✅ Webhook events being received (`issue_comment` events working)
- ✅ Webhook signature validation passing
- ✅ Activation command detection working (`@claude fix`)
- ✅ Model fallback logic implemented (tries 3 Claude models)

### What's Not Working ❌
- ❌ GitHub App authentication (JWT generation fails)
- ❌ Pull Request creation (blocked by auth failure)
- ❌ All Git operations (blob/tree/commit creation blocked)

## Root Cause

The `GITHUB_APP_PRIVATE_KEY` Wrangler secret is not formatted correctly for the `jose` library. The library requires:
1. Proper PKCS#8 header: `-----BEGIN PRIVATE KEY-----`
2. Base64-encoded key body with newlines every 64 characters
3. Proper PKCS#8 footer: `-----END PRIVATE KEY-----`

The current secret may have:
- Missing or incorrect header/footer
- Newlines replaced with literal `\n` characters instead of actual line breaks
- Incorrect encoding

## Solution Steps

### Step 1: Download GitHub App Private Key

1. Go to https://github.com/settings/apps/claudegen-coach-bot
2. Scroll to **"Private keys"** section
3. If you have an existing key:
   - Download the `.pem` file
4. If not:
   - Click **"Generate a private key"**
   - Save the downloaded `.pem` file

### Step 2: Update Wrangler Secret with Correct Format

**Option A: PowerShell (Recommended for Windows)**

```powershell
cd C:\Users\hharp\codegen\cloudflare-worker

# Replace with your actual .pem file path
$pemFile = "C:\Users\hharp\Downloads\claudegen-coach-bot.*.private-key.pem"

# Read and prepare the key
$key = Get-Content $pemFile -Raw
$key = $key.Trim()

# Update the secret
echo $key | npx wrangler secret put GITHUB_APP_PRIVATE_KEY
```

**Option B: Manual Paste (Alternative)**

```bash
cd cloudflare-worker
npx wrangler secret put GITHUB_APP_PRIVATE_KEY
```

Then:
1. Paste the ENTIRE `.pem` file content (including `-----BEGIN` and `-----END` lines)
2. Press **Enter**
3. Press **Ctrl+Z** then **Enter** on Windows (or **Ctrl+D** on Linux/Mac)

### Step 3: Test the Bot

1. Go to issue #9: https://github.com/Mikecranesync/claudegen-coach/issues/9
2. Add a comment: `@claude fix hello.txt`
3. Watch the Cloudflare Worker logs:
   ```bash
   cd cloudflare-worker
   npx wrangler tail --format pretty
   ```

## Expected Log Output (Success)

```
[xxx] Received webhook: issue_comment
✅ Signature validated
🤖 Activation command detected!
👀 Processing fix request...
🔧 Creating authenticated GitHub client...
🔐 Generating JWT for GitHub App authentication...
✅ JWT generated successfully
🔍 Getting installation ID...
✅ Installation ID: 93752942
🔑 Exchanging JWT for installation token...
✅ Installation token acquired
✅ GitHub client initialized with App authentication
🧠 Calling Claude API...
✅ Code fix generated successfully
📝 Creating Pull Request...
📍 Step 1: Getting base commit SHA...
✅ Base commit SHA: [sha]
📦 Step 2: Creating blob(s)...
✅ Created 1 blob(s)
🌳 Step 3: Creating tree...
✅ Tree created: [sha]
📝 Step 4: Creating commit...
✅ Commit created: [sha]
🌿 Step 5: Creating branch and pull request...
✅ Branch created: claude/fix-issue-9
✅ Pull request created: #10
✅ Phase 4 completed successfully
```

## Verification Steps

After updating the secret and commenting on the issue:

1. **Check logs for JWT success**:
   - Look for `✅ JWT generated successfully`
   - Should NOT see `❌ Failed to generate JWT`

2. **Verify PR created**:
   - Go to https://github.com/Mikecranesync/claudegen-coach/pulls
   - Should see new PR from branch `claude/fix-issue-9`

3. **Check PR contents**:
   - PR should have description
   - PR should have file changes
   - Commit message should follow bot format

## Technical Details

### Files Involved

**Authentication (`cloudflare-worker/lib/auth.js`)**:
- `generateJWT()` - Creates JWT from App ID + Private Key (uses `jose` library)
- `getInstallationId()` - Gets installation ID for repository
- `getInstallationToken()` - Exchanges JWT for installation token
- `createAuthenticatedGitHubClient()` - Main entry point

**Git Operations (`cloudflare-worker/lib/git-operations.js`)**:
- 5-step Git Data API choreography
- Creates blobs, trees, commits, branches, and PRs

**Main Worker (`cloudflare-worker/index.js`)**:
- Orchestrates webhook handling
- Calls auth and git-operations modules

### Deployment Info

- **Worker URL**: https://claudegen-bot.mike-be8.workers.dev
- **Current Version**: 1.2.0 (ID: c4c727a8-b8f0-4139-a523-f3d1d16609a3)
- **Deployed**: November 9, 2025, 8:19 AM
- **GitHub App ID**: 2255796
- **Webhook Secret**: Configured (bdcaace9f93490ab2f88342aead1b842)

### Secrets Configuration

Current secrets (check with `npx wrangler secret list`):
- `WEBHOOK_SECRET` ✅ Configured
- `GITHUB_APP_ID` ✅ Configured (2255796)
- `GITHUB_APP_PRIVATE_KEY` ❌ Incorrect format (needs fixing)
- `ANTHROPIC_API_KEY` ✅ Configured

## Troubleshooting

### If JWT generation still fails:

**Check private key format**:
```bash
# The .pem file should look like this:
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
[many lines of base64]
...xYzN1234567890
-----END PRIVATE KEY-----
```

**Common issues**:
- Missing `-----BEGIN PRIVATE KEY-----` header
- Using RSA PRIVATE KEY instead of PRIVATE KEY (need PKCS#8 format)
- Newlines replaced with literal `\n` strings
- Extra whitespace or formatting

**Convert RSA to PKCS#8** (if needed):
```bash
# If your key says "-----BEGIN RSA PRIVATE KEY-----"
openssl pkcs8 -topk8 -inform PEM -outform PEM -nocrypt -in rsa-key.pem -out pkcs8-key.pem
```

### If webhook isn't received:

1. Check GitHub App webhook settings:
   - URL: https://claudegen-bot.mike-be8.workers.dev/webhook
   - Content type: application/json
   - Events: Issue comments ✅

2. Check recent deliveries in GitHub:
   - https://github.com/settings/apps/claudegen-coach-bot
   - Scroll to "Recent Deliveries"
   - Look for 200 OK responses

3. Verify worker is deployed:
   ```bash
   curl -X POST https://claudegen-bot.mike-be8.workers.dev/webhook
   # Should return: "Forbidden: Missing signature"
   ```

## Success Criteria

✅ This issue is resolved when:
1. Comment `@claude fix hello.txt` on issue #9
2. Logs show `✅ JWT generated successfully`
3. Pull Request is created automatically
4. PR has proper description and file changes
5. No error messages in logs

## Related Issues

- #7 - Autonomous Bot Implementation Plan (6-phase roadmap)
- #8 - Manual Setup Instructions (completed)
- #9 - Phase 3 Test Issue (used for testing)

## Next Steps After Fix

Once this is resolved:
1. ✅ Close this issue
2. ✅ Mark Phase 4 as complete
3. 🔄 Proceed to Phase 5: Status Comments (post success/failure to issues)
4. 🔄 Proceed to Phase 6: Testing & Documentation

---

**Created**: November 9, 2025
**Phase**: Bot Phase 4 (Git Operations)
**Priority**: HIGH
**Blocker**: YES
