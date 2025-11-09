# ClaudeGen Bot - Cloudflare Worker

Autonomous GitHub Issue Fix Bot powered by Claude AI.

## Overview

This Cloudflare Worker listens for GitHub issue comment webhooks and automatically creates Pull Requests with code fixes.

**Architecture**: Serverless webhook-driven agent
**Platform**: Cloudflare Workers (Free tier: 3M requests/month)
**Reference**: `../Autonomous Claude GitHub Issue Fixes.pdf`

---

## Prerequisites

1. **Cloudflare Account** (free tier)
   - Sign up: https://dash.cloudflare.com/sign-up

2. **Wrangler CLI** (Cloudflare Workers CLI)
   ```bash
   npm install -g wrangler
   ```

3. **GitHub App** (registered and installed)
   - See `../BOT_PLANNING.md` for registration steps
   - Need: App ID, private key (.pem), webhook secret

4. **Claude API Key**
   - Get from: https://console.anthropic.com/

---

## Setup & Deployment

### 1. Authenticate with Cloudflare

```bash
wrangler login
```

This opens a browser for authentication.

### 2. Install Dependencies

```bash
cd cloudflare-worker
npm install
```

### 3. Configure Secrets

Store sensitive credentials in Cloudflare Workers:

```bash
# GitHub webhook secret (32-char random string)
wrangler secret put WEBHOOK_SECRET

# GitHub App ID (from GitHub App settings)
wrangler secret put GITHUB_APP_ID

# GitHub App private key (paste entire PEM file contents)
wrangler secret put GITHUB_APP_PRIVATE_KEY

# Claude API key (from Anthropic console)
wrangler secret put ANTHROPIC_API_KEY
```

### 4. Test Locally

```bash
npm run dev
```

This starts a local development server at `http://localhost:8787`.

**Test webhook delivery:**
```bash
curl -X POST http://localhost:8787/webhook \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: issue_comment" \
  -H "X-Hub-Signature-256: sha256=test" \
  -d '{"action":"created","comment":{"body":"@claude fix"}}'
```

### 5. Deploy to Cloudflare

```bash
npm run deploy
```

This deploys the worker and returns a public URL:
```
https://claudegen-bot.<your-subdomain>.workers.dev
```

### 6. Configure GitHub App Webhook

1. Go to GitHub App settings: https://github.com/settings/apps
2. Select your app (`claudegen-coach-bot`)
3. Scroll to "Webhook"
4. Set **Webhook URL** to: `https://claudegen-bot.<your-subdomain>.workers.dev/webhook`
5. Ensure **Webhook secret** matches what you configured in step 3
6. Click "Save changes"

---

## Testing

### Automated Tests

The project includes comprehensive automated tests using Vitest.

**Quick Start:**
```bash
# Run all tests
npm test

# Watch mode (auto-rerun on file changes)
npm run test:watch

# Generate coverage report
npm run test:coverage

# Interactive test UI
npm run test:ui
```

**Test Results:**
- ✅ 68 tests passing
- ⏭️ 4 tests skipped (integration tests for Phase 2)
- 📊 Coverage target: 80%+

**Test Structure:**
```
test/
├── unit/                   # Unit tests for individual functions
│   ├── github.test.js     # Webhook signatures, file parsing (20 tests)
│   ├── claude.test.js     # Response validation, JSON parsing (19 tests)
│   ├── prompts.test.js    # Prompt building, formatting (16 tests)
│   ├── auth.test.js       # JWT generation, error handling (6 tests)
│   └── git-operations.test.js  # Git Data API choreography (7 tests)
├── integration/            # Integration tests (Phase 2+)
└── fixtures/               # Mock data and test utilities
    ├── github-payloads.js  # Mock webhooks, API responses
    ├── claude-responses.js # Mock AI responses
    └── mock-keys.js        # Test private keys
```

**Writing New Tests:**

```javascript
// test/unit/my-module.test.js
import { describe, it, expect } from 'vitest';
import { myFunction } from '../../lib/my-module.js';

describe('My Module', () => {
  it('should do something correctly', () => {
    const result = myFunction('input');
    expect(result).toBe('expected-output');
  });

  it('should handle errors gracefully', () => {
    expect(() => myFunction(null)).toThrow();
  });
});
```

**Coverage Requirements:**
- Lines: 80%+
- Functions: 80%+
- Branches: 75%+
- Statements: 80%+

**CI/CD:**
- Tests run automatically on every PR via GitHub Actions
- Coverage reports uploaded to Codecov
- PRs blocked if tests fail

### Manual Testing

#### Test Webhook Delivery

1. Create a test issue in your repository
2. Comment: `@claude fix`
3. Check Cloudflare Workers dashboard for logs:
   - Go to: https://dash.cloudflare.com
   - Navigate to: Workers & Pages → claudegen-bot → Logs
   - Should see: "Activation command detected!"

#### View Live Logs

```bash
npm run tail
```

This streams real-time logs from Cloudflare Workers.

---

## Development

### Project Structure

```
cloudflare-worker/
├── index.js           # Main worker handler
├── lib/
│   └── github.js      # GitHub API utilities
├── package.json       # Dependencies
├── wrangler.toml      # Cloudflare configuration
└── README.md          # This file
```

### Adding Dependencies

```bash
npm install <package-name>
```

Then redeploy:
```bash
npm run deploy
```

### Environment Variables

**Non-sensitive** (in `wrangler.toml`):
- `BOT_VERSION`: Version number
- `ENVIRONMENT`: "production" or "development"

**Sensitive** (use `wrangler secret put`):
- `WEBHOOK_SECRET`: GitHub webhook secret
- `GITHUB_APP_ID`: GitHub App ID
- `GITHUB_APP_PRIVATE_KEY`: GitHub App private key
- `ANTHROPIC_API_KEY`: Claude API key

---

## Monitoring

### Cloudflare Dashboard

- **URL**: https://dash.cloudflare.com
- **Navigate to**: Workers & Pages → claudegen-bot
- **Metrics**:
  - Requests (total, success, errors)
  - CPU time
  - Invocations per day
  - Error rate

### Logs

**Real-time streaming:**
```bash
npm run tail
```

**Dashboard logs:**
- Cloudflare Dashboard → Workers & Pages → claudegen-bot → Logs
- Shows last 1000 requests

### Alerts

Set up alerts for:
- Error rate > 5%
- Requests > 80% of free tier (2.4M/month)

---

## Troubleshooting

### Webhook Not Received

1. Check GitHub App webhook settings
2. Verify webhook URL is correct
3. Check Cloudflare Workers logs for incoming requests
4. Test locally with curl

### Signature Validation Fails

1. Verify `WEBHOOK_SECRET` matches GitHub App settings
2. Check that secret was set correctly: `wrangler secret list`
3. Regenerate webhook secret if needed

### Worker Crashes

1. Check logs: `npm run tail`
2. Look for JavaScript errors
3. Verify all secrets are configured
4. Test locally: `npm run dev`

### Deployment Fails

1. Ensure you're authenticated: `wrangler whoami`
2. Check `wrangler.toml` syntax
3. Run: `wrangler publish --dry-run` to test

---

## Cost Management

**Cloudflare Workers Free Tier:**
- 100,000 requests/day (3M/month)
- 10ms CPU time per request
- Unlimited bandwidth

**Expected Usage:**
- Low-traffic repo: 100-1,000 requests/month
- Medium-traffic repo: 5,000-20,000 requests/month
- High-traffic repo: 50,000-100,000 requests/month

**Cost Optimization:**
- Early exit for non-bot comments (most requests)
- Cache CLAUDE.md in memory (reduce GitHub API calls)
- Batch operations where possible

---

## Phase Status

**Phase 2: Infrastructure** ✅ (Current)
- [x] Cloudflare Workers project created
- [x] Webhook handler implemented
- [x] Signature validation working
- [x] Activation command detection
- [ ] Deployed to Cloudflare (requires manual steps)
- [ ] GitHub App webhook configured (requires manual steps)

**Phase 3: Core Logic** (Next)
- [ ] Claude API integration
- [ ] CLAUDE.md retrieval
- [ ] Prompt construction
- [ ] Structured output parsing

---

## Links

- **Implementation Plan**: [GitHub Issue #7](https://github.com/Mikecranesync/claudegen-coach/issues/7)
- **Roadmap**: `../BOT_PLANNING.md`
- **Coding Standards**: `../CLAUDE.md`
- **Cloudflare Docs**: https://developers.cloudflare.com/workers/

---

*Generated by Claude Code - Phase 2: Infrastructure*
