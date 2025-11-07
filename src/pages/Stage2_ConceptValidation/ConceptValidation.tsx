import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input } from '@components/common/Input/Input'
import { Button } from '@components/common/Button/Button'
import { useProjectStore } from '@store/projectStore'
import { useStageStore } from '@store/stageStore'
import { useSettingsStore } from '@store/settingsStore'
import { claudeClient } from '@services/api/claude/claudeClient'
import { buildPromptFromTemplate, getSystemPrompt } from '@config/prompts.config'
import type { Stage2Data } from '@/types/project'
import Prism from 'prismjs'
import 'prismjs/themes/prism-tomorrow.css'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-jsx'
import 'prismjs/components/prism-tsx'
import 'prismjs/components/prism-css'
import 'prismjs/components/prism-markup'

const ConceptValidation: React.FC = () => {
  const navigate = useNavigate()
  const { currentProject, updateStageData } = useProjectStore()
  const { completeStage, canAccessStage } = useStageStore()
  const { claudeApiKey } = useSettingsStore()

  // Form state
  const [keyFeatures, setKeyFeatures] = useState('')
  const [techStack, setTechStack] = useState('react-ts')
  const [customStack, setCustomStack] = useState('')
  const [technicalConcerns, setTechnicalConcerns] = useState('')

  // UI state
  const [isGenerating, setIsGenerating] = useState(false)
  const [feasibilityReport, setFeasibilityReport] = useState<string | null>(null)
  const [pocCode, setPocCode] = useState<string | null>(null)
  const [viabilityConfirmed, setViabilityConfirmed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showResults, setShowResults] = useState(false)

  // Load existing data if available
  useEffect(() => {
    // Check if user can access this stage
    if (!canAccessStage(2)) {
      navigate('/stage1')
      return
    }

    if (currentProject?.stages.stage2) {
      const stage2Data = currentProject.stages.stage2
      if (stage2Data.feasibilityReport) {
        setFeasibilityReport(stage2Data.feasibilityReport)
        setPocCode(stage2Data.pocCode || null)
        setViabilityConfirmed(stage2Data.viabilityConfirmed)
        setShowResults(true)
      }
    }
  }, [currentProject, canAccessStage, navigate])

  // Syntax highlighting effect
  useEffect(() => {
    if (showResults && pocCode) {
      Prism.highlightAll()
    }
  }, [showResults, pocCode])

  const getTechStackLabel = (value: string): string => {
    const stacks: Record<string, string> = {
      'react-ts': 'React with TypeScript',
      'react-js': 'React with JavaScript',
      'vue': 'Vue.js',
      'vanilla': 'Vanilla HTML/CSS/JS',
      'nextjs': 'Next.js',
      'custom': customStack || 'Custom Stack',
    }
    return stacks[value] || value
  }

  const handleGeneratePoc = async () => {
    // Validation
    if (!keyFeatures.trim()) {
      setError('Please describe the key features you want to validate')
      return
    }

    if (!currentProject?.stages.stage1) {
      setError('Stage 1 must be completed before Stage 2')
      return
    }

    // Check API key
    if (!claudeApiKey) {
      setError('Claude API key not configured. Please set it in Settings.')
      return
    }

    setError(null)
    setIsGenerating(true)

    try {
      // Initialize Claude client with API key
      claudeClient.setApiKey(claudeApiKey)

      const stage1Data = currentProject.stages.stage1

      // Build prompt from template
      const userPrompt = buildPromptFromTemplate(2, {
        concept: stage1Data.concept,
        features: keyFeatures.trim(),
        stack: getTechStackLabel(techStack),
      })

      const systemPrompt = getSystemPrompt(2)

      // Add technical concerns if provided
      let fullPrompt = `${systemPrompt}\n\n${userPrompt}`
      if (technicalConcerns.trim()) {
        fullPrompt += `\n\nAdditional technical concerns to address:\n${technicalConcerns.trim()}`
      }

      // Send request to Claude
      const response = await claudeClient.sendRequest({
        prompt: fullPrompt,
        maxTokens: 6000,
        temperature: 0.7,
      })

      // Parse response to separate feasibility report from code
      const parsed = parseClaudeResponse(response.content)
      setFeasibilityReport(parsed.report)
      setPocCode(parsed.code)
      setShowResults(true)

      // Save to project store
      const stage2Data: Stage2Data = {
        feasibilityReport: parsed.report,
        pocCode: parsed.code,
        viabilityConfirmed: false, // User must manually confirm
      }

      updateStageData('stage2', stage2Data)
    } catch (err: any) {
      setError(err.message || 'Failed to generate PoC. Please try again.')
      console.error('PoC generation error:', err)
    } finally {
      setIsGenerating(false)
    }
  }

  const parseClaudeResponse = (content: string): { report: string; code: string } => {
    // Extract code blocks (```language...```)
    const codeBlockRegex = /```[\w]*\n([\s\S]*?)```/g
    const codeBlocks: string[] = []
    let match

    while ((match = codeBlockRegex.exec(content)) !== null) {
      codeBlocks.push(match[0]) // Keep the full code block with backticks for formatting
    }

    // Remove code blocks from report
    const report = content.replace(codeBlockRegex, '[CODE_BLOCK_REMOVED]').trim()

    // Combine all code blocks
    const code = codeBlocks.join('\n\n') || 'No code snippets generated.'

    return { report, code }
  }

  const handleViabilityChange = (confirmed: boolean) => {
    setViabilityConfirmed(confirmed)

    // Update in store
    if (currentProject?.stages.stage2) {
      updateStageData('stage2', {
        ...currentProject.stages.stage2,
        viabilityConfirmed: confirmed,
      })
    }
  }

  const handleProceedToStage3 = () => {
    if (!viabilityConfirmed) {
      setError('Please confirm technical viability before proceeding')
      return
    }

    // Mark stage 2 as complete
    completeStage(2)

    // Navigate to Stage 3
    navigate('/stage3')
  }

  const handleRegenerate = () => {
    setShowResults(false)
    setFeasibilityReport(null)
    setPocCode(null)
    setViabilityConfirmed(false)
  }

  const copyToClipboard = () => {
    if (pocCode) {
      navigator.clipboard.writeText(pocCode.replace(/```[\w]*\n|```/g, ''))
      // Could add a toast notification here
    }
  }

  const stage1Data = currentProject?.stages.stage1

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-dark-text mb-2">
          Stage 2: Concept Validation (PoC)
        </h1>
        <p className="text-dark-text-secondary">
          Validate technical feasibility by generating proof-of-concept code and analysis.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {/* Stage 1 Summary */}
      {stage1Data && (
        <div className="card mb-6 bg-dark-bg-secondary">
          <h2 className="text-xl font-semibold text-dark-text mb-4">
            📋 Stage 1 Summary
          </h2>
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-dark-text-tertiary">Concept:</span>
              <p className="text-dark-text-secondary mt-1">{stage1Data.concept}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-dark-text-tertiary">Target User:</span>
              <p className="text-dark-text-secondary mt-1">{stage1Data.targetUser}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-dark-text-tertiary">Problem:</span>
              <p className="text-dark-text-secondary mt-1">{stage1Data.problem}</p>
            </div>
          </div>
        </div>
      )}

      <div className="card space-y-6">
        {/* Input Form */}
        {!showResults && (
          <>
            <div>
              <h2 className="text-xl font-semibold text-dark-text mb-4">
                Define Validation Scope
              </h2>
            </div>

            <div>
              <Input
                label="Key Features to Validate"
                value={keyFeatures}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setKeyFeatures(e.target.value)}
                placeholder="e.g., User authentication, Real-time data sync, Search functionality, Payment integration"
                helperText="List the core features that need technical validation"
                disabled={isGenerating}
                multiline
                rows={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-text mb-2">
                Proposed Tech Stack
              </label>
              <select
                value={techStack}
                onChange={(e) => setTechStack(e.target.value)}
                disabled={isGenerating}
                className="w-full bg-dark-surface text-dark-text border border-dark-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="react-ts">React with TypeScript</option>
                <option value="react-js">React with JavaScript</option>
                <option value="vue">Vue.js</option>
                <option value="nextjs">Next.js</option>
                <option value="vanilla">Vanilla HTML/CSS/JS</option>
                <option value="custom">Custom (specify below)</option>
              </select>
              <p className="mt-1 text-sm text-dark-text-secondary">
                Select the technology stack you're considering
              </p>
            </div>

            {techStack === 'custom' && (
              <div>
                <Input
                  label="Custom Tech Stack"
                  value={customStack}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomStack(e.target.value)}
                  placeholder="e.g., Svelte with Firebase"
                  disabled={isGenerating}
                />
              </div>
            )}

            <div>
              <Input
                label="Technical Concerns (Optional)"
                value={technicalConcerns}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setTechnicalConcerns(e.target.value)}
                placeholder="e.g., Performance at scale, Browser compatibility, Third-party API limitations"
                helperText="Any specific technical challenges you want addressed"
                disabled={isGenerating}
                multiline
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="primary"
                onClick={handleGeneratePoc}
                disabled={isGenerating || !keyFeatures.trim()}
              >
                {isGenerating ? 'Generating Proof of Concept...' : 'Generate PoC'}
              </Button>
              {currentProject?.stages.stage2?.feasibilityReport && (
                <Button
                  variant="secondary"
                  onClick={() => setShowResults(true)}
                >
                  View Previous PoC
                </Button>
              )}
            </div>
          </>
        )}

        {/* Loading State */}
        {isGenerating && (
          <div className="border-t border-dark-border pt-6">
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
                <p className="text-dark-text-secondary">
                  Generating proof of concept...
                </p>
                <p className="text-sm text-dark-text-tertiary mt-2">
                  This may take 20-40 seconds
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Results Display */}
        {showResults && feasibilityReport && (
          <>
            <div className="border-t border-dark-border pt-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-dark-text">
                  📊 Technical Feasibility Assessment
                </h2>
                <Button variant="secondary" onClick={handleRegenerate} size="sm">
                  Regenerate
                </Button>
              </div>

              <div className="bg-dark-bg-tertiary p-6 rounded-lg border border-dark-border">
                <div className="prose prose-invert max-w-none">
                  <div className="whitespace-pre-wrap text-dark-text-secondary leading-relaxed">
                    {feasibilityReport}
                  </div>
                </div>
              </div>
            </div>

            {/* PoC Code Snippets */}
            {pocCode && (
              <div className="border-t border-dark-border pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-dark-text">
                    💻 Proof of Concept Code
                  </h2>
                  <Button variant="secondary" onClick={copyToClipboard} size="sm">
                    Copy Code
                  </Button>
                </div>

                <div className="bg-dark-bg-tertiary rounded-lg border border-dark-border overflow-hidden">
                  <pre className="p-4 overflow-x-auto">
                    <code className="language-javascript text-sm">
                      {pocCode}
                    </code>
                  </pre>
                </div>
              </div>
            )}

            {/* Viability Confirmation */}
            <div className="border-t border-dark-border pt-6">
              <div className="bg-blue-500/10 border border-blue-500 rounded-lg p-4 mb-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={viabilityConfirmed}
                    onChange={(e) => handleViabilityChange(e.target.checked)}
                    className="mr-3 h-5 w-5 rounded border-blue-500 text-blue-500 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-blue-400 font-medium">
                    I confirm this concept is technically viable and ready for detailed specification
                  </span>
                </label>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="primary"
                  onClick={handleProceedToStage3}
                  disabled={!viabilityConfirmed}
                >
                  Proceed to Stage 3: Specification
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
          What happens in Stage 2?
        </h3>
        <ul className="space-y-2 text-dark-text-secondary text-sm">
          <li className="flex items-start">
            <span className="text-primary-500 mr-2">•</span>
            <span>Claude AI generates a technical feasibility assessment for your concept</span>
          </li>
          <li className="flex items-start">
            <span className="text-primary-500 mr-2">•</span>
            <span>Receive proof-of-concept code snippets demonstrating core functionality</span>
          </li>
          <li className="flex items-start">
            <span className="text-primary-500 mr-2">•</span>
            <span>Identify potential technical challenges and recommended solutions</span>
          </li>
          <li className="flex items-start">
            <span className="text-primary-500 mr-2">•</span>
            <span>Confirm viability before proceeding to detailed specification</span>
          </li>
        </ul>
      </div>
    </div>
  )
}

export default ConceptValidation
