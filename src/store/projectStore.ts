import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Project, StageData } from '@/types/project'

interface ProjectStore {
  currentProject: Project | null
  projects: Project[]
  isLoading: boolean
  error: string | null

  setCurrentProject: (project: Project | null) => void
  updateStageData: <K extends keyof StageData>(
    stage: K,
    data: Partial<StageData[K]>
  ) => void
  updateProjectMetadata: (metadata: Partial<Project['metadata']>) => void
  addProject: (project: Project) => void
  deleteProject: (projectId: string) => void
  setProjects: (projects: Project[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set) => ({
      currentProject: null,
      projects: [],
      isLoading: false,
      error: null,

      setCurrentProject: (project) =>
        set({
          currentProject: project,
          error: null,
        }),

      updateStageData: (stage, data) =>
        set((state) => {
          if (!state.currentProject) return state

          return {
            currentProject: {
              ...state.currentProject,
              stages: {
                ...state.currentProject.stages,
                [stage]: {
                  ...state.currentProject.stages[stage],
                  ...data,
                },
              },
              updatedAt: new Date(),
            },
          }
        }),

      updateProjectMetadata: (metadata) =>
        set((state) => {
          if (!state.currentProject) return state

          return {
            currentProject: {
              ...state.currentProject,
              metadata: {
                ...state.currentProject.metadata,
                ...metadata,
              },
              updatedAt: new Date(),
            },
          }
        }),

      addProject: (project) =>
        set((state) => ({
          projects: [...state.projects, project],
          currentProject: project,
        })),

      deleteProject: (projectId) =>
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== projectId),
          currentProject:
            state.currentProject?.id === projectId ? null : state.currentProject,
        })),

      setProjects: (projects) => set({ projects }),

      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),
    }),
    {
      name: 'project-storage',
    }
  )
)
