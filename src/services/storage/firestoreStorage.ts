import type { Project } from '@/types/project'
import { firestoreService } from '../api/firebase/firestoreService'
import { localStorageService } from './localStorage'

class UnifiedStorageService {
  private userId: string | null = null

  setUserId(userId: string): void {
    this.userId = userId
  }

  async saveProject(project: Project): Promise<void> {
    // Always save to local storage as fallback
    localStorageService.saveProject(project)

    // Also save to Firestore if available
    if (this.userId && firestoreService.isAvailable()) {
      try {
        await firestoreService.saveProject(this.userId, project)
      } catch (error) {
        console.error('Failed to sync to Firestore:', error)
      }
    }
  }

  async getProject(projectId: string): Promise<Project | null> {
    // Try Firestore first
    if (firestoreService.isAvailable()) {
      try {
        const project = await firestoreService.getProject(projectId)
        if (project) return project
      } catch (error) {
        console.error('Failed to fetch from Firestore:', error)
      }
    }

    // Fallback to local storage
    return localStorageService.getProject(projectId)
  }

  async getAllProjects(): Promise<Project[]> {
    // Try Firestore first
    if (this.userId && firestoreService.isAvailable()) {
      try {
        const projects = await firestoreService.getUserProjects(this.userId)
        if (projects.length > 0) return projects
      } catch (error) {
        console.error('Failed to fetch from Firestore:', error)
      }
    }

    // Fallback to local storage
    return localStorageService.getAllProjects()
  }

  async deleteProject(projectId: string): Promise<void> {
    localStorageService.deleteProject(projectId)

    if (firestoreService.isAvailable()) {
      try {
        await firestoreService.deleteProject(projectId)
      } catch (error) {
        console.error('Failed to delete from Firestore:', error)
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
