# [INFRASTRUCTURE] Build Autonomous GitHub Issue Fix Bot

## 🎯 Feature Description

Implement an autonomous AI development agent that responds to GitHub issue comments and automatically creates Pull Requests with code fixes. This follows the architectural blueprint from "Autonomous Claude GitHub Issue Fixes.pdf".

## 📋 Why This Matters

**Problem**: Currently, all code generation requires interactive sessions with Claude Code CLI. This doesn't scale for:
- Community contributors requesting features
- Automated bug fixes
- 24/7 autonomous operation

**Solution**: Deploy a serverless webhook listener that:
- Listens for `@claude fix` commands in issue comments
- Fetches relevant code context
- Uses Claude API to generate fixes
- Creates PRs automatically via Git Data API
- Operates on free-tier FaaS (3M requests/month)

**Value**:
- **Speed**: Instant response to community requests
- **Cost**: $0/month operational cost (free tier)
- **Scalability**: Handles unlimited concurrent requests
- **Autonomy**: No human intervention required

---

## 📋 Completion Criteria

### Phase 1: Foundation ✅
- [x] Create `CLAUDE.md` in repository root with coding standards
- [ ] Register GitHub App with fine-grained permissions
- [ ] Store secrets in GitHub Secrets (App ID, private key, webhook secret)
- [ ] Update JUMPSTART.md with bot architecture section

### Phase 2: Infrastructure
- [ ] Choose FaaS platform (Cloudflare Workers recommended)
- [ ] Implement webhook signature validation
- [ ] Build activation command parser (`@claude fix`, `/fix-issue`)
- [ ] Deploy public webhook endpoint
- [ ] Configure GitHub App to send webhooks to endpoint

### Phase 3: Core Logic
- [ ] Implement CLAUDE.md retrieval and caching
- [ ] Build context retrieval (fetch relevant files via GitHub API)
- [ ] Construct prompts (system + CLAUDE.md + user directive + code)
- [ ] Integrate Claude API with structured output schema (JSON)
- [ ] Implement output parsing with retry mechanism

### Phase 4: Git Operations
- [ ] Implement 5-step Git Data API choreography:
  - Get base commit SHA
  - Create file Blobs (Base64 encoded)
  - Construct Git Tree
  - Create Commit object
  - Create Branch + Pull Request
- [ ] Handle file operations (add, modify, delete)
- [ ] Generate branch names (`claude/fix-issue-123`)

### Phase 5: Communication
- [ ] Post success comments to issues (with PR link + "Closes #XXX")
- [ ] Post failure comments with error details
- [ ] Implement comprehensive logging (all API calls, SHAs, errors)
- [ ] Set up cost monitoring alerts (80% free tier threshold)

### Phase 6: Testing & Documentation
- [ ] End-to-end test (issue comment → PR creation)
- [ ] Create BOT_ARCHITECTURE.md with system design
- [ ] Update README.md with bot usage instructions
- [ ] Build successful (0 TypeScript errors)

---

## 🏁 Checkpoints

### CHECKPOINT 1: After Foundation Complete
**Deliverables:**
- CLAUDE.md file created ✅
- GitHub App registered
- Secrets configured

**Confirmation Needed:**
- Review CLAUDE.md content (coding standards accurate?)
- Verify GitHub App permissions (correct scope?)

### CHECKPOINT 2: After Infrastructure Deployed
**Deliverables:**
- Webhook endpoint live
- Signature validation working
- Early exit logic functional

**Confirmation Needed:**
- Test webhook delivery (GitHub sends payload successfully?)
- Verify activation commands parsed correctly?

### CHECKPOINT 3: After Core Logic Complete
**Deliverables:**
- Claude API integration working
- Structured output parsing reliable
- Context retrieval functional

**Confirmation Needed:**
- Test prompt construction (includes CLAUDE.md?)
- Verify JSON schema validation catches errors?

### CHECKPOINT 4: After Git Operations Working
**Deliverables:**
- Can create PRs programmatically
- All 5 Git Data API steps orchestrated
- Branch naming convention followed

**Confirmation Needed:**
- Test PR creation (creates valid PR?)
- Verify file operations (add/modify/delete all work?)

### CHECKPOINT 5: After End-to-End Test Passes
**Deliverables:**
- Complete flow: issue comment → PR creation
- Status comments posted correctly
- Logging and monitoring active

**Confirmation Needed:**
- Review test results (all scenarios pass?)
- Verify error handling (failures handled gracefully?)

---

## 📝 Instructions for Claude Code

**Autonomy Level:** Work autonomously between checkpoints. Make all implementation decisions independently (file structure, error handling, logging format, etc.).

**At each checkpoint:** Demonstrate working functionality, show code snippets, and confirm approach before continuing.

**Communication Strategy:** Use TodoWrite tool to track progress across all 6 phases. Mark todos as in_progress/completed in real-time.

**Reference Documentation:**
- Architecture blueprint: `Autonomous Claude GitHub Issue Fixes.pdf`
- Project state: [JUMPSTART.md](../JUMPSTART.md)
- Autonomous work theory: [JUMPSTART.md](../JUMPSTART.md) (lines 752-908)
- Coding standards: [CLAUDE.md](../CLAUDE.md)

---

## 📎 Additional Context

**PDF Source**: `C:\Users\hharp\codegen\Autonomous Claude GitHub Issue Fixes.pdf`

**Key PDF Sections**:
- Section I: Serverless platform selection (pages 1-2)
- Section II: Authentication & security (pages 2-4)
- Section III: Core agentic workflow (pages 4-5)
- Section IV: Git Data API choreography (pages 5-7)
- Section V: Error handling & observability (pages 7-8)
- Section VI: Operational roadmap (pages 8-9)

**Expected Timeline**: 15-25 hours of development time across 6 phases

**Free-Tier Platforms Comparison** (from PDF Table 1):
| Platform | Requests/Month | GB-Seconds | Best For |
|----------|----------------|------------|----------|
| GitHub Actions | 2,000 minutes | N/A | ❌ Too limited |
| AWS Lambda | 1M | 400,000 | Complex setup |
| Google Cloud Functions | 2M | 360,000 | Generous, low cold start |
| Cloudflare Workers | 3M | N/A | ✅ Recommended: Optimized for webhooks |

---

## 🔗 Related Issues

- Builds on: Issue #3 (Authentication testing)
- Builds on: Issue #4 (Supabase setup)
- Related concept: [JUMPSTART.md](../JUMPSTART.md) Autonomous Work Theory

---

## 💡 Technical Considerations

**Affected Files (New):**
- `CLAUDE.md` (repository root) ✅ CREATED
- `cloudflare-worker/index.js` (webhook handler)
- `cloudflare-worker/lib/github.js` (Git Data API)
- `cloudflare-worker/lib/claude.js` (Claude API client)
- `cloudflare-worker/lib/prompts.js` (prompt construction)
- `cloudflare-worker/wrangler.toml` (Cloudflare config)
- `docs/BOT_ARCHITECTURE.md` (system documentation)

**New Dependencies:**
- `@octokit/rest` (GitHub API client)
- `@anthropic-ai/sdk` (Claude API)
- `jose` (JWT for GitHub App auth)
- `ajv` (JSON schema validation)

**Breaking Changes:** No (additive feature)

**Database Changes:** No

**Deployment:** Cloudflare Workers (or GCF/AWS Lambda)

---

## ✅ Acceptance Criteria (Testing)

**Manual Test Procedure:**
1. Create test issue in repository: "Fix button styling in Button.tsx"
2. Comment on issue: "@claude fix the padding to be 12px instead of 8px"
3. Verify webhook received by function (check logs)
4. Verify Claude API called (check logs for prompt + response)
5. Verify PR created with correct changes
6. Verify success comment posted to issue
7. Review PR code quality
8. Merge PR and verify issue auto-closes

**Edge Cases:**
- [ ] Non-activation comments ignored (early exit, minimal cost)
- [ ] Invalid file paths handled gracefully
- [ ] LLM parsing failures retry 3 times
- [ ] Git API errors post failure comments
- [ ] Concurrent webhook deliveries don't conflict

**Error States:**
- [ ] Webhook signature validation failure → 403 response
- [ ] Claude API key invalid → error comment posted
- [ ] Git Data API failure → detailed error comment
- [ ] Structured output parsing failure → retry with self-correction

**Loading/Progress:**
- [ ] "🤖 Processing your request..." reaction added to comment
- [ ] Success: ✅ reaction + detailed comment
- [ ] Failure: ❌ reaction + error comment

---

**Priority:** High (foundational infrastructure for autonomous operation)

**Estimated Effort:** 15-25 hours (spread across checkpoints)

**Deployment Target:** Cloudflare Workers free tier (3M requests/month)

---

🤖 *Generated with [Claude Code](https://claude.com/claude-code)*
