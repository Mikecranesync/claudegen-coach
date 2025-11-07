import type { N8nWorkflow } from '@/types/n8n'
import { generateId } from '@utils/formatting'

export class WorkflowService {
  // Generate a basic webhook-triggered workflow
  static generateBasicWorkflow(projectName: string): N8nWorkflow {
    return {
      name: `${projectName} - Basic Workflow`,
      active: false,
      nodes: [
        {
          id: generateId(),
          name: 'Webhook',
          type: 'n8n-nodes-base.webhook',
          typeVersion: 1,
          position: [250, 300],
          parameters: {
            path: `${projectName.toLowerCase().replace(/\s+/g, '-')}/webhook`,
            responseMode: 'responseNode',
            httpMethod: 'POST',
          },
        },
        {
          id: generateId(),
          name: 'Respond to Webhook',
          type: 'n8n-nodes-base.respondToWebhook',
          typeVersion: 1,
          position: [650, 300],
          parameters: {
            respondWith: 'json',
            responseBody: '={{ { "success": true, "message": "Workflow executed successfully" } }}',
          },
        },
      ],
      connections: {
        Webhook: {
          main: [
            {
              node: 'Respond to Webhook',
              type: 'main',
              index: 0,
            },
          ],
        },
      },
      settings: {
        saveDataErrorExecution: 'all',
        saveDataSuccessExecution: 'all',
        saveManualExecutions: true,
        timezone: 'America/New_York',
      },
    }
  }

  // Generate a workflow for automated deployments
  static generateDeploymentWorkflow(projectName: string, repoUrl?: string): N8nWorkflow {
    return {
      name: `${projectName} - Deployment Workflow`,
      active: false,
      nodes: [
        {
          id: generateId(),
          name: 'GitHub Trigger',
          type: 'n8n-nodes-base.githubTrigger',
          typeVersion: 1,
          position: [250, 300],
          parameters: {
            repository: repoUrl || '',
            events: ['push'],
          },
        },
        {
          id: generateId(),
          name: 'Build Project',
          type: 'n8n-nodes-base.executeCommand',
          typeVersion: 1,
          position: [450, 300],
          parameters: {
            command: 'npm run build',
          },
        },
        {
          id: generateId(),
          name: 'Deploy',
          type: 'n8n-nodes-base.httpRequest',
          typeVersion: 1,
          position: [650, 300],
          parameters: {
            method: 'POST',
            url: 'https://your-deployment-service.com/deploy',
          },
        },
      ],
      connections: {
        'GitHub Trigger': {
          main: [
            {
              node: 'Build Project',
              type: 'main',
              index: 0,
            },
          ],
        },
        'Build Project': {
          main: [
            {
              node: 'Deploy',
              type: 'main',
              index: 0,
            },
          ],
        },
      },
    }
  }

  // Generate workflow JSON from Claude CLI output
  static parseWorkflowFromClaudeResponse(response: string): N8nWorkflow | null {
    try {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/)
      const jsonString = jsonMatch ? jsonMatch[1] : response

      const workflow = JSON.parse(jsonString)
      return workflow as N8nWorkflow
    } catch (error) {
      console.error('Failed to parse workflow from Claude response:', error)
      return null
    }
  }
}
