export interface N8nWorkflow {
  id?: string
  name: string
  active: boolean
  nodes: N8nNode[]
  connections: N8nConnections
  settings?: N8nWorkflowSettings
  createdAt?: Date
  updatedAt?: Date
}

export interface N8nNode {
  id: string
  name: string
  type: string
  typeVersion: number
  position: [number, number]
  parameters: Record<string, any>
}

export interface N8nConnections {
  [key: string]: {
    [key: string]: Array<{
      node: string
      type: string
      index: number
    }>
  }
}

export interface N8nWorkflowSettings {
  saveDataErrorExecution?: string
  saveDataSuccessExecution?: string
  saveManualExecutions?: boolean
  timezone?: string
}

export interface N8nApiResponse<T> {
  data: T
  success: boolean
  error?: string
}

export interface N8nConnectionStatus {
  connected: boolean
  baseUrl: string | null
  lastChecked: Date | null
  error: string | null
}

export interface N8nWorkflowExecution {
  id: string
  finished: boolean
  mode: string
  retryOf?: string
  retrySuccessId?: string
  startedAt: Date
  stoppedAt?: Date
  workflowId: string
}
