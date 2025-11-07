export interface User {
  id: string
  email?: string
  displayName?: string
  createdAt: Date
  settings: UserSettings
}

export interface UserSettings {
  claudeApiKey?: string
  n8nApiKey?: string
  n8nBaseUrl?: string
  theme: 'dark' | 'light'
  notifications: boolean
  saveProgress: boolean
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}
