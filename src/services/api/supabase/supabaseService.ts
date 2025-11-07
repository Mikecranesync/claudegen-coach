import { supabase, isSupabaseAvailable } from '@config/supabase.config'
import type { Project } from '@/types/project'

class SupabaseService {
  // Project operations
  async saveProject(userId: string, project: Project): Promise<void> {
    if (!isSupabaseAvailable() || !supabase) {
      console.warn('Supabase not available, using local storage')
      return
    }

    try {
      const { error } = await supabase
        .from('projects')
        .upsert({
          id: project.id,
          user_id: userId,
          name: project.name,
          description: project.description,
          current_stage: project.currentStage,
          stages: project.stages,
          metadata: project.metadata,
          updated_at: new Date().toISOString(),
        })

      if (error) throw error
    } catch (error) {
      console.error('Error saving project to Supabase:', error)
      throw error
    }
  }

  async getProject(projectId: string): Promise<Project | null> {
    if (!isSupabaseAvailable() || !supabase) {
      return null
    }

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single()

      if (error) throw error

      if (data) {
        return {
          id: data.id,
          userId: data.user_id,
          name: data.name,
          description: data.description || '',
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at),
          currentStage: data.current_stage,
          stages: data.stages,
          metadata: data.metadata,
        } as Project
      }

      return null
    } catch (error) {
      console.error('Error fetching project from Supabase:', error)
      return null
    }
  }

  async getUserProjects(userId: string): Promise<Project[]> {
    if (!isSupabaseAvailable() || !supabase) {
      return []
    }

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })

      if (error) throw error

      return (data || []).map((item) => ({
        id: item.id,
        userId: item.user_id,
        name: item.name,
        description: item.description || '',
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
        currentStage: item.current_stage,
        stages: item.stages,
        metadata: item.metadata,
      })) as Project[]
    } catch (error) {
      console.error('Error fetching user projects:', error)
      return []
    }
  }

  async updateProject(projectId: string, updates: Partial<Project>): Promise<void> {
    if (!isSupabaseAvailable() || !supabase) {
      return
    }

    try {
      const { error } = await supabase
        .from('projects')
        .update({
          ...(updates.name && { name: updates.name }),
          ...(updates.description && { description: updates.description }),
          ...(updates.currentStage && { current_stage: updates.currentStage }),
          ...(updates.stages && { stages: updates.stages }),
          ...(updates.metadata && { metadata: updates.metadata }),
          updated_at: new Date().toISOString(),
        })
        .eq('id', projectId)

      if (error) throw error
    } catch (error) {
      console.error('Error updating project:', error)
      throw error
    }
  }

  async deleteProject(projectId: string): Promise<void> {
    if (!isSupabaseAvailable() || !supabase) {
      return
    }

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)

      if (error) throw error
    } catch (error) {
      console.error('Error deleting project:', error)
      throw error
    }
  }

  // User settings operations
  async saveUserSettings(userId: string, settings: Record<string, any>): Promise<void> {
    if (!isSupabaseAvailable() || !supabase) {
      return
    }

    try {
      const { error} = await supabase
        .from('user_settings')
        .upsert({
          user_id: userId,
          ...settings,
          updated_at: new Date().toISOString(),
        })

      if (error) throw error
    } catch (error) {
      console.error('Error saving settings:', error)
      throw error
    }
  }

  async getUserSettings(userId: string): Promise<Record<string, any> | null> {
    if (!isSupabaseAvailable() || !supabase) {
      return null
    }

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching settings:', error)
      return null
    }
  }

  isAvailable(): boolean {
    return isSupabaseAvailable()
  }

  // Authentication helpers
  async getCurrentUser() {
    if (!supabase) return null
    const { data: { user } } = await supabase.auth.getUser()
    return user
  }

  async signIn(email: string, password: string) {
    if (!supabase) throw new Error('Supabase not initialized')
    return await supabase.auth.signInWithPassword({ email, password })
  }

  async signUp(email: string, password: string) {
    if (!supabase) throw new Error('Supabase not initialized')
    return await supabase.auth.signUp({ email, password })
  }

  async signOut() {
    if (!supabase) throw new Error('Supabase not initialized')
    return await supabase.auth.signOut()
  }
}

export const supabaseService = new SupabaseService()
