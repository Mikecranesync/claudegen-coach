export interface ClaudeRequest {
  prompt: string
  maxTokens?: number
  temperature?: number
  model?: string
}

export interface ClaudeResponse {
  content: string
  model: string
  stopReason: string
  usage: TokenUsage
}

export interface TokenUsage {
  inputTokens: number
  outputTokens: number
}

export interface ClaudeConnectionStatus {
  connected: boolean
  lastChecked: Date | null
  error: string | null
}

export interface ClaudePrompt {
  stage: number
  systemPrompt: string
  userPrompt: string
  context?: string
}

export interface ClaudeCommand {
  command: string
  args: string[]
  timestamp: Date
  response?: string
}

export type ClaudeModel = 'claude-3-opus-20240229' | 'claude-3-sonnet-20240229' | 'claude-3-haiku-20240307'
