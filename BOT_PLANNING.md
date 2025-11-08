# Autonomous Bot Implementation Roadmap

**Status**: Phase 1 Complete (Foundation)
**Created**: November 7, 2025
**GitHub Issue**: [#7](https://github.com/Mikecranesync/claudegen-coach/issues/7)
**Reference**: `Autonomous Claude GitHub Issue Fixes.pdf`

---

## 🎯 Project Overview

Build a serverless, webhook-driven autonomous AI development agent that:
- Responds to `@claude fix` commands in GitHub issue comments
- Fetches relevant code context from the repository
- Uses Claude API to generate code fixes with structured output
- Creates Pull Requests automatically via Git Data API
- Operates 24/7 on free-tier serverless platforms ($0/month)

---

## 📊 Current Status

### ✅ Phase 1: Foundation (COMPLETE)

**Completed Items:**
- [x] Created `CLAUDE.md` with comprehensive coding standards (3,600+ lines)
- [x] Created GitHub Issue #7 with full implementation plan
- [x] Updated JUMPSTART.md with bot architecture documentation
- [x] Created BOT_PLANNING.md (this file)

**Pending Items:**
- [ ] Register GitHub App with fine-grained permissions
- [ ] Store secrets in GitHub Secrets (App ID, private key, webhook secret)
- [ ] Update .gitignore for bot-related files

---

## 🗺️ Phases 2-6: Implementation Roadmap

### Phase 2: Infrastructure (4-8 hours)

**Objectives:**
- Choose and set up FaaS platform
- Implement webhook endpoint
- Deploy initial handler

**Tasks:**
1. **Choose FaaS Platform** (30 min)
   - **Recommended**: Cloudflare Workers
     - 3M requests/month free tier
     - Low latency, optimized for webhooks
     - Simple deployment with Wrangler CLI
   - **Alternative 1**: Google Cloud Functions
     - 2M invocations/month
     - 360k GB-seconds
     - Better for complex logic
   - **Alternative 2**: AWS Lambda
     - 1M requests/month
     - 400k GB-seconds
     - More setup required

2. **Set Up Development Environment** (1 hour)
   - Install Wrangler CLI: `npm install -g wrangler`
   - Create Cloudflare account (free)
   - Initialize worker project: `wrangler init claudegen-bot`
   - Test local development: `wrangler dev`

3. **Implement Webhook Signature Validation** (1-2 hours)
   - HMAC SHA-256 validation using webhook secret
   - Return 403 for invalid signatures
   - Prevent replay attacks (timestamp check)

4. **Build Activation Command Parser** (1 hour)
   - Check comment body for `@claude fix` or `/fix-issue`
   - Early exit if command not present (cost optimization)
   - Extract file path if specified: `@claude fix src/Button.tsx`

5. **Deploy Initial Endpoint** (1 hour)
   - Deploy to Cloudflare Workers: `wrangler publish`
   - Get public URL: `https://claudegen-bot.workers.dev/webhook`
   - Test with curl or Postman

6. **Configure GitHub App Webhook** (30 min)
   - Update GitHub App settings with webhook URL
   - Subscribe to `issue_comment` events
   - Test webhook delivery (comment on test issue)

**Success Criteria:**
- ✅ Webhook endpoint responds to GitHub payloads
- ✅ Signature validation works (rejects invalid signatures)
- ✅ Activation commands parsed correctly
- ✅ Non-activation comments ignored (early exit)
- ✅ Logs show successful webhook deliveries

---

### Phase 3: Core Logic (3-5 hours)

**Objectives:**
- Integrate Claude API
- Implement prompt construction
- Parse structured output

**Tasks:**
1. **Implement CLAUDE.md Retrieval** (30 min)
   - Fetch `CLAUDE.md` from repository via GitHub API
   - Cache in environment variable (refresh every 10 min)
   - Handle 404 if file doesn't exist

2. **Build Context Retrieval** (1-2 hours)
   - **Option A**: User-specified files (from command)
     - Parse: `@claude fix src/Button.tsx src/styles/button.css`
     - Fetch specified files via GitHub API
   - **Option B**: Intelligent file discovery (future RAG)
     - Analyze issue description for file mentions
     - Search repository for related files
   - Use Base64 encoding for file content

3. **Construct Prompts** (1 hour)
   ```
   SYSTEM:
   You are an autonomous developer agent for claudegen-coach.
   Generate code fixes as structured JSON (see schema below).

   PROJECT STANDARDS (CLAUDE.md):
   {contents of CLAUDE.md}

   USER DIRECTIVE:
   {GitHub issue comment}

   RELEVANT CODE:
   File: {file_path}
   ```
   {file_content}
   ```

   OUTPUT FORMAT (JSON only):
   {
     "commit_title": "string (72 chars max)",
     "branch_name": "string (claude/fix-issue-123)",
     "pr_description": "string (includes Closes #XXX)",
     "file_changes": [
       {
         "path": "string (src/index.js)",
         "operation": "add|modify|delete",
         "content": "string (Base64 encoded)"
       }
     ]
   }
   ```

4. **Integrate Claude API** (1 hour)
   - Install `@anthropic-ai/sdk`
   - Call Claude API with system + user prompts
   - Request JSON output format
   - Set max_tokens: 8000-16000 (depending on complexity)

5. **Parse Structured Output** (1-2 hours)
   - Install `ajv` for JSON schema validation
   - Define JSON schema matching expected format
   - Validate Claude response against schema
   - **Retry mechanism** (if parsing fails):
     - Attempt 1: Send original prompt
     - Attempt 2: Send prompt + "Previous response had invalid JSON. Please fix."
     - Attempt 3: Send prompt + specific parsing error
     - After 3 failures: Post error comment to issue

**Success Criteria:**
- ✅ CLAUDE.md fetched and cached correctly
- ✅ Prompts include system, standards, user directive, and code
- ✅ Claude API returns structured JSON
- ✅ JSON schema validation catches malformed responses
- ✅ Retry mechanism handles parsing failures

---

### Phase 4: Git Operations (2-3 hours)

**Objectives:**
- Implement Git Data API choreography
- Create PRs programmatically

**Tasks:**
1. **Install Dependencies** (5 min)
   - `@octokit/rest` for GitHub API
   - `jose` for JWT authentication (GitHub App)

2. **GitHub App Authentication** (30 min)
   - Generate JWT using GitHub App private key
   - Exchange JWT for installation access token
   - Cache token (expires after 1 hour)

3. **Implement 5-Step Git Data API Sequence** (2 hours)

   **Step 1: Get Base Commit SHA**
   ```javascript
   const { data: ref } = await octokit.git.getRef({
     owner, repo,
     ref: 'heads/main'
   })
   const baseSHA = ref.object.sha
   ```

   **Step 2: Create File Blobs**
   ```javascript
   const blobs = []
   for (const change of fileChanges) {
     const { data: blob } = await octokit.git.createBlob({
       owner, repo,
       content: change.content, // Base64 encoded
       encoding: 'base64'
     })
     blobs.push({ path: change.path, sha: blob.sha, mode: '100644' })
   }
   ```

   **Step 3: Create Git Tree**
   ```javascript
   const { data: tree } = await octokit.git.createTree({
     owner, repo,
     base_tree: baseSHA,
     tree: blobs
   })
   ```

   **Step 4: Create Commit**
   ```javascript
   const { data: commit } = await octokit.git.createCommit({
     owner, repo,
     message: commitTitle,
     tree: tree.sha,
     parents: [baseSHA]
   })
   ```

   **Step 5: Create Branch + PR**
   ```javascript
   await octokit.git.createRef({
     owner, repo,
     ref: `refs/heads/${branchName}`,
     sha: commit.sha
   })

   const { data: pr } = await octokit.pulls.create({
     owner, repo,
     title: commitTitle,
     head: branchName,
     base: 'main',
     body: prDescription
   })
   ```

4. **Handle File Operations** (30 min)
   - **Add**: Create new blob, add to tree
   - **Modify**: Create new blob with updated content
   - **Delete**: Set `sha: null` in tree entry

**Success Criteria:**
- ✅ GitHub App authenticates successfully
- ✅ Can fetch base commit SHA
- ✅ Blobs created for all file changes
- ✅ Tree constructed correctly
- ✅ Commit created with proper message
- ✅ Branch created with naming convention
- ✅ PR created with correct description

---

### Phase 5: Communication (2-3 hours)

**Objectives:**
- Post status comments to issues
- Implement logging and monitoring

**Tasks:**
1. **Success Comment Template** (30 min)
   ```markdown
   ✅ **Fix Deployed**

   I've created PR #{pr_number} to address this issue.

   **Changes:**
   {list of modified files}

   **Next Steps:**
   - Review the PR
   - Run tests: `npm test`
   - Merge when ready

   Closes #{issue_number}
   ```

2. **Failure Comment Template** (30 min)
   ```markdown
   ❌ **Fix Failed**

   I encountered an error while processing this request:

   **Error**: {error_type}
   **Details**: {error_message}

   **Suggested Actions:**
   - Check the issue description for clarity
   - Verify file paths are correct
   - Try again with a simpler request

   cc @{issue_author}
   ```

3. **Implement Comment Posting** (30 min)
   ```javascript
   await octokit.issues.createComment({
     owner, repo,
     issue_number: issueNumber,
     body: commentBody
   })
   ```

4. **Add Reaction Support** (15 min)
   - "👀" reaction when processing starts
   - "✅" reaction when PR created
   - "❌" reaction on failure

5. **Comprehensive Logging** (1 hour)
   - Log all API calls (GitHub, Claude)
   - Log all SHAs (commit, tree, blob)
   - Log execution time for each step
   - Log errors with full stack traces
   - Use Cloudflare Workers `console.log` (visible in dashboard)

6. **Set Up Cost Monitoring** (30 min)
   - Cloudflare Workers dashboard → Analytics
   - Set alert: 80% of 3M requests/month threshold
   - Monitor: Invocations, errors, CPU time, success rate

**Success Criteria:**
- ✅ Success comments posted with PR link
- ✅ Failure comments explain what went wrong
- ✅ Reactions added for visual feedback
- ✅ All operations logged for debugging
- ✅ Cost monitoring alerts configured

---

### Phase 6: Testing & Documentation (1-2 hours)

**Objectives:**
- End-to-end testing
- Create documentation

**Tasks:**
1. **End-to-End Test Scenario** (1 hour)
   - Create test issue: "Fix button padding in Button.tsx"
   - Comment: "@claude fix change padding from 8px to 12px"
   - Verify:
     - Webhook received (check logs)
     - Claude API called (check logs)
     - PR created with correct changes
     - Success comment posted
     - Issue auto-closes on PR merge

2. **Create BOT_ARCHITECTURE.md** (30 min)
   - System architecture diagram (ASCII or Mermaid)
   - Webhook flow chart
   - Git Data API sequence diagram
   - Deployment instructions
   - Monitoring guide
   - Troubleshooting section

3. **Update README.md** (15 min)
   - Add "Autonomous Bot" section
   - Document activation commands
   - Explain what the bot can/cannot do
   - Link to Issue #7 for details

4. **Create Runbook** (15 min)
   - How to deploy updates
   - How to check logs
   - How to handle errors
   - How to rotate secrets

**Success Criteria:**
- ✅ End-to-end test passes (issue → PR → merge)
- ✅ BOT_ARCHITECTURE.md created with diagrams
- ✅ README.md updated with bot instructions
- ✅ Runbook created for operations

---

## 🔐 GitHub App Registration (Manual Steps)

**When Ready for Phase 2:**

### 1. Register GitHub App

Go to: https://github.com/settings/apps/new

**Configuration:**
- **Name**: `claudegen-coach-bot`
- **Homepage URL**: `https://github.com/Mikecranesync/claudegen-coach`
- **Webhook URL**: (will add after deployment)
- **Webhook Secret**: Generate random 32-char string, save securely

**Permissions (Repository):**
- Contents: Read & Write (for creating commits/files)
- Pull requests: Write (for creating PRs)
- Issues: Write (for posting comments)
- Metadata: Read (automatic)

**Subscribe to Events:**
- [x] Issue comments

**Where can this GitHub App be installed?**
- Select: "Only on this account"

### 2. After Registration

1. Note the **App ID** (shown on app page)
2. Generate a **private key** (scroll down, click "Generate a private key")
3. Download `.pem` file (NEVER commit to git!)
4. Install app on `claudegen-coach` repository

### 3. Store Secrets

**GitHub Repository Secrets** (Settings → Secrets and variables → Actions):
- `GITHUB_APP_ID`: The App ID from step 2
- `GITHUB_APP_PRIVATE_KEY`: Contents of `.pem` file
- `WEBHOOK_SECRET`: The 32-char string from step 1
- `ANTHROPIC_API_KEY`: Your Claude API key (already exists)

**Cloudflare Workers Secrets** (after worker created):
```bash
wrangler secret put GITHUB_APP_ID
wrangler secret put GITHUB_APP_PRIVATE_KEY
wrangler secret put WEBHOOK_SECRET
wrangler secret put ANTHROPIC_API_KEY
```

---

## 📈 Estimated Timeline

| Phase | Description | Est. Time | Dependencies |
|-------|-------------|-----------|--------------|
| 1 | Foundation | 2 hours | None |
| 2 | Infrastructure | 4-8 hours | GitHub App registered |
| 3 | Core Logic | 3-5 hours | Phase 2 complete |
| 4 | Git Operations | 2-3 hours | Phase 3 complete |
| 5 | Communication | 2-3 hours | Phase 4 complete |
| 6 | Testing & Docs | 1-2 hours | Phase 5 complete |
| **TOTAL** | **Full Implementation** | **15-25 hours** | Incremental |

**Minimum Viable Bot**: Phases 1-4 (11-18 hours)
**Production Ready**: All 6 phases (15-25 hours)

---

## 🚦 Next Steps

### Immediate (After Phase 1)

1. **Register GitHub App** (follow manual steps above)
2. **Store all secrets** in GitHub Secrets
3. **Update .gitignore** to exclude bot files
4. **Commit Phase 1 changes** to git

### When Ready for Phase 2

1. **Review** Cloudflare Workers docs: https://developers.cloudflare.com/workers/
2. **Install** Wrangler CLI: `npm install -g wrangler`
3. **Create** Cloudflare account (free tier)
4. **Start** Phase 2 implementation (follow GitHub Issue #7 checkpoints)

---

## 📚 Reference Documentation

- **Architecture Blueprint**: `Autonomous Claude GitHub Issue Fixes.pdf`
- **Implementation Plan**: [GitHub Issue #7](https://github.com/Mikecranesync/claudegen-coach/issues/7)
- **Coding Standards**: [CLAUDE.md](./CLAUDE.md)
- **Project State**: [JUMPSTART.md](./JUMPSTART.md)

---

## ⚠️ Important Considerations

### Security
- **NEVER** commit private keys or secrets to git
- **ALWAYS** validate webhook signatures
- **ROTATE** secrets regularly (quarterly)
- **AUDIT** bot actions periodically

### Cost Management
- Free tier: 3M requests/month (Cloudflare Workers)
- Monitor usage weekly
- Set alerts at 80% threshold
- Estimated usage: ~100-1000 requests/month (low traffic repo)

### Limitations
- Bot works best for focused, well-scoped changes
- Complex refactoring may require human review
- Context window limits (100k tokens for Claude)
- Rate limits: Claude API (50 requests/min), GitHub API (5000 requests/hour)

---

*This document will be updated as each phase is completed.*
