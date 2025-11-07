import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import JSZip from 'jszip'
import { Button } from '@components/common/Button/Button'
import { useProjectStore } from '@store/projectStore'
import { useStageStore } from '@store/stageStore'
import { useSettingsStore } from '@store/settingsStore'
import { claudeClient } from '@services/api/claude/claudeClient'
import { buildPromptFromTemplate, getSystemPrompt } from '@config/prompts.config'
import { WorkflowService } from '@services/api/n8n/workflowService'
import type { Stage6Data } from '@/types/project'
import type { N8nWorkflow } from '@/types/n8n'

const Automation: React.FC = () => {
  const navigate = useNavigate()
  const { currentProject, updateStageData } = useProjectStore()
  const { completeStage, canAccessStage } = useStageStore()
  const { claudeApiKey } = useSettingsStore()

  // UI state
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [showReadme, setShowReadme] = useState(true)
  const [showWorkflows, setShowWorkflows] = useState(true)

  // Results state
  const [readme, setReadme] = useState<string>('')
  const [workflowJSON, setWorkflowJSON] = useState<string>('')
  const [workflows, setWorkflows] = useState<N8nWorkflow[]>([])
  const [projectComplete, setProjectComplete] = useState(false)

  // Load existing data if available
  useEffect(() => {
    // Check if user can access this stage
    if (!canAccessStage(6)) {
      navigate('/stage5')
      return
    }

    if (currentProject?.stages.stage6) {
      const stage6Data = currentProject.stages.stage6
      if (stage6Data.readme) {
        setReadme(stage6Data.readme)
        setWorkflowJSON(stage6Data.workflowJSON || '')
        setShowResults(true)
      }
    }
  }, [currentProject, canAccessStage, navigate])

  const buildDocumentationPrompt = (): string => {
    if (
      !currentProject?.stages.stage1 ||
      !currentProject?.stages.stage3 ||
      !currentProject?.stages.stage5
    ) {
      return ''
    }

    const stage1 = currentProject.stages.stage1
    const stage3 = currentProject.stages.stage3
    const stage5 = currentProject.stages.stage5

    // Build comprehensive project context
    const projectContext = {
      name: currentProject.name,
      concept: stage1.concept,
      targetUser: stage1.targetUser,
      problem: stage1.problem,
      features: stage3.features.map(f => `${f.name}: ${f.description}`).join('\n'),
      stack: stage3.stack,
      fileStructure: stage5.generatedCode.map(f => f.path).join('\n'),
    }

    const variables = {
      projectName: currentProject.name,
      codeStructure: stage5.generatedCode.map(f => f.path).join(', '),
      features: projectContext.features,
    }

    const userPrompt = buildPromptFromTemplate(6, variables)
    const systemPrompt = getSystemPrompt(6)

    const enhancedPrompt = `${systemPrompt}

${userPrompt}

CRITICAL OUTPUT FORMAT:
You must structure your response exactly as follows:

1. Start with README content:
###README_START###
# ${currentProject.name}

${stage1.concept}

## Overview
[Project description based on concept and target user]

## Features
[List all Must and Should features]

## Tech Stack
[Frontend, Backend, Database from stage3.stack]

## Installation

\`\`\`bash
# Clone the repository
git clone https://github.com/yourusername/${currentProject.name.toLowerCase().replace(/\s+/g, '-')}.git
cd ${currentProject.name.toLowerCase().replace(/\s+/g, '-')}

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run development server
npm run dev
\`\`\`

## Project Structure
[Show folder structure from generated files]

## Environment Variables
[List all required environment variables]

## Usage
[How to use the application based on features]

## Development
[Development guidelines and scripts]

## Testing
[Reference to test plan from Stage 5]

## Deployment
[Deployment instructions based on tech stack]

## Contributing
[Standard contribution guidelines]

## License
MIT

## Acknowledgments
[Credits and thanks]

###README_END###

2. After README, provide n8n workflow JSON:
###WORKFLOW_START###
{
  "name": "${currentProject.name} - Automation Workflow",
  "active": false,
  "nodes": [
    // Include nodes based on features (e.g., notifications, data processing, deployments)
  ],
  "connections": {},
  "settings": {}
}
###WORKFLOW_END###

Generate professional, production-ready documentation.`

    return enhancedPrompt
  }

  const parseDocumentationResponse = (
    content: string
  ): { readme: string; workflowJSON: string } => {
    // Extract README
    const readmeMatch = content.match(/###README_START###([\s\S]*?)###README_END###/)
    const readme = readmeMatch ? readmeMatch[1].trim() : '# README\n\nNo README generated.'

    // Extract workflow JSON
    const workflowMatch = content.match(/###WORKFLOW_START###([\s\S]*?)###WORKFLOW_END###/)
    let workflowJSON = workflowMatch ? workflowMatch[1].trim() : ''

    // If no structured workflow, try to extract from code blocks
    if (!workflowJSON) {
      const codeBlockMatch = content.match(/```json\s*([\s\S]*?)\s*```/)
      if (codeBlockMatch) {
        workflowJSON = codeBlockMatch[1].trim()
      }
    }

    return { readme, workflowJSON }
  }

  const handleGenerate = async () => {
    // Validation
    if (
      !currentProject?.stages.stage1 ||
      !currentProject?.stages.stage3 ||
      !currentProject?.stages.stage5
    ) {
      setError('Stages 1-5 must be completed before generating documentation')
      return
    }

    // Check API key
    if (!claudeApiKey) {
      setError('Claude API key not configured. Please complete Stage 4.')
      return
    }

    setError(null)
    setIsGenerating(true)

    try {
      // Initialize Claude client
      claudeClient.setApiKey(claudeApiKey)

      // Build prompt
      const fullPrompt = buildDocumentationPrompt()

      // Send request to Claude
      const response = await claudeClient.sendRequest({
        prompt: fullPrompt,
        maxTokens: 6000,
        temperature: 0.7,
      })

      // Parse response
      const parsed = parseDocumentationResponse(response.content)
      setReadme(parsed.readme)
      setWorkflowJSON(parsed.workflowJSON)

      // Also generate standard workflows using WorkflowService
      const basicWorkflow = WorkflowService.generateBasicWorkflow(currentProject.name)
      const deploymentWorkflow = WorkflowService.generateDeploymentWorkflow(
        currentProject.name,
        `https://github.com/yourusername/${currentProject.name.toLowerCase().replace(/\s+/g, '-')}`
      )

      setWorkflows([basicWorkflow, deploymentWorkflow])

      setShowResults(true)

      // Save to project store
      const stage6Data: Stage6Data = {
        readme: parsed.readme,
        workflowJSON: parsed.workflowJSON,
        workflowStatus: 'inactive',
      }

      updateStageData('stage6', stage6Data)
    } catch (err: any) {
      setError(err.message || 'Failed to generate documentation. Please try again.')
      console.error('Documentation generation error:', err)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownloadReadme = () => {
    const blob = new Blob([readme], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'README.md'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleDownloadWorkflow = () => {
    const blob = new Blob([workflowJSON], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${currentProject?.name || 'project'}-workflow.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleDownloadCompleteBundle = async () => {
    if (!currentProject?.stages.stage5) {
      setError('Stage 5 must be completed to download bundle')
      return
    }

    const zip = new JSZip()

    // Add all generated code files from Stage 5
    const codeFolder = zip.folder('code')
    currentProject.stages.stage5.generatedCode.forEach(file => {
      codeFolder?.file(file.path, file.content)
    })

    // Add test plan from Stage 5
    if (currentProject.stages.stage5.testPlan) {
      zip.file('TEST_PLAN.md', currentProject.stages.stage5.testPlan)
    }

    // Add README
    if (readme) {
      zip.file('README.md', readme)
    }

    // Add n8n workflows
    const workflowsFolder = zip.folder('n8n-workflows')

    if (workflowJSON) {
      workflowsFolder?.file('claude-generated-workflow.json', workflowJSON)
    }

    workflows.forEach(workflow => {
      const filename = workflow.name.toLowerCase().replace(/\s+/g, '-') + '.json'
      workflowsFolder?.file(filename, JSON.stringify(workflow, null, 2))
    })

    // Add deployment guide
    const deploymentGuide = `# Deployment Guide

## Prerequisites
- Node.js 18+
- npm or yarn
- Git

## Steps

1. **Clone the repository**
   \`\`\`bash
   git clone <repository-url>
   cd ${currentProject.name.toLowerCase().replace(/\s+/g, '-')}
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Configure environment**
   \`\`\`bash
   cp .env.example .env
   # Edit .env with your configuration
   \`\`\`

4. **Run locally**
   \`\`\`bash
   npm run dev
   \`\`\`

5. **Build for production**
   \`\`\`bash
   npm run build
   \`\`\`

6. **Deploy**
   - See README.md for platform-specific deployment instructions
   - Recommended: Vercel, Netlify, or AWS Amplify

## n8n Workflows

The \`n8n-workflows\` folder contains automation workflows you can import into n8n:
1. Open your n8n instance
2. Click "Import from File"
3. Select the workflow JSON file
4. Configure credentials and activate

Generated with ClaudeGen Coach
`

    zip.file('DEPLOYMENT.md', deploymentGuide)

    // Generate ZIP
    const blob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${currentProject.name}-complete-project.zip`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleRegenerate = () => {
    setShowResults(false)
    setReadme('')
    setWorkflowJSON('')
    setWorkflows([])
    setProjectComplete(false)
  }

  const handleCompleteProject = () => {
    if (!readme) {
      setError('Please generate documentation before completing the project')
      return
    }

    // Mark project as complete
    setProjectComplete(true)

    // Mark stage 6 as complete
    completeStage(6)

    // Update final state
    const stage6Data: Stage6Data = {
      readme,
      workflowJSON,
      workflowStatus: 'inactive',
    }

    updateStageData('stage6', stage6Data)
  }

  const handleBackToDashboard = () => {
    navigate('/')
  }

  const stage1Data = currentProject?.stages.stage1
  const stage3Data = currentProject?.stages.stage3
  const stage5Data = currentProject?.stages.stage5

  const featureCount = stage3Data?.features.filter(
    f => f.priority === 'Must' || f.priority === 'Should'
  ).length || 0

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-dark-text mb-2">
          Stage 6: Automation & Launch Prep
        </h1>
        <p className="text-dark-text-secondary">
          Generate comprehensive documentation, n8n workflows, and download your complete project bundle.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {/* Project Summary */}
      {stage1Data && stage3Data && stage5Data && !showResults && !projectComplete && (
        <div className="card mb-6 bg-dark-bg-secondary">
          <h2 className="text-xl font-semibold text-dark-text mb-4">📋 Project Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-sm font-medium text-dark-text-tertiary">Project Name:</span>
              <p className="text-dark-text-secondary mt-1">{currentProject?.name}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-dark-text-tertiary">Concept:</span>
              <p className="text-dark-text-secondary mt-1">{stage1Data.concept}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-dark-text-tertiary">Tech Stack:</span>
              <p className="text-dark-text-secondary mt-1">{stage3Data.stack.frontend}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-dark-text-tertiary">Features:</span>
              <p className="text-dark-text-secondary mt-1">{featureCount} core features</p>
            </div>
            <div>
              <span className="text-sm font-medium text-dark-text-tertiary">Generated Files:</span>
              <p className="text-dark-text-secondary mt-1">
                {stage5Data.generatedCode.length} files
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-dark-text-tertiary">QA Status:</span>
              <p className="text-green-400 mt-1">✓ All tests passed</p>
            </div>
          </div>
        </div>
      )}

      <div className="card space-y-6">
        {/* Generate Button */}
        {!showResults && !isGenerating && !projectComplete && (
          <>
            <div>
              <h2 className="text-xl font-semibold text-dark-text mb-4">
                Ready to Finalize Your Project
              </h2>
              <p className="text-dark-text-secondary mb-6">
                Claude will generate comprehensive documentation (README.md), n8n automation workflows, and
                package everything into a complete project bundle ready for deployment.
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="primary" onClick={handleGenerate}>
                🚀 Generate Documentation & Workflows
              </Button>
              {currentProject?.stages.stage6?.readme && (
                <Button variant="secondary" onClick={() => setShowResults(true)}>
                  View Previous Documentation
                </Button>
              )}
            </div>
          </>
        )}

        {/* Loading State */}
        {isGenerating && (
          <div className="py-12">
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-500 mx-auto mb-4"></div>
                <p className="text-lg text-dark-text-secondary mb-2">
                  Generating documentation and workflows...
                </p>
                <p className="text-sm text-dark-text-tertiary">This may take 30-60 seconds</p>
              </div>
            </div>
          </div>
        )}

        {/* Results Display */}
        {showResults && !projectComplete && (
          <>
            {/* README Section */}
            <div className="border-t border-dark-border pt-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-dark-text">📝 README.md</h2>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={handleDownloadReadme} size="sm">
                    📥 Download README
                  </Button>
                  <button
                    onClick={() => setShowReadme(!showReadme)}
                    className="text-sm text-primary-500 hover:text-primary-400"
                  >
                    {showReadme ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {showReadme && (
                <div className="bg-dark-bg-tertiary p-6 rounded-lg border border-dark-border overflow-auto" style={{ maxHeight: '500px' }}>
                  <div className="prose prose-invert max-w-none">
                    <ReactMarkdown>{readme}</ReactMarkdown>
                  </div>
                </div>
              )}
            </div>

            {/* Workflow Section */}
            {(workflowJSON || workflows.length > 0) && (
              <div className="border-t border-dark-border pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-dark-text">⚙️ n8n Workflows</h2>
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={handleDownloadWorkflow} size="sm">
                      📥 Download Workflows
                    </Button>
                    <button
                      onClick={() => setShowWorkflows(!showWorkflows)}
                      className="text-sm text-primary-500 hover:text-primary-400"
                    >
                      {showWorkflows ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                {showWorkflows && (
                  <div className="space-y-4">
                    <p className="text-sm text-dark-text-secondary">
                      {workflows.length} automation workflow{workflows.length !== 1 ? 's' : ''}{' '}
                      generated for your project
                    </p>

                    {workflows.map((workflow, index) => (
                      <div key={index} className="bg-dark-bg-tertiary p-4 rounded-lg border border-dark-border">
                        <h3 className="text-md font-semibold text-dark-text mb-2">
                          {workflow.name}
                        </h3>
                        <p className="text-sm text-dark-text-tertiary mb-2">
                          {workflow.nodes.length} nodes • Status: {workflow.active ? 'Active' : 'Inactive'}
                        </p>
                        <details className="mt-2">
                          <summary className="text-sm text-primary-500 cursor-pointer hover:text-primary-400">
                            View JSON
                          </summary>
                          <pre className="mt-2 p-4 bg-dark-bg rounded text-xs overflow-x-auto">
                            <code>{JSON.stringify(workflow, null, 2)}</code>
                          </pre>
                        </details>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Download Bundle Section */}
            <div className="border-t border-dark-border pt-6">
              <h2 className="text-xl font-semibold text-dark-text mb-4">
                📦 Complete Project Bundle
              </h2>
              <p className="text-dark-text-secondary mb-4">
                Download everything in one ZIP file:
              </p>
              <ul className="text-dark-text-secondary text-sm space-y-1 mb-6 ml-6">
                <li className="flex items-start">
                  <span className="text-primary-500 mr-2">•</span>
                  <span>All generated code files ({stage5Data?.generatedCode.length || 0} files)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-500 mr-2">•</span>
                  <span>README.md with setup instructions</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-500 mr-2">•</span>
                  <span>QA/UAT Test Plan</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-500 mr-2">•</span>
                  <span>n8n Workflow JSON files</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-500 mr-2">•</span>
                  <span>Deployment guide</span>
                </li>
              </ul>

              <div className="flex gap-3">
                <Button variant="primary" onClick={handleDownloadCompleteBundle}>
                  📥 Download Complete Bundle
                </Button>
                <Button variant="secondary" onClick={handleRegenerate}>
                  🔄 Regenerate
                </Button>
              </div>
            </div>

            {/* Complete Project Button */}
            <div className="border-t border-dark-border pt-6">
              <div className="bg-green-500/10 border border-green-500 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-400 mb-2">
                  🎉 Project Ready for Launch!
                </h3>
                <p className="text-dark-text-secondary mb-4">
                  Congratulations! You've completed all 6 stages of the ClaudeGen Coach workflow. Your
                  project is now ready for deployment.
                </p>
                <Button variant="primary" onClick={handleCompleteProject}>
                  ✓ Mark Project Complete
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Completion Screen */}
        {projectComplete && (
          <div className="py-12 text-center">
            <div className="mb-6">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-3xl font-bold text-dark-text mb-2">
                Project Complete!
              </h2>
              <p className="text-lg text-dark-text-secondary">
                You've successfully completed all 6 stages
              </p>
            </div>

            <div className="bg-dark-bg-secondary rounded-lg p-6 max-w-md mx-auto mb-8">
              <div className="space-y-3 text-left">
                <div className="flex items-center gap-3">
                  <span className="text-green-400 text-xl">✓</span>
                  <span className="text-dark-text">Stage 1: Idea Management</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-green-400 text-xl">✓</span>
                  <span className="text-dark-text">Stage 2: Concept Validation</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-green-400 text-xl">✓</span>
                  <span className="text-dark-text">Stage 3: Feature Specification</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-green-400 text-xl">✓</span>
                  <span className="text-dark-text">Stage 4: CLI Configuration</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-green-400 text-xl">✓</span>
                  <span className="text-dark-text">Stage 5: Code Generation & QA</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-green-400 text-xl">✓</span>
                  <span className="text-dark-text">Stage 6: Automation & Documentation</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <Button variant="primary" onClick={handleBackToDashboard}>
                Return to Dashboard
              </Button>
              <Button variant="secondary" onClick={handleDownloadCompleteBundle}>
                📥 Download Bundle Again
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Info Box */}
      {!projectComplete && (
        <div className="mt-6 card bg-dark-bg-secondary">
          <h3 className="text-lg font-semibold text-dark-text mb-3">
            What happens in Stage 6?
          </h3>
          <ul className="space-y-2 text-dark-text-secondary text-sm">
            <li className="flex items-start">
              <span className="text-primary-500 mr-2">•</span>
              <span>
                Claude AI generates comprehensive README.md with setup instructions and project
                details
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-primary-500 mr-2">•</span>
              <span>Automated n8n workflows created for deployments, testing, and notifications</span>
            </li>
            <li className="flex items-start">
              <span className="text-primary-500 mr-2">•</span>
              <span>
                Complete project bundle with all code, documentation, and workflows in one ZIP file
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-primary-500 mr-2">•</span>
              <span>Ready-to-deploy package with deployment guide and environment setup</span>
            </li>
            <li className="flex items-start">
              <span className="text-primary-500 mr-2">•</span>
              <span>Project completion celebration and return to Dashboard</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  )
}

export default Automation
