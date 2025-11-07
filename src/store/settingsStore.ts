import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsStore {
  theme: 'dark' | 'light'
  claudeApiKey: string | null
  n8nApiKey: string | null
  n8nBaseUrl: string | null
  notifications: boolean
  saveProgress: boolean

  setTheme: (theme: 'dark' | 'light') => void
  setClaudeApiKey: (key: string | null) => void
  setN8nApiKey: (key: string | null) => void
  setN8nBaseUrl: (url: string | null) => void
  setNotifications: (enabled: boolean) => void
  setSaveProgress: (enabled: boolean) => void
  clearApiKeys: () => void
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      theme: 'dark',
      claudeApiKey: null,
      n8nApiKey: null,
      n8nBaseUrl: null,
      notifications: true,
      saveProgress: true,

      setTheme: (theme) => set({ theme }),

      setClaudeApiKey: (key) => set({ claudeApiKey: key }),

      setN8nApiKey: (key) => set({ n8nApiKey: key }),

      setN8nBaseUrl: (url) => set({ n8nBaseUrl: url }),

      setNotifications: (enabled) => set({ notifications: enabled }),

      setSaveProgress: (enabled) => set({ saveProgress: enabled }),

      clearApiKeys: () =>
        set({
          claudeApiKey: null,
          n8nApiKey: null,
          n8nBaseUrl: null,
        }),
    }),
    {
      name: 'settings-storage',
    }
  )
)
