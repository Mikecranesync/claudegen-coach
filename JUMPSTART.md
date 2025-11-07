# 🚀 JUMPSTART - ClaudeGen Coach Project State

**Last Updated**: November 6, 2025
**Version**: 1.0.0 (MVP - Foundation Complete)
**Git Commit**: c0d602c - "Complete Firebase → Supabase migration"
**GitHub**: https://github.com/Mikecranesync/claudegen-coach
**Status**: ✅ Foundation Complete | ✅ GitHub Configured | ✅ Supabase Integrated | 🎯 Ready for Stage Implementation

---

## 🎯 Current Phase: Ready for Feature Implementation

**Completed Phases:**
- ✅ Phase 1-3: Foundation (React + TypeScript + Vite + Tailwind + Zustand)
- ✅ Phase 4: GitHub Integration (Repository created and synced)
- ✅ Phase 5: Supabase Migration (Firebase completely replaced)

**Current Focus:**
- 🎯 Phase 6: Stage Implementation (Build the 6-stage workflow)

**Quick Links:**
- 📖 Setup Guide: [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
- 📚 Full Docs: [README.md](./README.md)
- 🐙 Repository: https://github.com/Mikecranesync/claudegen-coach

---

## 📋 Quick Start (Cold Start in 60 seconds)

```bash
# Clone and setup
cd C:\Users\hharp\codegen
npm install

# Run development server
npm run dev
# → http://localhost:5173

# Build for production
npm run build

# Check git status
git status
git log --oneline -5
```

---

## 🎯 Current Status

### ✅ What's Been Completed

**Phase 1-3: Foundation (100% Complete)**

- [x] React 18 + TypeScript + Vite setup
- [x] Tailwind CSS with custom dark mode theme
- [x] Complete directory structure (80+ files, 8,973 lines)
- [x] TypeScript configuration with path aliases
- [x] All dependencies installed (416 packages)
- [x] Zero build errors
- [x] Git repository initialized
- [x] Initial commit created

**Infrastructure:**
- [x] Zustand state management (4 stores: auth, project, stage, settings)
- [x] React Router v6 navigation
- [x] Comprehensive TypeScript types (project, stage, user, claude, n8n)
- [x] ESLint + TypeScript strict mode

**Services & APIs:**
- [x] Claude API client with connection testing
- [x] Prompt builder system with RAG templates for all 6 stages
- [x] n8n REST API client (CRUD + activation/deactivation)
- [x] Firebase/Firestore service (ready for Supabase migration)
- [x] Unified storage service (local + cloud sync)
- [x] Claude command logger

**UI Components:**
- [x] Common components (Button, Input)
- [x] Layout system (Header, Sidebar, MainLayout)
- [x] Dashboard page
- [x] Settings page
- [x] All 6 stage pages scaffolded (Stage1-6)

**Features Implemented:**
- [x] F-101: API Key Management (Settings page)
- [x] F-102: Connection Test (Claude + n8n clients)
- [x] F-103: CLI Command Logger
- [x] RAG Library: Prompt templates for all 6 stages
- [x] Session persistence (local storage)
- [x] Dark mode theme
- [x] Navigation structure

### ✅ Recently Completed

- [x] **GitHub Integration** (Phase 4 - COMPLETE)
  - [x] Git repository initialized
  - [x] Initial commit created
  - [x] JUMPSTART.md created and committed
  - [x] Pushed to GitHub remote
  - [x] Repository URL: https://github.com/Mikecranesync/claudegen-coach

- [x] **Supabase Migration** (Phase 5 - COMPLETE)
  - [x] Created SUPABASE_SETUP.md with step-by-step instructions
  - [x] Installed @supabase/supabase-js (v2.80.0)
  - [x] Removed Firebase dependencies (74 packages removed)
  - [x] Created supabase.config.ts (replaces firebase.config.ts)
  - [x] Created supabaseService.ts (replaces firestoreService.ts)
  - [x] Updated storage service to use Supabase
  - [x] Updated environment variable types
  - [x] Updated .env.example with Supabase variables
  - [x] Build successful (0 errors)

### 🚧 In Progress

- [ ] **Stage Implementation** (Current Phase)
  - [ ] Stage 1: Idea Management
  - [ ] Stage 2: Concept Validation
  - [ ] Stage 3: Specification
  - [ ] Stage 4: CLI Configuration
  - [ ] Stage 5: Code Generation
  - [ ] Stage 6: Automation

### 📅 Next Up (Prioritized)

1. **Phase 6: Stage Implementation** (Phased Development - CURRENT PRIORITY)
   - Stage 1: Idea Management (forms + Claude integration)
   - Stage 2: Concept Validation (PoC generator)
   - Stage 3: Specification Builder (MoSCoW method)
   - Stage 4: CLI Configuration (API key management)
   - Stage 5: Code Generation (Monaco editor + preview)
   - Stage 6: Automation (n8n workflows + README gen)

2. **Phase 7: Telegram Bot**
   - Initialize telegram-bot project
   - Implement conversational handlers
   - Connect to same Supabase backend

---

## 🏗️ Architecture Overview

### Tech Stack

```
Frontend:  React 18 + TypeScript + Vite
Styling:   Tailwind CSS (dark mode)
State:     Zustand (4 stores)
Routing:   React Router v6
Backend:   Supabase (PostgreSQL + Auth)
APIs:      Claude AI API, n8n REST API
Bot:       Telegram (planned)
```

### Directory Structure

```
claudegen-coach/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── common/          # Button, Input, Modal, etc.
│   │   └── layout/          # MainLayout, Header, Sidebar
│   ├── pages/               # 6-stage workflow pages
│   │   ├── Dashboard/
│   │   ├── Stage1_IdeaManagement/
│   │   ├── Stage2_ConceptValidation/
│   │   ├── Stage3_Specification/
│   │   ├── Stage4_CLIConfiguration/
│   │   ├── Stage5_CodeGeneration/
│   │   ├── Stage6_Automation/
│   │   └── Settings/
│   ├── services/            # API integrations
│   │   ├── api/
│   │   │   ├── claude/      # Claude API client + prompt builder
│   │   │   ├── n8n/         # n8n REST API client
│   │   │   └── supabase/    # Supabase service
│   │   └── storage/         # Local + cloud storage
│   ├── store/               # Zustand stores
│   │   ├── authStore.ts
│   │   ├── projectStore.ts
│   │   ├── stageStore.ts
│   │   └── settingsStore.ts
│   ├── types/               # TypeScript definitions
│   │   ├── project.ts
│   │   ├── stage.ts
│   │   ├── user.ts
│   │   ├── claude.ts
│   │   └── n8n.ts
│   ├── utils/               # Utilities
│   │   ├── constants.ts
│   │   ├── validation.ts
│   │   ├── formatting.ts
│   │   ├── logger.ts
│   │   └── zipGenerator.ts
│   ├── config/              # Configuration
│   │   ├── supabase.config.ts
│   │   ├── stages.config.ts
│   │   └── prompts.config.ts
│   ├── hooks/               # Custom hooks (planned)
│   └── styles/              # Global styles
│       └── globals.css
├── telegram-bot/            # Telegram bot (planned)
├── docs/                    # Documentation (planned)
├── .env.example             # Environment template
├── README.md                # Full documentation
├── JUMPSTART.md             # This file (project state)
└── Codegen framework.pdf    # Original PRD
```

### Key Design Decisions

1. **TypeScript Path Aliases**: Using `@/` prefix for internal imports
   - `@/types/*` instead of `@types/*` (avoids TypeScript conflict)
   - `@components/*`, `@pages/*`, `@services/*`, etc.

2. **State Management**: Zustand with persistence
   - Lightweight, no boilerplate
   - Local storage persistence
   - 4 separate stores for separation of concerns

3. **Storage Strategy**: Dual local + cloud
   - Always save to local storage (instant, offline-first)
   - Optionally sync to Supabase (when available)
   - Graceful fallback

4. **Claude Integration**: API-based (not actual CLI)
   - Simulates CLI via Anthropic API
   - Prompt builder concatenates stage inputs
   - RAG library with best practices

5. **n8n Integration**: REST API only
   - CRUD operations for workflows
   - Activation/deactivation
   - JSON-based workflow definitions

---

## 🔧 Development Setup

### Prerequisites

- **Node.js**: 18+ (currently using Node.js with npm)
- **Claude API Key**: Get from https://www.anthropic.com/
- **n8n Instance**: Optional, for workflow automation
- **Git**: Installed and configured

### Environment Variables

Create `.env` file (from `.env.example`):

```bash
# Supabase (Required for cloud sync)
VITE_SUPABASE_URL=https://xxx.supabase.co   # Your Supabase project URL
VITE_SUPABASE_ANON_KEY=eyJ...               # Your Supabase anon key

# n8n (Optional for workflow automation)
VITE_N8N_BASE_URL=https://your-n8n.com      # Your n8n instance
VITE_N8N_API_KEY=your-n8n-key               # n8n API key

# App Configuration
VITE_APP_ID=claudegen-coach-default         # App identifier
```

### Installation & Run

```bash
# Install dependencies
npm install

# Development mode (hot reload)
npm run dev
# → Opens at http://localhost:5173

# Production build
npm run build
# → Output in dist/

# Preview production build
npm run preview

# Lint code
npm run lint
```

---

## 📦 Dependencies

### Core (26 packages)

```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.20.0",
  "zustand": "^4.4.7",
  "@supabase/supabase-js": "^2.80.0",
  "axios": "^1.6.2",
  "@monaco-editor/react": "^4.6.0",
  "archiver": "^6.0.1",
  "prismjs": "^1.29.0"
}
```

### Dev Dependencies

```json
{
  "typescript": "^5.3.3",
  "vite": "^5.0.8",
  "@vitejs/plugin-react": "^4.2.1",
  "tailwindcss": "^3.3.6",
  "autoprefixer": "^10.4.16",
  "postcss": "^8.4.32",
  "eslint": "^8.55.0"
}
```

**Total**: 352 packages installed (reduced from 426 after removing Firebase)

---

## 📚 Key Files Reference

### Configuration Files

- `vite.config.ts` - Vite build config with path aliases
- `tsconfig.json` - TypeScript strict mode + path aliases
- `tailwind.config.js` - Dark theme colors
- `postcss.config.js` - Tailwind + Autoprefixer
- `.env.example` - Environment variable template

### Core Application

- `src/App.tsx` - Main app component with routing
- `src/main.tsx` - React entry point
- `src/vite-env.d.ts` - Vite environment types

### State Stores

- `src/store/authStore.ts` - User authentication state
- `src/store/projectStore.ts` - Project data state
- `src/store/stageStore.ts` - Workflow stage progression
- `src/store/settingsStore.ts` - App settings (API keys, theme)

### API Clients

- `src/services/api/claude/claudeClient.ts` - Claude API integration
- `src/services/api/claude/promptBuilder.ts` - RAG prompt system
- `src/services/api/n8n/n8nClient.ts` - n8n REST API client
- `src/services/api/n8n/workflowService.ts` - Workflow generators
- `src/services/api/supabase/supabaseService.ts` - Supabase CRUD + Auth

### Important Configs

- `src/config/prompts.config.ts` - RAG library with 6-stage prompts
- `src/config/stages.config.ts` - Stage validation gates
- `src/config/supabase.config.ts` - Supabase initialization

---

## 🎯 The 6-Stage Workflow (From PRD)

### Stage 1: Idea Management & Validation
**File**: `src/pages/Stage1_IdeaManagement/IdeaManagement.tsx`

**Purpose**: Define concept, target user, problem
**Output**: Refined app concept, Market Analysis Report
**Features**: F-201 (Idea Prompter), F-202 (Iterative Refinement), F-205 (RAG Library)

**Status**: 🟡 Scaffolded (needs implementation)

### Stage 2: Concept Validation (PoC)
**File**: `src/pages/Stage2_ConceptValidation/ConceptValidation.tsx`

**Purpose**: Test feasibility with proof-of-concept
**Output**: Technical Feasibility Report, PoC code snippets
**Features**: Claude CLI generates PoC documentation/code

**Status**: 🟡 Scaffolded (needs implementation)

### Stage 3: Feature Specification
**File**: `src/pages/Stage3_Specification/Specification.tsx`

**Purpose**: Define features, UI requirements, stack
**Output**: Structured JSON/Markdown Feature List (User Stories)
**Features**: F-203 (Specification Builder), F-202 (Iterative Refinement)

**Status**: 🟡 Scaffolded (needs implementation)

### Stage 4: Claude CLI Configuration
**File**: `src/pages/Stage4_CLIConfiguration/CLIConfiguration.tsx`

**Purpose**: Connect Claude API, select parameters
**Output**: Live connection confirmed
**Features**: F-101 (API Key), F-102 (Connection Test), F-103 (Logger)

**Status**: 🟢 Partially implemented (API client ready)

### Stage 5: Code Generation, Review & QA
**File**: `src/pages/Stage5_CodeGeneration/CodeGeneration.tsx`

**Purpose**: Generate production-ready code
**Output**: Functioning code files, QA/UAT Test Plan
**Features**: F-301 (Multi-File Display), F-302 (Live Preview), F-303 (Test Plan), F-304 (Download)

**Status**: 🟡 Scaffolded (needs Monaco editor)

### Stage 6: Automation & Launch Prep
**File**: `src/pages/Stage6_Automation/Automation.tsx`

**Purpose**: Generate n8n workflows, README, download bundle
**Output**: Exportable ZIP, n8n Workflow JSON
**Features**: F-401 (README Gen), F-402 (n8n Management), F-403 (Activation)

**Status**: 🟢 Partially implemented (n8n client ready)

---

## 🔑 User Preferences & Decisions

### Key Decisions Made

1. ✅ **Both web + Telegram bot** (not just one)
2. ✅ **Zustand for state management** (over Context API or Redux)
3. ✅ **Tailwind CSS for styling** (utility-first approach)
4. ✅ **Supabase instead of Firebase** (user requested, migration pending)
5. ✅ **Phased development approach** (implement features incrementally)
6. ✅ **GitHub first** (version control before feature implementation)

### Implementation Preferences

- **Dark mode only** (no light theme for MVP)
- **Desktop primary** (mobile responsive but not priority)
- **Focus on frontend** (backend/deployment out of scope for MVP)
- **No backend generation** (frontend web apps only)
- **No Git integration** in app (separate from version control)

---

## 🔄 Recent Changes

### Last Commit: c0d602c
**Date**: November 6, 2025
**Message**: "Complete Firebase → Supabase migration"

**Changes**:
- 14 files changed (+770 lines, -1,191 lines)
- Added SUPABASE_SETUP.md with comprehensive guide
- Replaced Firebase with Supabase completely
- Created supabase.config.ts and supabaseService.ts
- Removed 74 packages (Firebase dependencies)
- Added 9 packages (@supabase/supabase-js)
- Updated all documentation (README, JUMPSTART)
- Build successful (0 errors)

### Recent Fixes

1. **TypeScript import errors**: Changed `@types/*` to `@/types/*` to avoid conflict
2. **n8n connection arrays**: Fixed connection structure (removed extra array nesting)
3. **Axios import syntax**: Changed to `{ type AxiosInstance }` format
4. **Unused variables**: Commented out or prefixed with `_`
5. **Supabase imports**: Removed unused SUPABASE_APP_ID import

---

## 🚀 Next Actions (Immediate)

### ✅ 1. GitHub Integration (COMPLETED)

Repository: https://github.com/Mikecranesync/claudegen-coach

```bash
# Already done! ✅
git remote -v
# origin	https://github.com/Mikecranesync/claudegen-coach.git
```

### ✅ 2. Supabase Migration (COMPLETED)

**What was done**:
1. ✅ Created SUPABASE_SETUP.md with comprehensive setup instructions
2. ✅ Installed @supabase/supabase-js (v2.80.0)
3. ✅ Removed Firebase dependencies (74 packages removed)
4. ✅ Created supabase.config.ts with database types
5. ✅ Created supabaseService.ts with CRUD + Auth methods
6. ✅ Updated storage service to use Supabase
7. ✅ Updated environment variables (.env.example)
8. ✅ Build successful (0 errors)

**Next step**: Follow SUPABASE_SETUP.md to create your Supabase project and add credentials to .env

### 3. Implement Stage 1 (After Supabase)

**Tasks**:
- Build idea input forms
- Connect to Claude API
- Display AI-generated analysis
- Save to Supabase
- Validation gate implementation

---

## 📖 Reference Documents

### Primary Documentation

1. **README.md** - Full project documentation, setup guide
2. **JUMPSTART.md** (this file) - Current state, cold start guide
3. **Codegen framework.pdf** - Original PRD with all requirements

### Key Sections in PRD

- **Section 1**: Introduction & Goals (pg 1)
- **Section 2**: 6-Stage Guided Workflow (pg 2-3)
- **Section 3**: Core Features & User Stories (pg 4-6)
- **Section 4**: Design & Technical Requirements (pg 6-7)

### Feature IDs from PRD

- F-101: Claude Key Management
- F-102: Connection Test
- F-103: CLI Command Logger
- F-104: n8n API Key Management
- F-201: Idea Prompter
- F-202: Iterative Refinement
- F-203: Specification Builder
- F-204: Session Persistence
- F-205: Knowledge Base Integration (RAG)
- F-301: Multi-File Display
- F-302: Live Preview
- F-303: Test Plan Generation
- F-304: Code Download
- F-401: Documentation Generation
- F-402: n8n Workflow Management
- F-403: Workflow Activation
- F-404: Automated Scheduling/Reminders (Optional)

---

## 🔍 Troubleshooting

### Build Errors

```bash
# If build fails, try:
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Path Alias Issues

If imports aren't resolving, check:
1. `tsconfig.json` - `paths` configuration
2. `vite.config.ts` - `resolve.alias` configuration
3. Both should have matching aliases

### Firebase Not Available

The app works without Firebase/Supabase using local storage fallback.
Check: `src/services/storage/localStorage.ts`

---

## 💡 Tips for Cold Start

### Quick Context Recovery

1. **Read this file** (JUMPSTART.md) - 5 min
2. **Scan README.md** - 2 min
3. **Check git log** - `git log --oneline -10`
4. **Review last todos** - See "Next Actions" section above
5. **Run the app** - `npm run dev`

### Key Questions to Ask

- What phase are we in? → **Phase 4: GitHub Integration**
- What's next? → **Push to GitHub, then Supabase migration**
- What's blocked? → **Nothing currently**
- What's the priority? → **User requested: Supabase > GitHub > phased dev**

### Files to Check First

1. `src/App.tsx` - Routing and main structure
2. `src/store/*.ts` - Current state shape
3. `src/services/api/` - API integration status
4. `package.json` - Dependencies and scripts

---

## 📊 Project Metrics

- **Total Files**: 54 (was 53)
- **Total Lines**: 9,552 (was 8,973)
- **TypeScript Coverage**: 100% (strict mode)
- **Build Status**: ✅ Passing (0 errors)
- **Dependencies**: 352 packages (was 426, removed 74)
- **Bundle Size**: 168.42 KB (gzipped: 54.36 KB)
- **Test Coverage**: 0% (tests not implemented yet)
- **Git Commits**: 4
- **Backend**: Supabase (was Firebase)

---

## 🎯 Success Criteria (from PRD)

### V1.0 MVP Goals

1. ✅ Validate End-to-End Flow - Guide 100 beta users through PDLC
2. ⏳ Drive Engagement - 30 min/session, 15% conversion to paid
3. ⏳ Establish Reliability - 98% connection success (Claude + n8n)
4. ⏳ Efficiency Gains - 60% faster time-to-spec, 70% validation rate
5. ⏳ Monetization - 15% conversion to paid subscriptions

---

## 📝 Notes for Future Sessions

### What Works Well

- TypeScript strict mode catching errors early
- Zustand simplicity (no Redux boilerplate)
- Tailwind CSS speed for styling
- Path aliases making imports clean

### Known Limitations

- Monaco editor not yet integrated (Stage 5 needs this)
- Real ZIP generation needs archiver implementation
- No authentication implemented (Settings has placeholders)
- Telegram bot not started

### Technical Debt

- None significant yet (fresh codebase)
- Consider adding Prettier for code formatting
- May want Husky for pre-commit hooks

---

**🚀 Ready to Resume!**

Everything you need to cold start is in this file. Update it after each major milestone.

---

*Generated: November 6, 2025*
*Maintained by: Claude Code*