export interface Stage {
  id: number
  name: string
  title: string
  description: string
  route: string
  completed: boolean
  locked: boolean
}

export interface StageProgress {
  currentStage: number
  completedStages: number[]
  totalStages: number
}

export interface ValidationGate {
  stageId: number
  requirements: ValidationRequirement[]
  passed: boolean
}

export interface ValidationRequirement {
  id: string
  description: string
  validator: () => boolean | Promise<boolean>
  met: boolean
}

export const STAGES: Stage[] = [
  {
    id: 1,
    name: 'Idea Management',
    title: 'Idea Management & Validation',
    description: 'Define your concept, target user, and problem. Get market analysis and competitive insights.',
    route: '/stage1',
    completed: false,
    locked: false,
  },
  {
    id: 2,
    name: 'Concept Validation',
    title: 'Concept Validation (PoC)',
    description: 'Test feasibility with proof-of-concept code and documentation.',
    route: '/stage2',
    completed: false,
    locked: true,
  },
  {
    id: 3,
    name: 'Specification',
    title: 'Feature Specification',
    description: 'Define features, UI requirements, and technical stack using MoSCoW method.',
    route: '/stage3',
    completed: false,
    locked: true,
  },
  {
    id: 4,
    name: 'CLI Configuration',
    title: 'Claude CLI Configuration',
    description: 'Connect and configure Claude CLI with your API key and parameters.',
    route: '/stage4',
    completed: false,
    locked: true,
  },
  {
    id: 5,
    name: 'Code Generation',
    title: 'Code Generation, Review & QA',
    description: 'Generate functional code, review in editor, and validate with test plans.',
    route: '/stage5',
    completed: false,
    locked: true,
  },
  {
    id: 6,
    name: 'Automation',
    title: 'Automation & Launch Prep',
    description: 'Generate n8n workflows, README, and download your complete project package.',
    route: '/stage6',
    completed: false,
    locked: true,
  },
]
