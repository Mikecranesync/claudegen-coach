import axios, { type AxiosInstance } from 'axios'
import type {
  N8nWorkflow,
  N8nApiResponse,
  N8nConnectionStatus,
} from '@/types/n8n'

class N8nClient {
  private apiKey: string | null = null
  private baseURL: string | null = null
  private client: AxiosInstance | null = null

  configure(baseURL: string, apiKey: string): void {
    this.baseURL = baseURL
    this.apiKey = apiKey
    this.client = axios.create({
      baseURL: `${baseURL}/api/v1`,
      headers: {
        'X-N8N-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
    })
  }

  async testConnection(): Promise<N8nConnectionStatus> {
    if (!this.client || !this.baseURL || !this.apiKey) {
      return {
        connected: false,
        baseUrl: null,
        lastChecked: new Date(),
        error: 'n8n API not configured',
      }
    }

    try {
      // Test connection by fetching workflows
      await this.client.get('/workflows')

      return {
        connected: true,
        baseUrl: this.baseURL,
        lastChecked: new Date(),
        error: null,
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message

      return {
        connected: false,
        baseUrl: this.baseURL,
        lastChecked: new Date(),
        error: errorMessage,
      }
    }
  }

  async createWorkflow(workflow: N8nWorkflow): Promise<N8nApiResponse<N8nWorkflow>> {
    if (!this.client) {
      throw new Error('n8n client not configured')
    }

    try {
      const response = await this.client.post('/workflows', workflow)
      return {
        data: response.data,
        success: true,
      }
    } catch (error: any) {
      return {
        data: {} as N8nWorkflow,
        success: false,
        error: error.response?.data?.message || error.message,
      }
    }
  }

  async getWorkflow(workflowId: string): Promise<N8nApiResponse<N8nWorkflow>> {
    if (!this.client) {
      throw new Error('n8n client not configured')
    }

    try {
      const response = await this.client.get(`/workflows/${workflowId}`)
      return {
        data: response.data,
        success: true,
      }
    } catch (error: any) {
      return {
        data: {} as N8nWorkflow,
        success: false,
        error: error.response?.data?.message || error.message,
      }
    }
  }

  async updateWorkflow(
    workflowId: string,
    workflow: Partial<N8nWorkflow>
  ): Promise<N8nApiResponse<N8nWorkflow>> {
    if (!this.client) {
      throw new Error('n8n client not configured')
    }

    try {
      const response = await this.client.put(`/workflows/${workflowId}`, workflow)
      return {
        data: response.data,
        success: true,
      }
    } catch (error: any) {
      return {
        data: {} as N8nWorkflow,
        success: false,
        error: error.response?.data?.message || error.message,
      }
    }
  }

  async deleteWorkflow(workflowId: string): Promise<N8nApiResponse<void>> {
    if (!this.client) {
      throw new Error('n8n client not configured')
    }

    try {
      await this.client.delete(`/workflows/${workflowId}`)
      return {
        data: undefined as void,
        success: true,
      }
    } catch (error: any) {
      return {
        data: undefined as void,
        success: false,
        error: error.response?.data?.message || error.message,
      }
    }
  }

  async activateWorkflow(workflowId: string): Promise<N8nApiResponse<N8nWorkflow>> {
    return this.updateWorkflow(workflowId, { active: true })
  }

  async deactivateWorkflow(workflowId: string): Promise<N8nApiResponse<N8nWorkflow>> {
    return this.updateWorkflow(workflowId, { active: false })
  }

  async getWorkflows(): Promise<N8nApiResponse<N8nWorkflow[]>> {
    if (!this.client) {
      throw new Error('n8n client not configured')
    }

    try {
      const response = await this.client.get('/workflows')
      return {
        data: response.data.data || [],
        success: true,
      }
    } catch (error: any) {
      return {
        data: [],
        success: false,
        error: error.response?.data?.message || error.message,
      }
    }
  }

  isConfigured(): boolean {
    return this.client !== null && this.apiKey !== null && this.baseURL !== null
  }
}

export const n8nClient = new N8nClient()
