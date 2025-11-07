export const APP_NAME = 'ClaudeGen Coach'
export const APP_VERSION = '1.0.0'
export const APP_DESCRIPTION = 'AI-Driven Product Development and Automation Assistant'

// Supabase
export const SUPABASE_APP_ID = import.meta.env.VITE_APP_ID || 'claudegen-coach-default'

// API Endpoints
export const N8N_BASE_URL = import.meta.env.VITE_N8N_BASE_URL || ''
export const N8N_API_VERSION = 'v1'

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH: 'auth-storage',
  PROJECT: 'project-storage',
  SETTINGS: 'settings-storage',
  SESSION: 'session-data',
} as const

// Stage Configuration
export const STAGE_COUNT = 6
export const INITIAL_STAGE = 1

// File Generation
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
export const SUPPORTED_LANGUAGES = [
  'javascript',
  'typescript',
  'html',
  'css',
  'json',
  'markdown',
  'python',
  'java',
  'go',
  'rust',
] as const

// Claude CLI
export const CLAUDE_MODELS = [
  'claude-3-opus-20240229',
  'claude-3-sonnet-20240229',
  'claude-3-haiku-20240307',
] as const

export const DEFAULT_CLAUDE_MODEL = 'claude-3-sonnet-20240229'

// UI
export const TOAST_DURATION = 3000
export const DEBOUNCE_DELAY = 500

// Validation
export const MIN_PROJECT_NAME_LENGTH = 3
export const MAX_PROJECT_NAME_LENGTH = 100
export const MIN_DESCRIPTION_LENGTH = 10
export const MAX_DESCRIPTION_LENGTH = 500
