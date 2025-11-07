export interface Project {
  id: string
  userId: string
  name: string
  description: string
  createdAt: Date
  updatedAt: Date
  currentStage: number
  stages: StageData
  metadata: ProjectMetadata
}

export interface StageData {
  stage1?: Stage1Data
  stage2?: Stage2Data
  stage3?: Stage3Data
  stage4?: Stage4Data
  stage5?: Stage5Data
  stage6?: Stage6Data
}

export interface Stage1Data {
  concept: string
  targetUser: string
  problem: string
  marketAnalysis?: string
  businessObjectives?: string
}

export interface Stage2Data {
  feasibilityReport?: string
  pocCode?: string
  viabilityConfirmed: boolean
}

export interface Stage3Data {
  features: Feature[]
  uiRequirements: string
  stack: TechStack
  userStories: UserStory[]
}

export interface Feature {
  id: string
  name: string
  description: string
  priority: 'Must' | 'Should' | 'Could' | 'Won\'t'
}

export interface UserStory {
  id: string
  title: string
  description: string
  acceptanceCriteria: string[]
}

export interface TechStack {
  frontend: string
  backend?: string
  database?: string
  other?: string[]
}

export interface Stage4Data {
  claudeApiKey: string
  connectionStatus: 'connected' | 'disconnected' | 'testing'
  parameters: ClaudeParameters
}

export interface ClaudeParameters {
  complexity: 'low' | 'medium' | 'high'
  language: string
  model?: string
}

export interface Stage5Data {
  generatedCode: GeneratedFile[]
  testPlan?: string
  qaChecklist?: QAChecklistItem[]
  defectsResolved: boolean
}

export interface GeneratedFile {
  path: string
  content: string
  language: string
}

export interface QAChecklistItem {
  id: string
  description: string
  status: 'pending' | 'pass' | 'fail'
}

export interface Stage6Data {
  workflowId?: string
  workflowJSON?: string
  workflowStatus: 'inactive' | 'active'
  readme?: string
  downloadedAt?: Date
}

export interface ProjectMetadata {
  version: string
  tags: string[]
  collaborators?: string[]
}
