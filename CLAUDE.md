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

## 🧪 Testing Standards

### Testing Strategy
- **Unit tests**: Vitest (✅ Cloudflare Worker, 🔄 React App)
- **Integration tests**: Vitest + mocks (🔄 Planned for Phase 2+)
- **Component tests**: React Testing Library (🔄 Planned for Phase 4+)
- **E2E tests**: Playwright (🔄 Planned for Phase 7)

### When to Write Tests

**Always write tests for:**
- All new features (before or immediately after implementation)
- All bug fixes (write failing test first, then fix)
- All utility functions and helpers
- All API integrations (use mocks)
- All data transformations and parsing logic
- All critical business logic

**Test-first approach preferred:**
1. Write failing test that describes expected behavior
2. Implement code to make test pass
3. Refactor with confidence

### Test File Naming

**Convention**: `{filename}.test.js` or `{filename}.test.ts`

```
src/
├── lib/
│   ├── auth.js
│   └── github.js
└── test/
    ├── unit/
    │   ├── auth.test.js          # Tests for lib/auth.js
    │   └── github.test.js        # Tests for lib/github.js
    ├── integration/
    │   └── webhook-flow.test.js  # End-to-end flow tests
    └── fixtures/
        ├── github-payloads.js    # Mock webhook data
        └── claude-responses.js   # Mock AI responses
```

### Test Structure

**Use `describe` and `it` blocks for organization:**

```javascript
import { describe, it, expect } from 'vitest';
import { validateEmail } from '../../lib/validation.js';

describe('Email Validation', () => {
  it('should accept valid email addresses', () => {
    expect(validateEmail('user@example.com')).toBe(true);
    expect(validateEmail('test.user+tag@domain.co.uk')).toBe(true);
  });

  it('should reject invalid email addresses', () => {
    expect(validateEmail('notanemail')).toBe(false);
    expect(validateEmail('@example.com')).toBe(false);
    expect(validateEmail('user@')).toBe(false);
  });

  it('should handle edge cases', () => {
    expect(validateEmail('')).toBe(false);
    expect(validateEmail(null)).toBe(false);
    expect(validateEmail(undefined)).toBe(false);
  });
});
```

**Group related tests together:**
- One `describe` block per function/module
- Multiple `it` blocks for different scenarios (happy path, error cases, edge cases)

### Mock Data Best Practices

**Create reusable fixtures in `test/fixtures/`:**

```javascript
// test/fixtures/github-payloads.js
export const validIssueCommentPayload = {
  action: 'created',
  issue: {
    number: 11,
    title: 'Fix authentication bug',
    body: 'The auth is broken',
  },
  comment: {
    body: '@claude fix cloudflare-worker/lib/auth.js',
    user: { login: 'username' },
  },
  repository: {
    owner: { login: 'owner' },
    name: 'repo',
  },
};

// Use in tests:
import { validIssueCommentPayload } from '../fixtures/github-payloads.js';
```

**Why use fixtures:**
- Realistic test data (copied from real API responses)
- Reusable across multiple tests
- Easy to maintain (update once, fix all tests)
- Documents expected API shapes

### Coverage Expectations

**Target coverage (run `npm run test:coverage`):**
- **Lines**: 80%+
- **Functions**: 80%+
- **Branches**: 75%+
- **Statements**: 80%+

**Priority by file type:**
- **Critical business logic**: 100% coverage (e.g., authentication, payment processing)
- **Utilities and helpers**: 90%+ coverage
- **API integrations**: 80%+ coverage (focus on error handling)
- **UI components**: 70%+ coverage (happy path + error states)
- **Simple presentational components**: 50%+ coverage (or skip)

**What to skip:**
- Trivial getters/setters
- Simple UI components with no logic
- Third-party library wrappers (test integration, not library)

### Running Tests

**Before every commit:**
```bash
npm test                # Run all tests
npm run test:coverage   # Check coverage
```

**During development:**
```bash
npm run test:watch      # Auto-rerun on file changes
npm run test:ui         # Visual test interface
```

**For specific files:**
```bash
npm test auth.test.js   # Run single test file
```

### Example Test Patterns

**Testing async functions:**
```javascript
it('should fetch user data successfully', async () => {
  const userData = await getUserById('123');

  expect(userData).toBeDefined();
  expect(userData.id).toBe('123');
  expect(userData.email).toContain('@');
});

it('should throw error for invalid user ID', async () => {
  await expect(getUserById('invalid')).rejects.toThrow('User not found');
});
```

**Testing error handling:**
```javascript
it('should handle network errors gracefully', async () => {
  // Mock fetch to fail
  global.fetch = vi.fn(() => Promise.reject(new Error('Network error')));

  const result = await fetchData();

  expect(result.error).toBe('Failed to fetch data');
  expect(result.data).toBeNull();
});
```

**Testing with mocks:**
```javascript
import { vi } from 'vitest';

it('should call GitHub API with correct parameters', async () => {
  const mockOctokit = {
    rest: {
      issues: {
        createComment: vi.fn().mockResolvedValue({ data: { id: 123 } }),
      },
    },
  };

  await addComment(mockOctokit, 'owner', 'repo', 1, 'Test comment');

  expect(mockOctokit.rest.issues.createComment).toHaveBeenCalledWith({
    owner: 'owner',
    repo: 'repo',
    issue_number: 1,
    body: 'Test comment',
  });
});
```

### CI/CD Integration

**Tests run automatically on every PR via GitHub Actions:**
- All tests must pass before merge
- Coverage report posted to PR as comment
- Failing tests block merge

**Local pre-commit hook (optional):**
```bash
# .git/hooks/pre-commit
npm test || exit 1
```

### Skipping Tests

**Only skip tests with good reason:**
```javascript
// ✅ Good: Complex to mock, deferred to integration tests
it.skip('should generate valid JWT with PKCS#8 key', async () => {
  // Requires valid RSA keys - tested in integration tests Phase 2
});

// ❌ Bad: Just lazy
it.skip('should validate input', () => {
  // TODO: Write this test later
});
```

**Better approach for deferred tests:**
```javascript
// Mark as TODO and throw to remind you
it.todo('should handle rate limiting correctly');
```

### Testing Checklist

Before committing code with tests:

- [ ] All new functions have corresponding tests
- [ ] Tests cover happy path
- [ ] Tests cover error cases
- [ ] Tests cover edge cases (null, undefined, empty, boundary values)
- [ ] Test names clearly describe what they test
- [ ] Tests are independent (don't rely on other tests)
- [ ] No hardcoded values (use fixtures or constants)
- [ ] Mocks reset between tests (`beforeEach` / `afterEach`)
- [ ] Tests run fast (< 1 second per test)
- [ ] Coverage meets targets (`npm run test:coverage`)
- [ ] All tests pass locally (`npm test`)

---

### Cloudflare Worker Testing

**See `cloudflare-worker/README.md` for Worker-specific testing docs**

Current status:
- ✅ 68 unit tests passing
- ✅ GitHub Actions CI configured
- ✅ Coverage reporting setup
- 🔄 Integration tests planned for Phase 2

### React App Testing

**Status**: Testing infrastructure configured, tests coming in Phase 4+

When writing React tests:
- Test user interactions, not implementation details
- Use `@testing-library/react` for component tests
- Test accessibility (screen readers, keyboard navigation)
- Mock API calls with `vi.fn()` or MSW (Mock Service Worker)

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
