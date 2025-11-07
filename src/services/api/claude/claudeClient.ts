import axios, { type AxiosInstance } from 'axios'
import type { ClaudeRequest, ClaudeResponse, ClaudeConnectionStatus } from '@/types/claude'
import { claudeLogger } from '@utils/logger'
import { DEFAULT_CLAUDE_MODEL } from '@utils/constants'

class ClaudeClient {
  private apiKey: string | null = null
  private baseURL = 'https://api.anthropic.com/v1'
  private client: AxiosInstance | null = null

  setApiKey(apiKey: string): void {
    this.apiKey = apiKey
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
    })
  }

  async testConnection(): Promise<ClaudeConnectionStatus> {
    if (!this.client || !this.apiKey) {
      return {
        connected: false,
        lastChecked: new Date(),
        error: 'API key not configured',
      }
    }

    try {
      // Simple test request
      await this.client.post('/messages', {
        model: DEFAULT_CLAUDE_MODEL,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hello' }],
      })

      claudeLogger.log('test-connection', [], 'Success')

      return {
        connected: true,
        lastChecked: new Date(),
        error: null,
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || error.message

      claudeLogger.log('test-connection', [], `Error: ${errorMessage}`)

      return {
        connected: false,
        lastChecked: new Date(),
        error: errorMessage,
      }
    }
  }

  async sendRequest(request: ClaudeRequest): Promise<ClaudeResponse> {
    if (!this.client || !this.apiKey) {
      throw new Error('Claude API client not initialized. Please set API key first.')
    }

    try {
      const response = await this.client.post('/messages', {
        model: request.model || DEFAULT_CLAUDE_MODEL,
        max_tokens: request.maxTokens || 4096,
        temperature: request.temperature || 1.0,
        messages: [{ role: 'user', content: request.prompt }],
      })

      const claudeResponse: ClaudeResponse = {
        content: response.data.content[0].text,
        model: response.data.model,
        stopReason: response.data.stop_reason,
        usage: {
          inputTokens: response.data.usage.input_tokens,
          outputTokens: response.data.usage.output_tokens,
        },
      }

      claudeLogger.log(
        'send-request',
        [request.model || DEFAULT_CLAUDE_MODEL],
        `Tokens: ${claudeResponse.usage.inputTokens}/${claudeResponse.usage.outputTokens}`
      )

      return claudeResponse
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || error.message
      claudeLogger.log('send-request', [], `Error: ${errorMessage}`)
      throw new Error(`Claude API error: ${errorMessage}`)
    }
  }

  async generateCode(prompt: string, maxTokens = 8000): Promise<string> {
    const response = await this.sendRequest({
      prompt,
      maxTokens,
      temperature: 0.7,
    })

    return response.content
  }

  isConfigured(): boolean {
    return this.apiKey !== null && this.client !== null
  }
}

export const claudeClient = new ClaudeClient()
