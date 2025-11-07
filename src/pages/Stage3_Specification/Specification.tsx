import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input } from '@components/common/Input/Input'
import { Button } from '@components/common/Button/Button'
import { useProjectStore } from '@store/projectStore'
import { useStageStore } from '@store/stageStore'
import { useSettingsStore } from '@store/settingsStore'
import { claudeClient } from '@services/api/claude/claudeClient'
import { buildPromptFromTemplate, getSystemPrompt } from '@config/prompts.config'
import type { Stage3Data, Feature, UserStory, TechStack } from '@/types/project'

const Specification: React.FC = () => {
  const navigate = useNavigate()
  const { currentProject, updateStageData } = useProjectStore()
  const { completeStage, canAccessStage } = useStageStore()
  const { claudeApiKey } = useSettingsStore()

  // Form state
  const [targetFeatures, setTargetFeatures] = useState('')
  const [uiPreferences, setUiPreferences] = useState('')
  const [techStack, setTechStack] = useState('react-ts')
  const [customStack, setCustomStack] = useState('')
  const [additionalContext, setAdditionalContext] = useState('')

  // UI state
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showResults, setShowResults] = useState(false)

  // Results state
  const [features, setFeatures] = useState<Feature[]>([])
  const [userStories, setUserStories] = useState<UserStory[]>([])
  const [uiRequirements, setUiRequirements] = useState<string>('')
  const [techRecommendations, setTechRecommendations] = useState<string>('')
  const [featuresConfirmed, setFeaturesConfirmed] = useState(false)

  // Load existing data if available
  useEffect(() => {
    // Check if user can access this stage
    if (!canAccessStage(3)) {
      navigate('/stage2')
      return
    }

    if (currentProject?.stages.stage3) {
      const stage3Data = currentProject.stages.stage3
      if (stage3Data.features && stage3Data.features.length > 0) {
        setFeatures(stage3Data.features)
        setUserStories(stage3Data.userStories || [])
        setUiRequirements(stage3Data.uiRequirements || '')
        setTechStack(stage3Data.stack?.frontend || 'react-ts')
        setShowResults(true)
      }
    }
  }, [currentProject, canAccessStage, navigate])

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

  const handleGenerateSpec = async () => {
    // Validation
    if (!targetFeatures.trim()) {
      setError('Please describe the features you want to build')
      return
    }

    if (!currentProject?.stages.stage1) {
      setError('Stage 1 must be completed before Stage 3')
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

      // Build comprehensive prompt
      let featuresDescription = targetFeatures.trim()
      if (uiPreferences.trim()) {
        featuresDescription += `\n\nUI/UX Requirements: ${uiPreferences.trim()}`
      }
      if (additionalContext.trim()) {
        featuresDescription += `\n\nAdditional Context: ${additionalContext.trim()}`
      }

      // Build prompt from template
      const userPrompt = buildPromptFromTemplate(3, {
        projectName: currentProject.name,
        concept: stage1Data.concept,
        targetFeatures: featuresDescription,
      })

      const systemPrompt = getSystemPrompt(3)

      // Enhanced prompt for structured output
      const enhancedPrompt = `${systemPrompt}\n\n${userPrompt}\n\nIMPORTANT: Structure your response as follows:
1. Start with a JSON code block containing the MoSCoW prioritized features in this exact format:
\`\`\`json
{
  "features": {
    "must": [{"name": "Feature Name", "description": "Description"}],
    "should": [{"name": "Feature Name", "description": "Description"}],
    "could": [{"name": "Feature Name", "description": "Description"}],
    "wont": [{"name": "Feature Name", "description": "Description"}]
  },
  "userStories": [
    {
      "title": "Story Title",
      "description": "As a [user type], I want [goal] so that [benefit]",
      "acceptanceCriteria": ["Criterion 1", "Criterion 2"]
    }
  ]
}
\`\`\`

2. Then provide UI/UX Requirements section
3. Finally provide Technical Recommendations section

Tech Stack Context: ${getTechStackLabel(techStack)}`

      // Send request to Claude
      const response = await claudeClient.sendRequest({
        prompt: enhancedPrompt,
        maxTokens: 10000,
        temperature: 0.7,
      })

      // Parse response
      const parsed = parseSpecificationResponse(response.content)

      setFeatures(parsed.features)
      setUserStories(parsed.userStories)
      setUiRequirements(parsed.uiRequirements)
      setTechRecommendations(parsed.techRecommendations)
      setShowResults(true)

      // Save to project store
      const techStackData: TechStack = {
        frontend: getTechStackLabel(techStack),
        backend: undefined,
        database: undefined,
        other: [],
      }

      const stage3Data: Stage3Data = {
        features: parsed.features,
        userStories: parsed.userStories,
        uiRequirements: parsed.uiRequirements,
        stack: techStackData,
      }

      updateStageData('stage3', stage3Data)
    } catch (err: any) {
      setError(err.message || 'Failed to generate specification. Please try again.')
      console.error('Specification generation error:', err)
    } finally {
      setIsGenerating(false)
    }
  }

  const parseSpecificationResponse = (content: string): {
    features: Feature[]
    userStories: UserStory[]
    uiRequirements: string
    techRecommendations: string
  } => {
    try {
      // Extract JSON block
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/)

      if (!jsonMatch) {
        throw new Error('Could not find JSON specification in response')
      }

      const jsonData = JSON.parse(jsonMatch[1])

      // Convert MoSCoW structure to Feature array
      const features: Feature[] = []

      type PriorityKey = 'must' | 'should' | 'could' | 'wont'
      const priorities: PriorityKey[] = ['must', 'should', 'could', 'wont']
      const priorityMap: Record<PriorityKey, Feature['priority']> = {
        must: 'Must',
        should: 'Should',
        could: 'Could',
        wont: "Won't"
      }

      priorities.forEach((priority: PriorityKey) => {
        const priorityFeatures = jsonData.features?.[priority] || []
        priorityFeatures.forEach((feature: any, index: number) => {
          features.push({
            id: `${String(priority)}-${index}-${Date.now()}`,
            name: feature.name || 'Unnamed Feature',
            description: feature.description || '',
            priority: priorityMap[priority],
          })
        })
      })

      // Extract user stories
      const userStories: UserStory[] = (jsonData.userStories || []).map((story: any, index: number) => ({
        id: `story-${index}-${Date.now()}`,
        title: story.title || 'Untitled Story',
        description: story.description || '',
        acceptanceCriteria: story.acceptanceCriteria || [],
      }))

      // Extract text sections
      const uiRequirements = extractSection(content, ['UI/UX Requirements', 'UI Requirements', 'UX Requirements'])
      const techRecommendations = extractSection(content, ['Technical Recommendations', 'Technical Architecture', 'Architecture'])

      return {
        features,
        userStories,
        uiRequirements: uiRequirements || 'No specific UI/UX requirements provided.',
        techRecommendations: techRecommendations || 'No specific technical recommendations provided.',
      }
    } catch (err) {
      console.error('Parsing error:', err)
      throw new Error('Failed to parse specification response. Please try again.')
    }
  }

  const extractSection = (content: string, headers: string[]): string => {
    for (const header of headers) {
      const headerRegex = new RegExp(`#+\\s*${header}[:\n]([\\s\\S]*?)(?=\\n#+|$)`, 'i')
      const match = content.match(headerRegex)
      if (match) {
        return match[1].trim()
      }
    }
    return ''
  }

  const handleFeaturesConfirmation = (confirmed: boolean) => {
    setFeaturesConfirmed(confirmed)

    // Update in store
    if (currentProject?.stages.stage3) {
      // Just update the confirmation flag, features stay the same
      updateStageData('stage3', {
        ...currentProject.stages.stage3,
      })
    }
  }

  const handleProceedToStage4 = () => {
    if (!featuresConfirmed) {
      setError('Please confirm that features align with market needs before proceeding')
      return
    }

    // Mark stage 3 as complete
    completeStage(3)

    // Navigate to Stage 4
    navigate('/stage4')
  }

  const handleRegenerate = () => {
    setShowResults(false)
    setFeatures([])
    setUserStories([])
    setUiRequirements('')
    setTechRecommendations('')
    setFeaturesConfirmed(false)
  }

  const getFeaturesByPriority = (priority: Feature['priority']) => {
    return features.filter(f => f.priority === priority)
  }

  const getPriorityConfig = (priority: Feature['priority']) => {
    const configs = {
      'Must': { emoji: '✅', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500', label: 'MUST HAVE', subtitle: 'Critical for MVP' },
      'Should': { emoji: '🔵', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500', label: 'SHOULD HAVE', subtitle: 'Important but not vital' },
      'Could': { emoji: '🟢', color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500', label: 'COULD HAVE', subtitle: 'Nice to have if time allows' },
      "Won't": { emoji: '⚪', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500', label: "WON'T HAVE", subtitle: 'Out of scope for this release' },
    }
    return configs[priority]
  }

  const stage1Data = currentProject?.stages.stage1
  const stage2Data = currentProject?.stages.stage2

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-dark-text mb-2">
          Stage 3: Feature Specification
        </h1>
        <p className="text-dark-text-secondary">
          Define and prioritize features using the MoSCoW method, create user stories, and establish technical requirements.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {/* Previous Stages Summary */}
      {stage1Data && stage2Data && (
        <div className="card mb-6 bg-dark-bg-secondary">
          <h2 className="text-xl font-semibold text-dark-text mb-4">
            📋 Previous Stages Summary
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <span className="text-sm font-medium text-dark-text-tertiary">Stage 1 - Concept:</span>
              <p className="text-dark-text-secondary mt-1 text-sm">{stage1Data.concept}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-dark-text-tertiary">Stage 2 - Viability:</span>
              <p className="text-dark-text-secondary mt-1 text-sm">
                {stage2Data.viabilityConfirmed ? '✅ Technically Viable' : '❌ Not Confirmed'}
              </p>
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
                Define Your MVP Features
              </h2>
            </div>

            <div>
              <Input
                label="Features to Build"
                value={targetFeatures}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setTargetFeatures(e.target.value)}
                placeholder="e.g., User authentication with email/password, Product catalog with search and filters, Shopping cart with checkout, Order history and tracking, User profile management, Admin dashboard for inventory"
                helperText="Describe all the features you want in your MVP (one per line or comma-separated)"
                disabled={isGenerating}
                multiline
                rows={5}
              />
            </div>

            <div>
              <Input
                label="UI/UX Requirements"
                value={uiPreferences}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setUiPreferences(e.target.value)}
                placeholder="e.g., Mobile-first responsive design, Dark mode support, WCAG 2.1 accessibility, Minimalist and modern interface, Fast loading times"
                helperText="Describe your design vision, constraints, and user experience goals"
                disabled={isGenerating}
                multiline
                rows={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-text mb-2">
                Technology Stack
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
                Select the frontend technology stack for your project
              </p>
            </div>

            {techStack === 'custom' && (
              <div>
                <Input
                  label="Custom Tech Stack"
                  value={customStack}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomStack(e.target.value)}
                  placeholder="e.g., Svelte with Tailwind CSS"
                  disabled={isGenerating}
                />
              </div>
            )}

            <div>
              <Input
                label="Additional Context (Optional)"
                value={additionalContext}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAdditionalContext(e.target.value)}
                placeholder="e.g., Integration with Stripe for payments, Must comply with GDPR, Expected 10,000 daily users, Real-time updates required"
                helperText="Any special requirements, constraints, or context that will help with specification"
                disabled={isGenerating}
                multiline
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="primary"
                onClick={handleGenerateSpec}
                disabled={isGenerating || !targetFeatures.trim()}
              >
                {isGenerating ? 'Generating Specifications...' : 'Generate Feature Specification'}
              </Button>
              {currentProject?.stages.stage3 && (
                <Button
                  variant="secondary"
                  onClick={() => setShowResults(true)}
                  disabled={features.length === 0}
                >
                  View Previous Specification
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
                  Generating feature specifications...
                </p>
                <p className="text-sm text-dark-text-tertiary mt-2">
                  This may take 30-60 seconds
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Results Display */}
        {showResults && features.length > 0 && (
          <>
            {/* Prioritized Features - MoSCoW */}
            <div className="border-t border-dark-border pt-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-dark-text">
                  📋 Feature Prioritization (MoSCoW Method)
                </h2>
                <Button variant="secondary" onClick={handleRegenerate} size="sm">
                  Regenerate
                </Button>
              </div>

              <div className="space-y-4">
                {(['Must', 'Should', 'Could', "Won't"] as const).map((priority) => {
                  const priorityFeatures = getFeaturesByPriority(priority)
                  if (priorityFeatures.length === 0) return null

                  const config = getPriorityConfig(priority)

                  return (
                    <div key={priority} className={`${config.bg} ${config.border} border rounded-lg p-4`}>
                      <h3 className={`font-semibold ${config.color} mb-1`}>
                        {config.emoji} {config.label}
                      </h3>
                      <p className="text-sm text-dark-text-tertiary mb-3">{config.subtitle}</p>
                      <div className="space-y-2">
                        {priorityFeatures.map((feature) => (
                          <div key={feature.id} className="bg-dark-bg-tertiary p-3 rounded border border-dark-border">
                            <h4 className="font-medium text-dark-text">{feature.name}</h4>
                            <p className="text-sm text-dark-text-secondary mt-1">{feature.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* User Stories */}
            {userStories.length > 0 && (
              <div className="border-t border-dark-border pt-6">
                <h2 className="text-xl font-semibold text-dark-text mb-4">
                  📖 User Stories & Acceptance Criteria
                </h2>
                <div className="space-y-4">
                  {userStories.map((story) => (
                    <div key={story.id} className="bg-dark-bg-tertiary p-4 rounded-lg border border-dark-border">
                      <h3 className="font-semibold text-dark-text mb-2">{story.title}</h3>
                      <p className="text-dark-text-secondary mb-3 italic">{story.description}</p>
                      {story.acceptanceCriteria.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-dark-text-tertiary mb-2">Acceptance Criteria:</p>
                          <ul className="space-y-1">
                            {story.acceptanceCriteria.map((criteria, index) => (
                              <li key={index} className="text-sm text-dark-text-secondary flex items-start">
                                <span className="text-primary-500 mr-2">✓</span>
                                <span>{criteria}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* UI/UX Requirements */}
            {uiRequirements && (
              <div className="border-t border-dark-border pt-6">
                <h2 className="text-xl font-semibold text-dark-text mb-4">
                  🎨 UI/UX Specifications
                </h2>
                <div className="bg-dark-bg-tertiary p-6 rounded-lg border border-dark-border">
                  <div className="prose prose-invert max-w-none">
                    <div className="whitespace-pre-wrap text-dark-text-secondary leading-relaxed">
                      {uiRequirements}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Technical Recommendations */}
            {techRecommendations && (
              <div className="border-t border-dark-border pt-6">
                <h2 className="text-xl font-semibold text-dark-text mb-4">
                  🏗️ Technical Architecture Recommendations
                </h2>
                <div className="bg-dark-bg-tertiary p-6 rounded-lg border border-dark-border">
                  <div className="prose prose-invert max-w-none">
                    <div className="whitespace-pre-wrap text-dark-text-secondary leading-relaxed">
                      {techRecommendations}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Confirmation & Navigation */}
            <div className="border-t border-dark-border pt-6">
              <div className="bg-blue-500/10 border border-blue-500 rounded-lg p-4 mb-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={featuresConfirmed}
                    onChange={(e) => handleFeaturesConfirmation(e.target.checked)}
                    className="mr-3 h-5 w-5 rounded border-blue-500 text-blue-500 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-blue-400 font-medium">
                    I confirm these features align with market needs and are ready for development planning
                  </span>
                </label>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="primary"
                  onClick={handleProceedToStage4}
                  disabled={!featuresConfirmed}
                >
                  Proceed to Stage 4: CLI Configuration
                </Button>
                <Button variant="secondary" onClick={handleRegenerate}>
                  Try Different Features
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Info Box */}
      <div className="mt-6 card bg-dark-bg-secondary">
        <h3 className="text-lg font-semibold text-dark-text mb-3">
          What happens in Stage 3?
        </h3>
        <ul className="space-y-2 text-dark-text-secondary text-sm">
          <li className="flex items-start">
            <span className="text-primary-500 mr-2">•</span>
            <span>Features are prioritized using MoSCoW method (Must/Should/Could/Won't have)</span>
          </li>
          <li className="flex items-start">
            <span className="text-primary-500 mr-2">•</span>
            <span>User stories are generated with acceptance criteria for development</span>
          </li>
          <li className="flex items-start">
            <span className="text-primary-500 mr-2">•</span>
            <span>UI/UX requirements are documented for design consistency</span>
          </li>
          <li className="flex items-start">
            <span className="text-primary-500 mr-2">•</span>
            <span>Technical architecture recommendations guide implementation approach</span>
          </li>
        </ul>
      </div>
    </div>
  )
}

export default Specification
