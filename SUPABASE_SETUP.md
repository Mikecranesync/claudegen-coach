# 🚀 Supabase Setup Guide

## Step 1: Create a Supabase Account & Project (5 minutes)

### 1.1 Sign Up for Supabase

1. Go to https://supabase.com
2. Click **"Start your project"**
3. Sign in with GitHub (recommended) or email
4. Verify your email if needed

### 1.2 Create a New Project

1. Click **"New Project"** in the dashboard
2. Fill in the project details:
   - **Name**: `claudegen-coach` (or your preferred name)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to you (e.g., `us-east-1`)
   - **Pricing Plan**: Free tier is perfect for MVP
3. Click **"Create new project"**
4. Wait 2-3 minutes for project to be provisioned

## Step 2: Get Your API Keys

### 2.1 Navigate to Project Settings

1. In your Supabase dashboard, click **"Settings"** (gear icon) in sidebar
2. Click **"API"** in the settings menu

### 2.2 Copy Your Credentials

You'll need these two values:

1. **Project URL**
   - Look for: "Project URL"
   - Format: `https://xxxxxxxxxxxxx.supabase.co`
   - Copy this entire URL

2. **Anon/Public Key**
   - Look for: "Project API keys" → "anon" "public"
   - This is a long JWT token starting with `eyJ...`
   - Copy the `anon` key (the public one, NOT the service_role key)

⚠️ **IMPORTANT**:
- Use the `anon` key (safe for client-side)
- DO NOT use the `service_role` key (server-side only)

## Step 3: Add to Your .env File

Create or edit `.env` in your project root:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Claude API (keep existing)
# VITE_CLAUDE_API_KEY=sk-ant-...

# n8n (keep existing)
# VITE_N8N_BASE_URL=https://your-n8n.com
# VITE_N8N_API_KEY=your-n8n-key

# App Configuration
VITE_APP_ID=claudegen-coach-default
```

Replace:
- `https://xxxxxxxxxxxxx.supabase.co` with your actual Project URL
- `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` with your actual anon key

## Step 4: Set Up Database Tables (Optional for MVP)

For now, the app will work with local storage. But when you're ready to use Supabase:

### 4.1 Create Projects Table

1. In Supabase dashboard, click **"Table Editor"**
2. Click **"Create a new table"**
3. Name it: `projects`
4. Add columns:

```sql
-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  current_stage INTEGER DEFAULT 1,
  stages JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own projects
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own projects
CREATE POLICY "Users can insert own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own projects
CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own projects
CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);
```

### 4.2 Create Settings Table

```sql
-- User settings table
CREATE TABLE user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users,
  claude_api_key TEXT,
  n8n_api_key TEXT,
  n8n_base_url TEXT,
  theme TEXT DEFAULT 'dark',
  notifications BOOLEAN DEFAULT true,
  save_progress BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own settings
CREATE POLICY "Users can view own settings"
  ON user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  USING (auth.uid() = user_id);
```

## Step 5: Verify Setup

After completing the code migration:

```bash
# 1. Install dependencies
npm install

# 2. Run the app
npm run dev

# 3. Check browser console for Supabase connection
# Should see: "Supabase initialized successfully"
```

## Troubleshooting

### Connection Errors

If you see connection errors:

1. **Check .env file**: Make sure variables are prefixed with `VITE_`
2. **Restart dev server**: Environment variables require restart
3. **Verify URL/Key**: Double-check you copied correctly from Supabase dashboard
4. **Check browser console**: Look for specific error messages

### API Key Issues

- Using `service_role` key? Switch to `anon` key
- Key starts with `eyJ`? That's correct (JWT format)
- URL ends with `.supabase.co`? That's correct

### Database Access Issues

- RLS (Row Level Security) enabled? Users can only see their own data
- Policies created? Check "Authentication" > "Policies" in dashboard
- Auth enabled? Go to "Authentication" to enable email/password auth

## Next Steps

Once setup is complete:

1. ✅ Environment variables configured
2. ✅ Code migration complete (automatic)
3. ✅ App builds successfully
4. 🎯 Ready to use Supabase for storage!

**Optional enhancements**:
- Set up email authentication
- Create additional tables for stage data
- Add realtime subscriptions for live updates
- Configure storage for file uploads (Stage 5)

---

**Need Help?**
- Supabase Docs: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com
- GitHub Issues: https://github.com/Mikecranesync/claudegen-coach/issues
