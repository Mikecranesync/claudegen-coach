import { useCallback } from 'react'
import { useAuthStore } from '@store/authStore'
import { supabaseService } from '@services/api/supabase/supabaseService'
import { storageService } from '@services/storage/firestoreStorage'
import type { User, UserSettings } from '@/types/user'

export const useAuth = () => {
  const { user, isAuthenticated, isLoading, error, setUser, setError, setLoading, logout: storeLogout } = useAuthStore()

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: signInError } = await supabaseService.signIn(email, password)

      if (signInError) throw signInError

      if (data.user) {
        const newUser: User = {
          id: data.user.id,
          email: data.user.email || email,
          displayName: data.user.user_metadata?.displayName || email.split('@')[0],
          createdAt: new Date(data.user.created_at),
          settings: {
            claudeApiKey: '',
            n8nApiKey: '',
            n8nBaseUrl: '',
            theme: 'dark',
            notifications: true,
            saveProgress: true,
          },
        }

        // Update auth store
        setUser(newUser)

        // Connect storage service to this user for cloud sync
        storageService.setUserId(data.user.id)

        // Try to load user settings from Supabase
        try {
          const settings = await supabaseService.getUserSettings(data.user.id)
          if (settings) {
            const userSettings: Partial<UserSettings> = {
              claudeApiKey: settings.claude_api_key,
              n8nApiKey: settings.n8n_api_key,
              n8nBaseUrl: settings.n8n_base_url,
              theme: settings.theme || 'dark',
              notifications: settings.notifications ?? true,
              saveProgress: settings.save_progress ?? true,
            }
            // Update user with loaded settings
            setUser({ ...newUser, settings: { ...newUser.settings, ...userSettings } })
          }
        } catch (error) {
          console.warn('Could not load user settings:', error)
        }

        return { success: true, user: newUser }
      }

      throw new Error('Login failed: No user data returned')
    } catch (error: any) {
      const errorMessage = error?.message || 'Login failed. Please check your credentials.'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [setUser, setError, setLoading])

  const signup = useCallback(async (email: string, password: string, displayName?: string) => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: signUpError } = await supabaseService.signUp(email, password)

      if (signUpError) throw signUpError

      if (data.user) {
        const newUser: User = {
          id: data.user.id,
          email: data.user.email || email,
          displayName: displayName || data.user.user_metadata?.displayName || email.split('@')[0],
          createdAt: new Date(data.user.created_at),
          settings: {
            claudeApiKey: '',
            n8nApiKey: '',
            n8nBaseUrl: '',
            theme: 'dark',
            notifications: true,
            saveProgress: true,
          },
        }

        // Update auth store
        setUser(newUser)

        // Connect storage service to this user
        storageService.setUserId(data.user.id)

        return { success: true, user: newUser, needsEmailVerification: !data.user.confirmed_at }
      }

      throw new Error('Signup failed: No user data returned')
    } catch (error: any) {
      const errorMessage = error?.message || 'Signup failed. Please try again.'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [setUser, setError, setLoading])

  const logout = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      await supabaseService.signOut()
      storeLogout()
      storageService.setUserId('') // Clear user ID from storage service
      return { success: true }
    } catch (error: any) {
      const errorMessage = error?.message || 'Logout failed'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [storeLogout, setError, setLoading])

  const checkSession = useCallback(async () => {
    setLoading(true)

    try {
      const currentUser = await supabaseService.getCurrentUser()

      if (currentUser) {
        const user: User = {
          id: currentUser.id,
          email: currentUser.email || '',
          displayName: currentUser.user_metadata?.displayName || currentUser.email?.split('@')[0] || 'User',
          createdAt: new Date(currentUser.created_at),
          settings: {
            claudeApiKey: '',
            n8nApiKey: '',
            n8nBaseUrl: '',
            theme: 'dark',
            notifications: true,
            saveProgress: true,
          },
        }

        setUser(user)
        storageService.setUserId(currentUser.id)

        // Try to load user settings
        try {
          const settings = await supabaseService.getUserSettings(currentUser.id)
          if (settings) {
            const userSettings: Partial<UserSettings> = {
              claudeApiKey: settings.claude_api_key,
              n8nApiKey: settings.n8n_api_key,
              n8nBaseUrl: settings.n8n_base_url,
              theme: settings.theme || 'dark',
              notifications: settings.notifications ?? true,
              saveProgress: settings.save_progress ?? true,
            }
            setUser({ ...user, settings: { ...user.settings, ...userSettings } })
          }
        } catch (error) {
          console.warn('Could not load user settings:', error)
        }

        return true
      }

      return false
    } catch (error) {
      console.error('Session check failed:', error)
      return false
    } finally {
      setLoading(false)
    }
  }, [setUser, setLoading])

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    signup,
    logout,
    checkSession,
  }
}
