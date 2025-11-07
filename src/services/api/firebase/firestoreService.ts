import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  type DocumentData,
} from 'firebase/firestore'
import { db, isFirebaseAvailable } from '@config/firebase.config'
import type { Project } from '@/types/project'

class FirestoreService {
  private readonly COLLECTIONS = {
    USERS: 'users',
    PROJECTS: 'projects',
    SETTINGS: 'settings',
  }

  // Project operations
  async saveProject(userId: string, project: Project): Promise<void> {
    if (!isFirebaseAvailable() || !db) {
      console.warn('Firestore not available, using local storage')
      return
    }

    try {
      const projectRef = doc(db, this.COLLECTIONS.PROJECTS, project.id)
      await setDoc(projectRef, {
        ...project,
        userId,
        updatedAt: new Date(),
      })
    } catch (error) {
      console.error('Error saving project to Firestore:', error)
      throw error
    }
  }

  async getProject(projectId: string): Promise<Project | null> {
    if (!isFirebaseAvailable() || !db) {
      return null
    }

    try {
      const projectRef = doc(db, this.COLLECTIONS.PROJECTS, projectId)
      const projectSnap = await getDoc(projectRef)

      if (projectSnap.exists()) {
        return projectSnap.data() as Project
      }
      return null
    } catch (error) {
      console.error('Error fetching project from Firestore:', error)
      return null
    }
  }

  async getUserProjects(userId: string): Promise<Project[]> {
    if (!isFirebaseAvailable() || !db) {
      return []
    }

    try {
      const projectsRef = collection(db, this.COLLECTIONS.PROJECTS)
      const q = query(projectsRef, where('userId', '==', userId))
      const querySnapshot = await getDocs(q)

      const projects: Project[] = []
      querySnapshot.forEach((doc) => {
        projects.push(doc.data() as Project)
      })

      return projects
    } catch (error) {
      console.error('Error fetching user projects:', error)
      return []
    }
  }

  async updateProject(projectId: string, updates: Partial<Project>): Promise<void> {
    if (!isFirebaseAvailable() || !db) {
      return
    }

    try {
      const projectRef = doc(db, this.COLLECTIONS.PROJECTS, projectId)
      await updateDoc(projectRef, {
        ...updates,
        updatedAt: new Date(),
      })
    } catch (error) {
      console.error('Error updating project:', error)
      throw error
    }
  }

  async deleteProject(projectId: string): Promise<void> {
    if (!isFirebaseAvailable() || !db) {
      return
    }

    try {
      const projectRef = doc(db, this.COLLECTIONS.PROJECTS, projectId)
      await deleteDoc(projectRef)
    } catch (error) {
      console.error('Error deleting project:', error)
      throw error
    }
  }

  // User settings operations
  async saveUserSettings(userId: string, settings: DocumentData): Promise<void> {
    if (!isFirebaseAvailable() || !db) {
      return
    }

    try {
      const settingsRef = doc(db, this.COLLECTIONS.SETTINGS, userId)
      await setDoc(settingsRef, settings)
    } catch (error) {
      console.error('Error saving settings:', error)
      throw error
    }
  }

  async getUserSettings(userId: string): Promise<DocumentData | null> {
    if (!isFirebaseAvailable() || !db) {
      return null
    }

    try {
      const settingsRef = doc(db, this.COLLECTIONS.SETTINGS, userId)
      const settingsSnap = await getDoc(settingsRef)

      if (settingsSnap.exists()) {
        return settingsSnap.data()
      }
      return null
    } catch (error) {
      console.error('Error fetching settings:', error)
      return null
    }
  }

  isAvailable(): boolean {
    return isFirebaseAvailable()
  }
}

export const firestoreService = new FirestoreService()
