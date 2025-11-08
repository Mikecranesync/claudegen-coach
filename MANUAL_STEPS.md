# Manual Setup Steps - Autonomous Bot (Phase 2)

**Status**: Waiting for user actions
**Created**: November 7, 2025
**Automated work complete**: ✅ Cloudflare Worker code written

---

## 🎯 What's Been Done Automatically

✅ **Created Cloudflare Worker project** (`cloudflare-worker/`)
✅ **Implemented webhook handler** with signature validation
✅ **Created configuration files** (wrangler.toml, package.json)
✅ **Written documentation** (README.md with full instructions)

---

## 👤 What You Need to Do Manually

There are **2 manual tasks** that require browser interaction:

### Task 1: Register GitHub App (30 minutes)
### Task 2: Set Up Cloudflare Account (15 minutes)

Once you complete these, I can continue with deployment and testing.

---

## 📝 TASK 1: Register GitHub App

**Time**: 30 minutes
**Why manual**: Requires GitHub UI interaction, private key download

### Step-by-Step Instructions

#### 1.1 Navigate to GitHub App Creation

Open this URL in your browser:
```
https://github.com/settings/apps/new
```

#### 1.2 Fill Out GitHub App Form

**GitHub App Name:**
```
claudegen-coach-bot
```

**Description:**
```
Autonomous AI development agent that creates Pull Requests automatically when you comment @claude fix on issues.
```

**Homepage URL:**
```
https://github.com/Mikecranesync/claudegen-coach
```

**Webhook URL:** (LEAVE BLANK FOR NOW - will add after Cloudflare deployment)
```
(blank)
```

**Webhook secret:** Generate a random 32-character string
- Use this generator: https://www.random.org/strings/?num=1&len=32&digits=on&upperalpha=on&loweralpha=on&unique=on&format=html&rnd=new
- Or run in terminal: `openssl rand -hex 16`
- **SAVE THIS SECRET** - you'll need it later

Example:
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

#### 1.3 Set Permissions

Scroll to **Repository permissions** and set:

| Permission | Access |
|-----------|--------|
| Contents | Read & Write |
| Issues | Write |
| Pull requests | Write |
| Metadata | Read (auto-set) |

#### 1.4 Subscribe to Events

Scroll to **Subscribe to events** and check:
- [x] Issue comments

#### 1.5 Where can this GitHub App be installed?

Select: **Only on this account**

#### 1.6 Create GitHub App

Click **"Create GitHub App"** button at the bottom.

#### 1.7 Save App ID

After creation, you'll see the GitHub App settings page. **SAVE** this information:

**App ID:** (shown at top of page, e.g., `123456`)

Example:
```
App ID: 987654
```

#### 1.8 Generate Private Key

Scroll down to **"Private keys"** section.

Click **"Generate a private key"** button.

A `.pem` file will download automatically. **SAVE THIS FILE SECURELY**.

Example filename:
```
claudegen-coach-bot.2024-11-07.private-key.pem
```

**IMPORTANT**:
- Do NOT commit this file to git (it's already in .gitignore)
- Keep it secure - it's the bot's authentication credential

#### 1.9 Install App on Repository

Scroll to top and click **"Install App"** in the left sidebar.

Click **"Install"** next to your username.

Select repository: **claudegen-coach**

Click **"Install"**

---

### ✅ Task 1 Complete - What You Should Have

After completing Task 1, you should have:
- [x] GitHub App created
- [x] App ID (e.g., `987654`)
- [x] Webhook secret (32-char string, e.g., `a1b2c3d4...`)
- [x] Private key file (e.g., `claudegen-coach-bot.2024-11-07.private-key.pem`)
- [x] App installed on `claudegen-coach` repository

---

## ☁️ TASK 2: Set Up Cloudflare Account

**Time**: 15 minutes
**Why manual**: Requires account creation and CLI authentication

### Step-by-Step Instructions

#### 2.1 Create Cloudflare Account

If you don't have a Cloudflare account:

1. Go to: https://dash.cloudflare.com/sign-up
2. Enter email and password
3. Verify email
4. Skip domain setup (not needed for Workers)

#### 2.2 Install Wrangler CLI Globally

Open a terminal and run:
```bash
npm install -g wrangler
```

Wait for installation to complete.

#### 2.3 Authenticate Wrangler

Run:
```bash
wrangler login
```

This will:
1. Open a browser window
2. Ask you to authorize Wrangler
3. Click "Allow"
4. Terminal will show: "Successfully logged in"

#### 2.4 Verify Authentication

Run:
```bash
wrangler whoami
```

Should output your Cloudflare account email.

---

### ✅ Task 2 Complete - What You Should Have

After completing Task 2, you should have:
- [x] Cloudflare account created (free tier)
- [x] Wrangler CLI installed globally
- [x] Wrangler authenticated (can run `wrangler whoami`)

---

## 🔄 NEXT: Resume Automated Workflow

Once you've completed BOTH tasks above, let me know by typing:
```
ready to continue
```

I will then:
1. ✅ Configure secrets in Cloudflare Workers
2. ✅ Deploy the worker
3. ✅ Get the webhook URL
4. ✅ Update GitHub App webhook URL (I'll give you the URL to paste)
5. ✅ Test webhook delivery
6. ✅ Verify end-to-end flow

---

## 🆘 Troubleshooting

### GitHub App Issues

**Problem**: Can't find GitHub App settings
**Solution**: Go to https://github.com/settings/apps and click your app name

**Problem**: Webhook secret lost
**Solution**: Regenerate: Settings → Webhook → Regenerate secret

**Problem**: Private key lost
**Solution**: Generate new key: Settings → Private keys → Generate

### Cloudflare Issues

**Problem**: `wrangler` command not found
**Solution**:
```bash
npm install -g wrangler
# Restart terminal
```

**Problem**: `wrangler login` fails
**Solution**:
- Check internet connection
- Try incognito browser
- Clear browser cache

**Problem**: Already have Cloudflare account but forgot password
**Solution**: Use "Forgot password" at https://dash.cloudflare.com/login

---

## 📊 Progress Tracker

### Phase 2 Status

- [x] ✅ Cloudflare Worker code written (automated)
- [x] ✅ Configuration files created (automated)
- [x] ✅ Documentation written (automated)
- [ ] ⏳ GitHub App registered (MANUAL - Task 1)
- [ ] ⏳ Cloudflare account set up (MANUAL - Task 2)
- [ ] ⏸️ Secrets configured (automated - waiting)
- [ ] ⏸️ Worker deployed (automated - waiting)
- [ ] ⏸️ Webhook tested (automated - waiting)

---

## 📝 Information to Provide

When you're ready to continue, please provide:

1. **GitHub App ID** (e.g., `987654`)
2. **Webhook secret** (32-char string)
3. **Private key file path** (e.g., `C:\Users\hharp\Downloads\claudegen-coach-bot.2024-11-07.private-key.pem`)
4. **Confirmation that Wrangler is authenticated** (`wrangler whoami` output)

I'll use this information to configure secrets and deploy the worker.

---

**Take your time with these steps. They're one-time setup tasks.**

Once complete, the bot will be operational! 🚀
