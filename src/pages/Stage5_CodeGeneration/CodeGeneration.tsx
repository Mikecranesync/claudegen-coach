import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Editor from '@monaco-editor/react'
import ReactMarkdown from 'react-markdown'
import JSZip from 'jszip'
import { Button } from '@components/common/Button/Button'
import { useProjectStore } from '@store/projectStore'
import { useStageStore } from '@store/stageStore'
import { useSettingsStore } from '@store/settingsStore'
import { claudeClient } from '@services/api/claude/claudeClient'
import { buildPromptFromTemplate, getSystemPrompt } from '@config/prompts.config'
import type { Stage5Data, GeneratedFile, QAChecklistItem } from '@/types/project'

const CodeGeneration: React.FC = () => {
  const navigate = useNavigate()
  const { currentProject, updateStageData } = useProjectStore()
  const { completeStage, canAccessStage } = useStageStore()
  const { claudeApiKey } = useSettingsStore()

  // UI state
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [selectedFile, setSelectedFile] = useState<GeneratedFile | null>(null)
  const [showTestPlan, setShowTestPlan] = useState(true)
  const [showQAChecklist, setShowQAChecklist] = useState(true)

  // Results state
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>([])
  const [testPlan, setTestPlan] = useState<string>('')
  const [qaChecklist, setQaChecklist] = useState<QAChecklistItem[]>([])
  const [defectsResolved, setDefectsResolved] = useState(false)

  // Load existing data if available
  useEffect(() => {
    // Check if user can access this stage
    if (!canAccessStage(5)) {
      navigate('/stage4')
      return
    }

    if (currentProject?.stages.stage5) {
      const stage5Data = currentProject.stages.stage5
      if (stage5Data.generatedCode && stage5Data.generatedCode.length > 0) {
        setGeneratedFiles(stage5Data.generatedCode)
        setSelectedFile(stage5Data.generatedCode[0])
        setTestPlan(stage5Data.testPlan || '')
        setQaChecklist(stage5Data.qaChecklist || [])
        setDefectsResolved(stage5Data.defectsResolved)
        setShowResults(true)
      }
    }
  }, [currentProject, canAccessStage, navigate])

  const getFileIcon = (path: string): string => {
    if (path.endsWith('.tsx') || path.endsWith('.jsx')) return '⚛️'
    if (path.endsWith('.ts') || path.endsWith('.js')) return '📜'
    if (path.endsWith('.css') || path.endsWith('.scss')) return '🎨'
    if (path.endsWith('.json')) return '📋'
    if (path.endsWith('.md')) return '📝'
    if (path.includes('package')) return '📦'
    if (path.endsWith('.html')) return '🌐'
    return '📄'
  }

  const getLanguageFromFile = (file: GeneratedFile | null): string => {
    if (!file) return 'plaintext'

    const extensionMap: Record<string, string> = {
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.css': 'css',
      '.scss': 'scss',
      '.json': 'json',
      '.md': 'markdown',
      '.html': 'html',
      '.py': 'python',
      '.env': 'plaintext',
    }

    const ext = file.path.substring(file.path.lastIndexOf('.'))
    return extensionMap[ext] || file.language || 'plaintext'
  }

  const groupFilesByDirectory = (files: GeneratedFile[]) => {
    const tree: Record<string, GeneratedFile[]> = {}

    files.forEach(file => {
      const parts = file.path.split('/')
      const dir = parts.length > 1 ? parts.slice(0, -1).join('/') : 'root'

      if (!tree[dir]) tree[dir] = []
      tree[dir].push(file)
    })

    return tree
  }

  const buildCodeGenerationPrompt = (): string => {
    if (!currentProject?.stages.stage1 || !currentProject?.stages.stage3 || !currentProject?.stages.stage4) {
      return ''
    }

    const stage1 = currentProject.stages.stage1
    const stage3 = currentProject.stages.stage3
    const stage4 = currentProject.stages.stage4

    // Build features list (Must and Should priorities)
    const features = stage3.features
      .filter(f => f.priority === 'Must' || f.priority === 'Should')
      .map(f => `- ${f.name}: ${f.description}`)
      .join('\n')

    // Create comprehensive specifications object
    const specifications = {
      concept: stage1.concept,
      targetUser: stage1.targetUser,
      problem: stage1.problem,
      features: stage3.features,
      userStories: stage3.userStories,
      uiRequirements: stage3.uiRequirements,
      stack: stage3.stack,
    }

    const variables = {
      specifications: JSON.stringify(specifications, null, 2),
      features: features,
      stack: stage3.stack.frontend,
      parameters: JSON.stringify(stage4.parameters, null, 2),
    }

    const userPrompt = buildPromptFromTemplate(5, variables)
    const systemPrompt = getSystemPrompt(5)

    // Enhanced prompt with structured output format
    const enhancedPrompt = `${systemPrompt}

${userPrompt}

CRITICAL OUTPUT FORMAT:
You must structure your response exactly as follows:

1. Start with file outputs in this exact format:
###FILE_START###
path: src/App.tsx
language: typescript
###CONTENT_START###
[file content here]
###CONTENT_END###
###FILE_END###

Repeat the above block for each file. Generate ALL necessary files including:
- Main application files (App.tsx, main.tsx, etc.)
- Component files in src/components/
- Type definitions in src/types/
- Utility functions in src/utils/
- Styling files (CSS, SCSS, or Tailwind config)
- Configuration files (package.json, tsconfig.json, vite.config.ts, etc.)
- README.md with setup instructions
- .env.example for environment variables

2. After all files, provide:
###TEST_PLAN_START###
# QA/UAT Test Plan

## Overview
[Brief overview of testing strategy]

## Test Scenarios
[List all test scenarios based on user stories with:
- Test ID
- Description
- Expected behavior
- Test steps
- Acceptance criteria]

## Manual Testing Checklist
[Step-by-step manual testing guide]

## Known Issues & Edge Cases
[Any known limitations or edge cases to watch for]
###TEST_PLAN_END###

3. Finally, provide:
###QA_CHECKLIST_START###
[
  {"id": "1", "description": "User can successfully authenticate with email/password", "status": "pending"},
  {"id": "2", "description": "All navigation links work correctly", "status": "pending"},
  {"id": "3", "description": "Form validation displays appropriate errors", "status": "pending"}
]
###QA_CHECKLIST_END###

Ensure the generated code is:
- Production-ready with proper error handling
- Well-commented and documented
- Following best practices and coding standards
- Fully functional and testable
- Properly typed (if TypeScript)
- Responsive and accessible (if web app)`

    return enhancedPrompt
  }

  const parseCodeGenerationResponse = (content: string): {
    files: GeneratedFile[]
    testPlan: string
    qaChecklist: QAChecklistItem[]
  } => {
    const files: GeneratedFile[] = []

    // Extract files
    const fileRegex = /###FILE_START###\s*path:\s*(.+?)\s*language:\s*(.+?)\s*###CONTENT_START###([\s\S]*?)###CONTENT_END###\s*###FILE_END###/g
    let match

    while ((match = fileRegex.exec(content)) !== null) {
      files.push({
        path: match[1].trim(),
        language: match[2].trim(),
        content: match[3].trim(),
      })
    }

    // Extract test plan
    const testPlanMatch = content.match(/###TEST_PLAN_START###([\s\S]*?)###TEST_PLAN_END###/)
    const testPlan = testPlanMatch ? testPlanMatch[1].trim() : 'No test plan generated'

    // Extract QA checklist
    const qaMatch = content.match(/###QA_CHECKLIST_START###([\s\S]*?)###QA_CHECKLIST_END###/)
    let qaChecklist: QAChecklistItem[] = []

    if (qaMatch) {
      try {
        qaChecklist = JSON.parse(qaMatch[1].trim())
      } catch (e) {
        console.error('Failed to parse QA checklist:', e)
        // Generate fallback checklist from user stories
        qaChecklist = generateFallbackChecklist()
      }
    } else {
      qaChecklist = generateFallbackChecklist()
    }

    return { files, testPlan, qaChecklist }
  }

  const generateFallbackChecklist = (): QAChecklistItem[] => {
    if (!currentProject?.stages.stage3?.userStories) {
      return [
        { id: '1', description: 'Application loads without errors', status: 'pending' },
        { id: '2', description: 'All core features are functional', status: 'pending' },
        { id: '3', description: 'UI is responsive and accessible', status: 'pending' },
      ]
    }

    return currentProject.stages.stage3.userStories.map((story, index) => ({
      id: `${index + 1}`,
      description: story.title,
      status: 'pending' as const,
    }))
  }

  const handleGenerateCode = async () => {
    // Validation
    if (!currentProject?.stages.stage1 || !currentProject?.stages.stage3 || !currentProject?.stages.stage4) {
      setError('Stages 1-4 must be completed before generating code')
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
      // Initialize Claude client with API key
      claudeClient.setApiKey(claudeApiKey)

      // Build comprehensive prompt
      const fullPrompt = buildCodeGenerationPrompt()

      // Send request to Claude (longer timeout for code generation)
      const response = await claudeClient.sendRequest({
        prompt: fullPrompt,
        maxTokens: 8000,
        temperature: 0.7,
      })

      // Parse response
      const parsed = parseCodeGenerationResponse(response.content)

      if (parsed.files.length === 0) {
        throw new Error('No files generated. Please try again.')
      }

      setGeneratedFiles(parsed.files)
      setSelectedFile(parsed.files[0])
      setTestPlan(parsed.testPlan)
      setQaChecklist(parsed.qaChecklist)
      setShowResults(true)

      // Save to project store
      const stage5Data: Stage5Data = {
        generatedCode: parsed.files,
        testPlan: parsed.testPlan,
        qaChecklist: parsed.qaChecklist,
        defectsResolved: false,
      }

      updateStageData('stage5', stage5Data)
    } catch (err: any) {
      setError(err.message || 'Failed to generate code. Please try again.')
      console.error('Code generation error:', err)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopyCode = () => {
    if (selectedFile) {
      navigator.clipboard.writeText(selectedFile.content)
      // Could add a toast notification here
    }
  }

  const handleDownloadFile = (file: GeneratedFile) => {
    const blob = new Blob([file.content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = file.path.split('/').pop() || 'file.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleDownloadAllAsZip = async () => {
    const zip = new JSZip()

    generatedFiles.forEach(file => {
      zip.file(file.path, file.content)
    })

    // Add test plan
    if (testPlan) {
      zip.file('TEST_PLAN.md', testPlan)
    }

    const blob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${currentProject?.name || 'project'}-generated-code.zip`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const updateQAStatus = (id: string, status: 'pending' | 'pass' | 'fail') => {
    const updated = qaChecklist.map(item =>
      item.id === id ? { ...item, status } : item
    )
    setQaChecklist(updated)

    // Update in store
    if (currentProject?.stages.stage5) {
      updateStageData('stage5', {
        ...currentProject.stages.stage5,
        qaChecklist: updated,
      })
    }
  }

  const handleRegenerate = () => {
    setShowResults(false)
    setGeneratedFiles([])
    setSelectedFile(null)
    setTestPlan('')
    setQaChecklist([])
    setDefectsResolved(false)
  }

  const handleProceedToStage6 = () => {
    if (!defectsResolved) {
      setError('Please confirm all defects are resolved before proceeding')
      return
    }

    // Save final state
    const stage5Data: Stage5Data = {
      generatedCode: generatedFiles,
      testPlan,
      qaChecklist,
      defectsResolved: true,
    }

    updateStageData('stage5', stage5Data)
    completeStage(5)
    navigate('/stage6')
  }

  const allTestsPassed = qaChecklist.length > 0 && qaChecklist.every(item => item.status === 'pass')
  const hasFailedTests = qaChecklist.some(item => item.status === 'fail')
  const passedCount = qaChecklist.filter(item => item.status === 'pass').length
  const fileTree = groupFilesByDirectory(generatedFiles)

  const stage1Data = currentProject?.stages.stage1
  const stage3Data = currentProject?.stages.stage3
  const stage4Data = currentProject?.stages.stage4

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-dark-text mb-2">
          Stage 5: Code Generation, Review & QA
        </h1>
        <p className="text-dark-text-secondary">
          Generate production-ready code, review implementation, and validate with comprehensive QA testing.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {/* Project Summary */}
      {stage1Data && stage3Data && stage4Data && !showResults && (
        <div className="card mb-6 bg-dark-bg-secondary">
          <h2 className="text-xl font-semibold text-dark-text mb-4">
            📋 Project Summary
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <p className="text-dark-text-secondary mt-1">
                {stage3Data.features.filter(f => f.priority === 'Must' || f.priority === 'Should').length} core features
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-dark-text-tertiary">Complexity:</span>
              <p className="text-dark-text-secondary mt-1 capitalize">{stage4Data.parameters.complexity}</p>
            </div>
          </div>
        </div>
      )}

      <div className="card space-y-6">
        {/* Generate Button */}
        {!showResults && !isGenerating && (
          <>
            <div>
              <h2 className="text-xl font-semibold text-dark-text mb-4">
                Ready to Generate Code
              </h2>
              <p className="text-dark-text-secondary mb-6">
                Claude will generate complete, production-ready code based on your specifications from Stages 1-4.
                This includes all necessary files, configuration, and a comprehensive test plan.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="primary"
                onClick={handleGenerateCode}
              >
                🚀 Generate Production Code
              </Button>
              {currentProject?.stages.stage5?.generatedCode && (
                <Button
                  variant="secondary"
                  onClick={() => setShowResults(true)}
                >
                  View Previous Code
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
                  Generating production-ready code...
                </p>
                <p className="text-sm text-dark-text-tertiary">
                  This may take 60-90 seconds
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Results Display */}
        {showResults && generatedFiles.length > 0 && (
          <>
            {/* Code Editor Section */}
            <div className="border-t border-dark-border pt-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-dark-text">
                  💻 Generated Code
                </h2>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={handleCopyCode} size="sm">
                    📋 Copy
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => selectedFile && handleDownloadFile(selectedFile)}
                    size="sm"
                  >
                    📥 Download
                  </Button>
                  <Button variant="secondary" onClick={handleDownloadAllAsZip} size="sm">
                    📦 Download ZIP
                  </Button>
                  <Button variant="secondary" onClick={handleRegenerate} size="sm">
                    🔄 Regenerate
                  </Button>
                </div>
              </div>

              <div className="flex border border-dark-border rounded-lg overflow-hidden bg-dark-bg-tertiary">
                {/* File Tree Sidebar */}
                <div className="w-64 border-r border-dark-border bg-dark-bg-secondary overflow-y-auto" style={{ maxHeight: '600px' }}>
                  {Object.entries(fileTree).map(([dir, files]) => (
                    <div key={dir}>
                      <div className="px-4 py-2 text-xs font-semibold text-dark-text-tertiary uppercase bg-dark-bg-tertiary">
                        📁 {dir}
                      </div>
                      {files.map(file => (
                        <button
                          key={file.path}
                          onClick={() => setSelectedFile(file)}
                          className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                            selectedFile?.path === file.path
                              ? 'bg-primary-500/20 text-primary-500'
                              : 'text-dark-text-secondary hover:bg-dark-bg-tertiary hover:text-dark-text'
                          }`}
                        >
                          <span className="mr-2">{getFileIcon(file.path)}</span>
                          {file.path.split('/').pop()}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Monaco Editor */}
                <div className="flex-1">
                  <div className="bg-dark-bg px-4 py-2 border-b border-dark-border">
                    <span className="text-sm text-dark-text font-medium">
                      {selectedFile?.path || 'No file selected'}
                    </span>
                  </div>
                  <Editor
                    height="600px"
                    language={getLanguageFromFile(selectedFile)}
                    theme="vs-dark"
                    value={selectedFile?.content || ''}
                    options={{
                      readOnly: true,
                      minimap: { enabled: true },
                      fontSize: 14,
                      wordWrap: 'on',
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      lineNumbers: 'on',
                      renderWhitespace: 'selection',
                    }}
                    loading={
                      <div className="flex items-center justify-center h-full bg-dark-bg">
                        <p className="text-dark-text-secondary">Loading editor...</p>
                      </div>
                    }
                  />
                </div>
              </div>
            </div>

            {/* Test Plan Section */}
            {testPlan && (
              <div className="border-t border-dark-border pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-dark-text">
                    🧪 QA/UAT Test Plan
                  </h2>
                  <button
                    onClick={() => setShowTestPlan(!showTestPlan)}
                    className="text-sm text-primary-500 hover:text-primary-400"
                  >
                    {showTestPlan ? 'Hide' : 'Show'}
                  </button>
                </div>

                {showTestPlan && (
                  <div className="bg-dark-bg-tertiary p-6 rounded-lg border border-dark-border">
                    <div className="prose prose-invert max-w-none">
                      <ReactMarkdown>{testPlan}</ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* QA Checklist Section */}
            {qaChecklist.length > 0 && (
              <div className="border-t border-dark-border pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-dark-text">
                    ✅ QA Checklist
                  </h2>
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-dark-text-secondary">
                      {passedCount} / {qaChecklist.length} passed
                      {allTestsPassed && <span className="ml-2 text-green-400">✓ All tests passed!</span>}
                    </div>
                    <button
                      onClick={() => setShowQAChecklist(!showQAChecklist)}
                      className="text-sm text-primary-500 hover:text-primary-400"
                    >
                      {showQAChecklist ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                {showQAChecklist && (
                  <div className="space-y-2">
                    {qaChecklist.map(item => (
                      <div
                        key={item.id}
                        className={`p-4 rounded-lg border transition-colors ${
                          item.status === 'pass'
                            ? 'bg-green-500/10 border-green-500'
                            : item.status === 'fail'
                            ? 'bg-red-500/10 border-red-500'
                            : 'bg-dark-bg-tertiary border-dark-border'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <span className="text-sm font-medium text-dark-text-tertiary">
                              #{item.id}
                            </span>
                            <span className="text-dark-text-secondary">{item.description}</span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => updateQAStatus(item.id, 'pass')}
                              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                item.status === 'pass'
                                  ? 'bg-green-500 text-white'
                                  : 'bg-dark-surface text-dark-text-secondary hover:bg-green-500/20 hover:text-green-400'
                              }`}
                            >
                              Pass
                            </button>
                            <button
                              onClick={() => updateQAStatus(item.id, 'fail')}
                              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                item.status === 'fail'
                                  ? 'bg-red-500 text-white'
                                  : 'bg-dark-surface text-dark-text-secondary hover:bg-red-500/20 hover:text-red-400'
                              }`}
                            >
                              Fail
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Validation & Proceed */}
            <div className="border-t border-dark-border pt-6">
              {hasFailedTests && (
                <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 mb-4">
                  <p className="text-red-400 font-medium">
                    ⚠️ Some QA checks have failed. Please address all defects before proceeding.
                  </p>
                </div>
              )}

              {!allTestsPassed && !hasFailedTests && (
                <div className="bg-yellow-500/10 border border-yellow-500 rounded-lg p-4 mb-4">
                  <p className="text-yellow-400 font-medium">
                    ⚠️ Please complete all QA checks (mark each as Pass or Fail) before proceeding.
                  </p>
                </div>
              )}

              <label className="flex items-center cursor-pointer mb-4">
                <input
                  type="checkbox"
                  checked={defectsResolved}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDefectsResolved(e.target.checked)}
                  disabled={!allTestsPassed}
                  className="mr-3 h-5 w-5 rounded border-blue-500 text-blue-500 focus:ring-2 focus:ring-blue-500"
                />
                <span className={`font-medium ${allTestsPassed ? 'text-dark-text' : 'text-dark-text-tertiary'}`}>
                  All defects resolved and code is ready for deployment
                </span>
              </label>

              <div className="flex gap-3">
                <Button
                  variant="primary"
                  onClick={handleProceedToStage6}
                  disabled={!defectsResolved}
                >
                  Proceed to Stage 6: Automation & Documentation
                </Button>
                <Button variant="secondary" onClick={handleRegenerate}>
                  Try Different Approach
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Info Box */}
      <div className="mt-6 card bg-dark-bg-secondary">
        <h3 className="text-lg font-semibold text-dark-text mb-3">
          What happens in Stage 5?
        </h3>
        <ul className="space-y-2 text-dark-text-secondary text-sm">
          <li className="flex items-start">
            <span className="text-primary-500 mr-2">•</span>
            <span>Claude AI generates complete, production-ready code for your application</span>
          </li>
          <li className="flex items-start">
            <span className="text-primary-500 mr-2">•</span>
            <span>Review all generated files in a professional Monaco editor with syntax highlighting</span>
          </li>
          <li className="flex items-start">
            <span className="text-primary-500 mr-2">•</span>
            <span>Follow a comprehensive QA/UAT test plan to validate implementation</span>
          </li>
          <li className="flex items-start">
            <span className="text-primary-500 mr-2">•</span>
            <span>Complete interactive QA checklist - all tests must pass before proceeding</span>
          </li>
          <li className="flex items-start">
            <span className="text-primary-500 mr-2">•</span>
            <span>Download individual files or entire project as ZIP archive</span>
          </li>
        </ul>
      </div>
    </div>
  )
}

export default CodeGeneration
