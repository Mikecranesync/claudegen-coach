# ClaudeGen Coach

AI-Driven Product Development and Automation Assistant

## Overview

ClaudeGen Coach is a hybrid desktop/web and conversational application that serves as an AI-guided product development coach and automation control plane. It democratizes product and app development by guiding users—from non-technical founders to technical managers—through the full Product Development Life Cycle (PDLC).

### Key Features

- **6-Stage Guided Workflow**: From Idea Management to Automation & Launch Prep
- **Claude CLI Integration**: AI-powered code generation and assistance
- **n8n Workflow Management**: Automate deployment and operational workflows
- **Dark Mode UI**: Modern, developer-friendly interface
- **State Persistence**: Local storage with optional cloud sync
- **Telegram Bot Support**: Conversational interface (planned)

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS with custom dark theme
- **State Management**: Zustand
- **Routing**: React Router v6
- **Backend/Database**: Supabase (PostgreSQL + Auth)
- **APIs**: Claude AI API, n8n REST API

## Project Structure

```
claudegen-coach/
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── common/        # Button, Input, etc.
│   │   └── layout/        # Layout components
│   ├── pages/             # 6-stage workflow pages
│   │   ├── Dashboard/
│   │   ├── Stage1_IdeaManagement/
│   │   ├── Stage2_ConceptValidation/
│   │   ├── Stage3_Specification/
│   │   ├── Stage4_CLIConfiguration/
│   │   ├── Stage5_CodeGeneration/
│   │   ├── Stage6_Automation/
│   │   └── Settings/
│   ├── services/          # API integrations
│   │   ├── api/
│   │   │   ├── claude/    # Claude CLI client
│   │   │   ├── n8n/       # n8n REST API client
│   │   │   └── supabase/  # Supabase service
│   │   └── storage/       # Local/Cloud storage
│   ├── store/             # Zustand state stores
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Utility functions
│   ├── config/            # App configuration
│   └── hooks/             # Custom React hooks (planned)
├── telegram-bot/          # Telegram bot service (planned)
└── public/                # Static assets

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Claude API key ([Get one here](https://www.anthropic.com/))
- n8n instance (optional, for workflow automation)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd codegen
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your credentials:
```bash
# Supabase (Required for cloud sync - see SUPABASE_SETUP.md)
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# n8n (Optional for workflow automation)
VITE_N8N_BASE_URL=https://your-n8n-instance.com
VITE_N8N_API_KEY=your-n8n-api-key

# App Configuration
VITE_APP_ID=claudegen-coach-default
```

**See `SUPABASE_SETUP.md` for detailed setup instructions.**

4. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The production build will be in the `dist/` directory.

## The 6-Stage Workflow

### Stage 1: Idea Management & Validation
- Define core concept, target user, and problem statement
- AI-powered market analysis and competitive insights
- Business objectives validation

### Stage 2: Concept Validation (PoC)
- Generate proof-of-concept code
- Technical feasibility assessment
- Viability confirmation

### Stage 3: Feature Specification
- Define features using MoSCoW method (Must, Should, Could, Won't)
- Create user stories with acceptance criteria
- Select technology stack

### Stage 4: Claude CLI Configuration
- Configure Claude API connection
- Set generation parameters (complexity, language, model)
- Test connection status

### Stage 5: Code Generation, Review & QA
- Generate production-ready code
- Multi-file code editor with syntax highlighting
- Live preview sandbox
- QA/UAT test plan generation
- Download project as ZIP

### Stage 6: Automation & Launch Prep
- Generate n8n workflow JSON
- Create README and documentation
- Activate/deactivate workflows via n8n API
- Final project package download

## API Configuration

### Claude CLI

The app uses the Claude API (not the actual CLI) to simulate CLI interactions. Configure your API key in Settings.

**Supported Models:**
- claude-3-opus-20240229
- claude-3-sonnet-20240229 (default)
- claude-3-haiku-20240307

### n8n Workflows

Connect your n8n instance to enable workflow automation:

1. Go to Settings
2. Enter your n8n Base URL
3. Add your n8n API key
4. Test the connection

## Development Roadmap

- [x] Phase 1: Core Infrastructure
  - [x] React + TypeScript + Vite setup
  - [x] Tailwind CSS dark theme
  - [x] Routing and navigation
  - [x] Zustand state management
  - [x] TypeScript types and interfaces

- [x] Phase 2: Service Layer
  - [x] Claude API client
  - [x] n8n REST API client
  - [x] Supabase integration (PostgreSQL + Auth)
  - [x] Local storage fallback
  - [x] Prompt building system

- [x] Phase 3: UI Components
  - [x] Common components (Button, Input)
  - [x] Layout components (Header, Sidebar, MainLayout)
  - [x] Page scaffolding for all 6 stages

- [ ] Phase 4: Stage Implementation
  - [ ] Stage 1: Idea Management
  - [ ] Stage 2: Concept Validation
  - [ ] Stage 3: Specification Builder
  - [ ] Stage 4: CLI Configuration
  - [ ] Stage 5: Code Editor & QA
  - [ ] Stage 6: Automation

- [x] Phase 4: GitHub Integration
  - [x] Git repository initialized
  - [x] Pushed to GitHub
  - [x] JUMPSTART.md documentation

- [x] Phase 5: Supabase Migration
  - [x] Replaced Firebase with Supabase
  - [x] Created SUPABASE_SETUP.md guide
  - [x] Database types and service

- [ ] Phase 6: Advanced Features
  - [ ] Telegram bot
  - [ ] Monaco code editor integration
  - [ ] Real ZIP generation
  - [ ] Session persistence
  - [ ] Progress tracking

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Powered by Claude AI from Anthropic
- n8n for workflow automation
- React and Vite teams
- Tailwind CSS

## Support

For issues, questions, or contributions, please open an issue on GitHub.

---

**Version**: 1.0.0 (MVP)
**Status**: In Development
**Last Updated**: November 2025
