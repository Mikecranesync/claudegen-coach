# ClaudeGen Coach - AI Coding Standards

**Purpose**: This file contains project-specific coding standards that are automatically prepended to all AI-generated code prompts (both interactive Claude Code sessions and autonomous bot operations).

**Last Updated**: November 7, 2025
**Version**: 1.0.0

---

## 🎯 Project Overview

**ClaudeGen Coach** is a 6-stage guided workflow application for non-technical founders to build web applications using AI assistance.

**Tech Stack**:
- Frontend: React 18 + TypeScript + Vite
- Styling: Tailwind CSS (dark mode)
- State: Zustand (4 stores with persist middleware)
- Routing: React Router v6
- Backend: Supabase (PostgreSQL + Auth)
- APIs: Claude AI API, n8n REST API

**Architecture**: Offline-first with cloud sync fallback

---

## 📋 TypeScript Guidelines

### Strict Mode Compliance
- **Always** use TypeScript strict mode (already configured in `tsconfig.json`)
- **No** `any` types unless absolutely necessary (prefer `unknown` + type guards)
- **All** function parameters must have explicit types
- **All** function return types must be declared explicitly

### Type Definitions
- **Location**: `src/types/` directory
- **Convention**: One file per domain (`project.ts`, `user.ts`, `stage.ts`, etc.)
- **Exports**: Use named exports, not default exports
- **Naming**: PascalCase for interfaces/types (`User`, `Project`, `Stage1Data`)

### Path Aliases
- **Use** path aliases for all imports (configured in `tsconfig.json` and `vite.config.ts`)
- **Pattern**: `@/` prefix for internal imports
  ```typescript
  // ✅ Correct
  import { User } from '@/types/user'
  import { Button } from '@components/common/Button/Button'

  // ❌ Incorrect
  import { User } from '../../../types/user'
  import { Button } from '../../components/common/Button/Button'
  ```

### Null Safety
- **Always** check for null/undefined before accessing properties
  ```typescript
  // ✅ Correct
  const userName = user?.displayName || 'Anonymous'

  // ❌ Incorrect
  const userName = user.displayName // Might crash
  ```

---

## ⚛️ React Guidelines

### Component Structure
- **Always** use functional components with hooks (no class components)
- **Always** use TypeScript `React.FC` type for components
- **File naming**: PascalCase matching component name (`Button.tsx`, `IdeaManagement.tsx`)
- **Directory structure**: One component per directory with index file optional
  ```
  components/
  └── common/
      └── Button/
          └── Button.tsx
  ```

### Hooks Rules
- **Order**: useState → useEffect → custom hooks → useCallback/useMemo
- **Dependencies**: Always include all dependencies in useEffect/useCallback/useMemo arrays
- **Custom hooks**: Prefix with `use` (e.g., `useAuth`, `useProject`)
- **Location**: `src/hooks/` for shared hooks

### Props Pattern
```typescript
// ✅ Correct: Interface for props
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
  disabled?: boolean
  children: React.ReactNode
}

const Button: React.FC<ButtonProps> = ({ variant = 'primary', size = 'md', onClick, disabled, children }) => {
  // Implementation
}
```

### State Management
- **Use Zustand** for global state (not Context API or Redux)
- **Zustand stores**: Located in `src/store/`
- **Store naming**: `use[Domain]Store` (e.g., `useAuthStore`, `useProjectStore`)
- **Persist middleware**: Use for data that should survive page refreshes
  ```typescript
  export const useAuthStore = create<AuthStore>()(
    persist(
      (set) => ({
        // state and actions
      }),
      {
        name: 'auth-storage', // localStorage key
      }
    )
  )
  ```

### Event Handlers
- **Naming**: Prefix with `handle` (e.g., `handleClick`, `handleSubmit`, `handleChange`)
- **Async handlers**: Use try-catch with error state
  ```typescript
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await someAsyncOperation()
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }
  ```

---

## 🎨 Tailwind CSS Guidelines

### Utility-First Approach
- **Prefer** utility classes over custom CSS
- **Use** `className` prop (not inline styles)
- **Only** create custom classes for repeated patterns (in `globals.css`)

### Color System
- **Dark mode only** (for MVP)
- **Primary**: `primary-400`, `primary-500`, `primary-600`
- **Text**: `dark-text` (primary), `dark-text-secondary` (muted)
- **Background**: `dark-bg`, `dark-bg-secondary`, `dark-bg-tertiary`
- **Borders**: `dark-border`

### Common Patterns
```typescript
// Card container
<div className="card">

// Button styles (use Button component instead)
<button className="btn-primary">

// Input styles (use Input component instead)
<input className="input-field">
```

### Responsive Design
- **Mobile-first**: Design for mobile, then use `md:`, `lg:` breakpoints
- **Breakpoints**: `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px)

---

## 🗂️ Naming Conventions

### Files & Directories
- **Components**: PascalCase (`Button.tsx`, `IdeaManagement.tsx`)
- **Utilities**: camelCase (`validation.ts`, `formatters.ts`)
- **Types**: camelCase (`user.ts`, `project.ts`)
- **Stores**: camelCase (`authStore.ts`, `projectStore.ts`)
- **Directories**: PascalCase for components, camelCase for others

### Variables & Functions
- **Variables**: camelCase (`userId`, `projectName`, `isLoading`)
- **Constants**: UPPER_SNAKE_CASE for true constants (`API_BASE_URL`, `MAX_RETRIES`)
- **Functions**: camelCase, verb-first (`getUserById`, `calculateTotal`, `validateEmail`)
- **Boolean variables**: Prefix with `is`, `has`, `should` (`isLoading`, `hasAccess`, `shouldShow`)

### React Specifics
- **Components**: PascalCase (`Button`, `UserProfile`, `Stage1IdeaManagement`)
- **Props interfaces**: ComponentName + `Props` (`ButtonProps`, `InputProps`)
- **Event handlers**: `handle` + Action (`handleClick`, `handleSubmit`)
- **State setters**: `set` + StateName (`setUser`, `setLoading`, `setError`)

---

## 🚨 Error Handling

### Try-Catch Blocks
- **Always** wrap async operations in try-catch
- **Always** set loading state before async operations
- **Always** clear error state at the start of operations
- **Always** use `finally` to clear loading state

```typescript
// ✅ Correct pattern
const [isLoading, setLoading] = useState(false)
const [error, setError] = useState<string | null>(null)

const handleAction = async () => {
  setLoading(true)
  setError(null)

  try {
    const result = await someAsyncOperation()
    // Handle success
  } catch (err: any) {
    setError(err.message || 'An unexpected error occurred')
    console.error('Action failed:', err)
  } finally {
    setLoading(false)
  }
}
```

### Error Messages
- **User-facing**: Clear, actionable messages (not technical jargon)
- **Console**: Detailed technical errors (but guard with `import.meta.env.DEV`)
  ```typescript
  if (import.meta.env.DEV) {
    console.error('Full error details:', error)
  }
  ```

### Error UI
- **Display**: Show error messages in red text below forms/actions
- **Icons**: Use ⚠️ or ❌ emoji for visual feedback
- **Recovery**: Provide clear next steps or retry buttons

---

## 🔌 API Integration

### Claude API
- **Client**: Use `claudeClient` from `src/services/api/claude/claudeClient.ts`
- **API Key**: Always read from `settingsStore.claudeApiKey` (with env fallback)
- **Check before use**: Validate API key exists before calling
  ```typescript
  const { claudeApiKey } = useSettingsStore()

  if (!claudeApiKey) {
    setError('Claude API key not configured. Please set it in Settings.')
    return
  }

  claudeClient.setApiKey(claudeApiKey)
  const response = await claudeClient.sendRequest({ ... })
  ```

### Supabase
- **Service**: Use `supabaseService` from `src/services/api/supabase/supabaseService.ts`
- **Auth**: Always check if user is authenticated before data operations
- **RLS**: Remember Row Level Security is enabled - queries auto-filter by user_id
- **Error handling**: Supabase errors have `.message` property

### Storage Service
- **Dual strategy**: Always save to localStorage first, then attempt cloud sync
- **User ID**: Must be set after login via `storageService.setUserId(user.id)`
- **Graceful degradation**: App works offline if Supabase unavailable

---

## 📝 Comments & Documentation

### When to Comment
- **Do**: Explain *why* code does something non-obvious
- **Don't**: Explain *what* code does (code should be self-documenting)
- **Do**: Document complex algorithms or business logic
- **Don't**: Leave commented-out code (delete it)

### JSDoc
- **Use** for exported functions/utilities
- **Include** parameter descriptions and return types
  ```typescript
  /**
   * Validates an email address format
   * @param email - The email address to validate
   * @returns true if valid, false otherwise
   */
  export function validateEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }
  ```

### TODOs
- **Format**: `// TODO: Description` or `// FIXME: Description`
- **Context**: Include why it's needed and ticket reference if applicable
- **Don't**: Leave TODOs without context

---

## 🧪 Testing (Future)

### Testing Strategy (Not Yet Implemented)
- **Unit tests**: Vitest (configured but no tests yet)
- **Integration tests**: React Testing Library (planned)
- **E2E tests**: Playwright (planned)

### When Tests Exist
- **Always** run tests before committing: `npm test`
- **Always** write tests for new utilities and hooks
- **Cover** happy path + error cases

---

## 🚀 Performance

### Optimization Guidelines
- **Avoid** premature optimization (focus on correctness first)
- **Use** `React.memo` only for expensive components
- **Use** `useMemo` for expensive calculations (not simple values)
- **Use** `useCallback` for functions passed to memoized children

### Bundle Size
- **Lazy load** routes if needed: `const Component = lazy(() => import('./Component'))`
- **Tree shaking**: Import only what you need (e.g., `import { format } from 'date-fns/format'`)

---

## 🔒 Security

### Authentication
- **Never** bypass authentication in production (guard dev-only features with `import.meta.env.DEV`)
- **Always** use `PrivateRoute` wrapper for protected pages
- **Check** `user` from `useAuth()` before displaying sensitive data

### Secrets
- **Never** commit API keys, tokens, or credentials to git
- **Always** use environment variables (`import.meta.env.VITE_*`)
- **Store** user secrets in Supabase, not localStorage (when possible)

### Input Validation
- **Sanitize** user inputs before sending to APIs
- **Validate** on both client and server (don't trust client-only validation)
- **Escape** user-generated content (React does this by default, but verify)

---

## 📦 Dependencies

### Adding New Dependencies
- **Prefer** packages with active maintenance and good TypeScript support
- **Check** bundle size impact (`npm install -D @size-limit/preset-app`)
- **Audit** security: `npm audit`
- **Document** why dependency was added in commit message

### Version Management
- **Lock** versions in `package.json` (no `^` or `~` for production)
- **Test** thoroughly after dependency updates
- **Check** breaking changes in changelogs

---

## 🔄 Git Workflow

### Commits
- **Format**: `type: Brief description` (e.g., `fix: Correct user ID in project creation`)
- **Types**: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `style`
- **Body**: Explain *why* if not obvious from title
- **Footer**: Include `Closes #123` for issue fixes

### Branches
- **Main branch**: `master` (or `main`)
- **Feature branches**: `feature/description` or `fix/issue-123`
- **Avoid**: Long-lived branches (merge frequently)

### Code Review
- **Self-review**: Read your own diff before creating PR
- **Context**: Provide clear PR description with testing steps
- **Size**: Keep PRs focused (< 500 lines when possible)

---

## 🎯 Code Quality Checklist

Before committing code, verify:

- [ ] No TypeScript errors (`npm run build`)
- [ ] No ESLint errors (`npm run lint`)
- [ ] All imports use path aliases (`@/`, `@components/`, etc.)
- [ ] All functions have explicit return types
- [ ] Error handling implemented for async operations
- [ ] Loading states shown for async operations
- [ ] User-facing error messages are clear and actionable
- [ ] No `console.log()` in production code (or guarded with `import.meta.env.DEV`)
- [ ] Components follow naming conventions
- [ ] No hardcoded values (use constants or env variables)
- [ ] No commented-out code (delete it)
- [ ] Responsive design tested (at least mobile + desktop)

---

## 📚 Additional Resources

- **Project Documentation**: [README.md](./README.md)
- **Project State**: [JUMPSTART.md](./JUMPSTART.md)
- **Supabase Setup**: [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
- **Testing Guide**: [TESTING_GUIDE.md](./TESTING_GUIDE.md)
- **Original PRD**: [Codegen framework.pdf](./Codegen%20framework.pdf)

---

## 🤖 For Autonomous Bot

When generating code automatically via the autonomous bot:

1. **Read** this entire file before generating code
2. **Follow** all guidelines strictly (no shortcuts)
3. **Match** existing code style in the project
4. **Test** generated code compiles (`tsc --noEmit`)
5. **Validate** against checklists above
6. **Include** clear commit messages following conventions
7. **Reference** issue number in PR description (`Closes #XXX`)

---

*This file will evolve as the project grows. Update it when introducing new patterns or conventions.*
