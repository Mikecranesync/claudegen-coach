import { create } from 'zustand'
import type { Stage, StageProgress } from '@/types/stage'
import { STAGES } from '@/types/stage'

interface StageStore {
  stages: Stage[]
  currentStage: number
  progress: StageProgress

  setCurrentStage: (stageId: number) => void
  completeStage: (stageId: number) => void
  unlockStage: (stageId: number) => void
  resetProgress: () => void
  canAccessStage: (stageId: number) => boolean
}

const initialProgress: StageProgress = {
  currentStage: 1,
  completedStages: [],
  totalStages: STAGES.length,
}

export const useStageStore = create<StageStore>((set, get) => ({
  stages: STAGES,
  currentStage: 1,
  progress: initialProgress,

  setCurrentStage: (stageId) => {
    const canAccess = get().canAccessStage(stageId)
    if (canAccess) {
      set((state) => ({
        currentStage: stageId,
        progress: {
          ...state.progress,
          currentStage: stageId,
        },
      }))
    }
  },

  completeStage: (stageId) =>
    set((state) => {
      const completedStages = [...state.progress.completedStages]
      if (!completedStages.includes(stageId)) {
        completedStages.push(stageId)
      }

      const updatedStages = state.stages.map((stage) =>
        stage.id === stageId ? { ...stage, completed: true } : stage
      )

      // Unlock next stage
      const nextStage = updatedStages.find((s) => s.id === stageId + 1)
      if (nextStage) {
        updatedStages[nextStage.id - 1] = { ...nextStage, locked: false }
      }

      return {
        stages: updatedStages,
        progress: {
          ...state.progress,
          completedStages,
        },
      }
    }),

  unlockStage: (stageId) =>
    set((state) => ({
      stages: state.stages.map((stage) =>
        stage.id === stageId ? { ...stage, locked: false } : stage
      ),
    })),

  resetProgress: () =>
    set({
      stages: STAGES,
      currentStage: 1,
      progress: initialProgress,
    }),

  canAccessStage: (stageId) => {
    const state = get()
    const stage = state.stages.find((s) => s.id === stageId)
    return stage ? !stage.locked : false
  },
}))
