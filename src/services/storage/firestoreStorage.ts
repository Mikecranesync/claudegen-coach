import type { Project } from '@/types/project'
import { supabaseService } from '../api/supabase/supabaseService'
import { localStorageService } from './localStorage'

class UnifiedStorageService {
  private userId: string | null = null

  setUserId(userId: string): void {
    this.userId = userId
  }

  async saveProject(project: Project): Promise<void> {
    // Always save to local storage as fallback
    localStorageService.saveProject(project)

    // Also save to Supabase if available
    if (this.userId && supabaseService.isAvailable()) {
      try {
        await supabaseService.saveProject(this.userId, project)
      } catch (error) {
        console.error('Failed to sync to Supabase:', error)
      }
    }
  }

  async getProject(projectId: string): Promise<Project | null> {
    // Try Supabase first
    if (supabaseService.isAvailable()) {
      try {
        const project = await supabaseService.getProject(projectId)
        if (project) return project
      } catch (error) {
        console.error('Failed to fetch from Supabase:', error)
      }
    }

    // Fallback to local storage
    return localStorageService.getProject(projectId)
  }

  async getAllProjects(): Promise<Project[]> {
    // Try Supabase first
    if (this.userId && supabaseService.isAvailable()) {
      try {
        const projects = await supabaseService.getUserProjects(this.userId)
        if (projects.length > 0) return projects
      } catch (error) {
        console.error('Failed to fetch from Supabase:', error)
      }
    }

    // Fallback to local storage
    return localStorageService.getAllProjects()
  }

  async deleteProject(projectId: string): Promise<void> {
    localStorageService.deleteProject(projectId)

    if (supabaseService.isAvailable()) {
      try {
        await supabaseService.deleteProject(projectId)
      } catch (error) {
        console.error('Failed to delete from Supabase:', error)
      }
    }
  }

  // Session operations
  saveSession(key: string, data: any): void {
    localStorageService.saveSession(key, data)
  }

  getSession(key: string): any {
    return localStorageService.getSession(key)
  }

  clearSession(): void {
    localStorageService.clearSession()
  }
}

export const storageService = new UnifiedStorageService()
