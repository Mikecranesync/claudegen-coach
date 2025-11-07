import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input } from '@components/common/Input/Input'
import { Button } from '@components/common/Button/Button'
import { useProjectStore } from '@store/projectStore'
import { useStageStore } from '@store/stageStore'
import { useSettingsStore } from '@store/settingsStore'
import { claudeClient } from '@services/api/claude/claudeClient'
import { buildPromptFromTemplate, getSystemPrompt } from '@config/prompts.config'
import type { Stage1Data } from '@/types/project'

const IdeaManagement: React.FC = () => {
  const navigate = useNavigate()
  const { currentProject, updateStageData, addProject } = useProjectStore()
  const { completeStage } = useStageStore()
  const { claudeApiKey } = useSettingsStore()

  // Form state
  const [concept, setConcept] = useState('')
  const [targetUser, setTargetUser] = useState('')
  const [problem, setProblem] = useState('')

  // UI state
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showResults, setShowResults] = useState(false)

  // Load existing data if available
  useEffect(() => {
    if (currentProject?.stages.stage1) {
      const stage1Data = currentProject.stages.stage1
      setConcept(stage1Data.concept || '')
      setTargetUser(stage1Data.targetUser || '')
      setProblem(stage1Data.problem || '')
      if (stage1Data.marketAnalysis) {
        setAnalysis(stage1Data.marketAnalysis)
        setShowResults(true)
      }
    }
  }, [currentProject])

  // Check API key on mount
  useEffect(() => {
    if (!claudeApiKey && !showResults) {
      setError('⚠️ Claude API key not configured. Please go to Settings and add your API key before analyzing.')
    } else if (error?.includes('Claude API key not configured')) {
      setError(null)
    }
  }, [claudeApiKey, showResults])

  const handleAnalyze = async () => {
    // Validation
    if (!concept.trim() || !targetUser.trim() || !problem.trim()) {
      setError('Please fill in all fields before analyzing')
      return
    }

    // Check API key
    if (!claudeApiKey) {
      setError('Claude API key not configured. Please set it in Settings.')
      return
    }

    setError(null)
    setIsAnalyzing(true)

    try {
      // Initialize Claude client with API key
      claudeClient.setApiKey(claudeApiKey)

      // Build prompt from template
      const userPrompt = buildPromptFromTemplate(1, {
        concept: concept.trim(),
        targetUser: targetUser.trim(),
        problem: problem.trim(),
      })

      const systemPrompt = getSystemPrompt(1)

      // Send request to Claude
      const fullPrompt = `${systemPrompt}\n\n${userPrompt}`
      const response = await claudeClient.sendRequest({
        prompt: fullPrompt,
        maxTokens: 4096,
        temperature: 0.8,
      })

      setAnalysis(response.content)
      setShowResults(true)

      // Save to project store
      const stage1Data: Stage1Data = {
        concept: concept.trim(),
        targetUser: targetUser.trim(),
        problem: problem.trim(),
        marketAnalysis: response.content,
      }

      // Create project if it doesn't exist
      if (!currentProject) {
        const newProject = {
          id: `project-${Date.now()}`,
          userId: 'default-user',
          name: concept.trim().substring(0, 50),
          description: problem.trim(),
          createdAt: new Date(),
          updatedAt: new Date(),
          currentStage: 1,
          stages: {
            stage1: stage1Data,
          },
          metadata: {
            version: '1.0.0',
            tags: [],
          },
        }
        addProject(newProject)
      } else {
        updateStageData('stage1', stage1Data)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to analyze idea. Please try again.')
      console.error('Analysis error:', err)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleRefine = () => {
    setShowResults(false)
    setAnalysis(null)
  }

  const handleProceedToStage2 = () => {
    // Mark stage 1 as complete
    completeStage(1)

    // Navigate to Stage 2
    navigate('/stage2')
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-dark-text mb-2">
          Stage 1: Idea Management & Validation
        </h1>
        <p className="text-dark-text-secondary">
          Define your product concept, target users, and the problem you're solving.
          Claude will analyze your idea and provide market insights.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-400">
          {error}
        </div>
      )}

      <div className="card space-y-6">
        {/* Input Form */}
        {!showResults && (
          <>
            <div>
              <Input
                label="Core Concept"
                value={concept}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setConcept(e.target.value)}
                placeholder="e.g., A mobile app that connects local farmers with consumers"
                helperText="What is the main concept of your product?"
                disabled={isAnalyzing}
                multiline
                rows={3}
              />
            </div>

            <div>
              <Input
                label="Target User"
                value={targetUser}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setTargetUser(e.target.value)}
                placeholder="e.g., Urban professionals aged 25-40 who value organic food"
                helperText="Who is this for? Be specific about your target audience"
                disabled={isAnalyzing}
                multiline
                rows={2}
              />
            </div>

            <div>
              <Input
                label="Problem Statement"
                value={problem}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setProblem(e.target.value)}
                placeholder="e.g., Consumers struggle to find fresh, local produce in cities"
                helperText="What problem does this solve? Why is it important?"
                disabled={isAnalyzing}
                multiline
                rows={3}
              />
            </div>

            <div>
              <div className="flex gap-3">
                <Button
                  variant="primary"
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !concept.trim() || !targetUser.trim() || !problem.trim()}
                >
                  {isAnalyzing ? 'Analyzing with Claude AI...' : 'Analyze & Refine'}
                </Button>
                {currentProject?.stages.stage1 && (
                  <Button
                    variant="secondary"
                    onClick={() => setShowResults(true)}
                    disabled={!analysis}
                  >
                    View Previous Analysis
                  </Button>
                )}
              </div>
              {(!concept.trim() || !targetUser.trim() || !problem.trim()) && (
                <p className="mt-2 text-sm text-yellow-400">
                  ℹ️ Please fill in all three fields above to enable the Analyze button
                </p>
              )}
            </div>
          </>
        )}

        {/* Analysis Results */}
        {showResults && analysis && (
          <>
            <div className="border-t border-dark-border pt-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-dark-text">
                  AI Analysis & Market Insights
                </h2>
                <Button variant="secondary" onClick={handleRefine} size="sm">
                  Refine Inputs
                </Button>
              </div>

              <div className="bg-dark-bg-tertiary p-6 rounded-lg border border-dark-border">
                <div className="prose prose-invert max-w-none">
                  <div className="whitespace-pre-wrap text-dark-text-secondary leading-relaxed">
                    {analysis}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-dark-border pt-6">
              <div className="bg-blue-500/10 border border-blue-500 rounded-lg p-4 mb-4">
                <p className="text-blue-400 text-sm">
                  <strong>Stage 1 Complete!</strong> Your idea has been analyzed and validated.
                  Review the insights above and proceed to Stage 2 for technical validation.
                </p>
              </div>

              <div className="flex gap-3">
                <Button variant="primary" onClick={handleProceedToStage2}>
                  Proceed to Stage 2: Concept Validation
                </Button>
                <Button variant="secondary" onClick={handleRefine}>
                  Refine This Idea
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Loading State */}
        {isAnalyzing && (
          <div className="border-t border-dark-border pt-6">
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
                <p className="text-dark-text-secondary">
                  Claude is analyzing your idea...
                </p>
                <p className="text-sm text-dark-text-tertiary mt-2">
                  This may take 10-30 seconds
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="mt-6 card bg-dark-bg-secondary">
        <h3 className="text-lg font-semibold text-dark-text mb-3">
          What happens in Stage 1?
        </h3>
        <ul className="space-y-2 text-dark-text-secondary text-sm">
          <li className="flex items-start">
            <span className="text-primary-500 mr-2">•</span>
            <span>Claude AI analyzes your product concept and provides strategic insights</span>
          </li>
          <li className="flex items-start">
            <span className="text-primary-500 mr-2">•</span>
            <span>Receive market analysis and competitive landscape review</span>
          </li>
          <li className="flex items-start">
            <span className="text-primary-500 mr-2">•</span>
            <span>Get business objectives and success metrics recommendations</span>
          </li>
          <li className="flex items-start">
            <span className="text-primary-500 mr-2">•</span>
            <span>Validation recommendations to ensure product-market fit</span>
          </li>
        </ul>
      </div>
    </div>
  )
}

export default IdeaManagement
