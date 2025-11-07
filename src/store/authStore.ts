import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, UserSettings } from '@/types/user'

interface AuthStore {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  setUser: (user: User | null) => void
  updateSettings: (settings: Partial<UserSettings>) => void
  logout: () => void
  setError: (error: string | null) => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
          error: null,
        }),

      updateSettings: (settings) =>
        set((state) => ({
          user: state.user
            ? {
                ...state.user,
                settings: {
                  ...state.user.settings,
                  ...settings,
                },
              }
            : null,
        })),

      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
          error: null,
        }),

      setError: (error) => set({ error }),

      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'auth-storage',
    }
  )
)
