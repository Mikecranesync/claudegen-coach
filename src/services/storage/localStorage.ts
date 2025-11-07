import type { Project } from '@/types/project'
import { STORAGE_KEYS } from '@utils/constants'

class LocalStorageService {
  // Project operations
  saveProject(project: Project): void {
    const projects = this.getAllProjects()
    const existingIndex = projects.findIndex((p) => p.id === project.id)

    if (existingIndex >= 0) {
      projects[existingIndex] = project
    } else {
      projects.push(project)
    }

    localStorage.setItem(STORAGE_KEYS.PROJECT, JSON.stringify(projects))
  }

  getProject(projectId: string): Project | null {
    const projects = this.getAllProjects()
    return projects.find((p) => p.id === projectId) || null
  }

  getAllProjects(): Project[] {
    const data = localStorage.getItem(STORAGE_KEYS.PROJECT)
    if (!data) return []

    try {
      const parsed = JSON.parse(data)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  deleteProject(projectId: string): void {
    const projects = this.getAllProjects().filter((p) => p.id !== projectId)
    localStorage.setItem(STORAGE_KEYS.PROJECT, JSON.stringify(projects))
  }

  // Session data
  saveSession(key: string, data: any): void {
    const sessionData = this.getSessionData()
    sessionData[key] = data
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(sessionData))
  }

  getSession(key: string): any {
    const sessionData = this.getSessionData()
    return sessionData[key]
  }

  clearSession(): void {
    localStorage.removeItem(STORAGE_KEYS.SESSION)
  }

  private getSessionData(): Record<string, any> {
    const data = localStorage.getItem(STORAGE_KEYS.SESSION)
    if (!data) return {}

    try {
      return JSON.parse(data)
    } catch {
      return {}
    }
  }

  // Clear all data
  clearAll(): void {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key)
    })
  }
}

export const localStorageService = new LocalStorageService()
