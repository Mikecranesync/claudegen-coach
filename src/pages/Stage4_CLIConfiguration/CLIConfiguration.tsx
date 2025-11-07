import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input } from '@components/common/Input/Input'
import { Button } from '@components/common/Button/Button'
import { useProjectStore } from '@store/projectStore'
import { useStageStore } from '@store/stageStore'
import { useSettingsStore } from '@store/settingsStore'
import { claudeClient } from '@services/api/claude/claudeClient'
import { n8nClient } from '@services/api/n8n/n8nClient'
import type { Stage4Data, ClaudeParameters } from '@/types/project'

const CLIConfiguration: React.FC = () => {
  const navigate = useNavigate()
  const { currentProject, updateStageData } = useProjectStore()
  const { completeStage, canAccessStage } = useStageStore()
  const {
    claudeApiKey: savedClaudeKey,
    n8nApiKey: savedN8nKey,
    n8nBaseUrl: savedN8nUrl,
    setClaudeApiKey,
    setN8nApiKey,
    setN8nBaseUrl,
  } = useSettingsStore()

  // Form state - Claude
  const [claudeApiKey, setClaudeApiKeyLocal] = useState('')
  const [showClaudeKey, setShowClaudeKey] = useState(false)
  const [complexity, setComplexity] = useState<'low' | 'medium' | 'high'>('medium')
  const [language, setLanguage] = useState('TypeScript')
  const [model, setModel] = useState('claude-3-sonnet-20240229')

  // Form state - n8n
  const [showN8nConfig, setShowN8nConfig] = useState(false)
  const [n8nBaseUrl, setN8nBaseUrlLocal] = useState('')
  const [n8nApiKey, setN8nApiKeyLocal] = useState('')
  const [showN8nKey, setShowN8nKey] = useState(false)

  // UI state
  const [isTestingClaude, setIsTestingClaude] = useState(false)
  const [isTestingN8n, setIsTestingN8n] = useState(false)
  const [claudeStatus, setClaudeStatus] = useState<'idle' | 'testing' | 'connected' | 'failed'>('idle')
  const [n8nStatus, setN8nStatus] = useState<'idle' | 'testing' | 'connected' | 'failed'>('idle')
  const [claudeError, setClaudeError] = useState<string | null>(null)
  const [n8nError, setN8nError] = useState<string | null>(null)
  const [configConfirmed, setConfigConfirmed] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load existing data and auto-fill
  useEffect(() => {
    // Check if user can access this stage
    if (!canAccessStage(4)) {
      navigate('/stage3')
      return
    }

    // Load saved API keys
    if (savedClaudeKey) {
      setClaudeApiKeyLocal(savedClaudeKey)
    }
    if (savedN8nUrl) {
      setN8nBaseUrlLocal(savedN8nUrl)
    }
    if (savedN8nKey) {
      setN8nApiKeyLocal(savedN8nKey)
    }

    // Auto-fill from Stage 3
    if (currentProject?.stages.stage3) {
      const stage3Data = currentProject.stages.stage3

      // Infer language from tech stack
      const stack = stage3Data.stack?.frontend || ''
      if (stack.includes('TypeScript')) {
        setLanguage('TypeScript')
      } else if (stack.includes('JavaScript')) {
        setLanguage('JavaScript')
      } else if (stack.includes('Vue')) {
        setLanguage('JavaScript')
      }

      // Infer complexity from feature count
      const featureCount = stage3Data.features?.length || 0
      if (featureCount < 5) {
        setComplexity('low')
      } else if (featureCount < 10) {
        setComplexity('medium')
      } else {
        setComplexity('high')
      }
    }

    // Load existing Stage 4 data if available
    if (currentProject?.stages.stage4) {
      const stage4Data = currentProject.stages.stage4
      if (stage4Data.connectionStatus === 'connected') {
        setClaudeStatus('connected')
      }
      if (stage4Data.parameters) {
        setComplexity(stage4Data.parameters.complexity)
        setLanguage(stage4Data.parameters.language)
        if (stage4Data.parameters.model) {
          setModel(stage4Data.parameters.model)
        }
      }
    }
  }, [currentProject, savedClaudeKey, savedN8nUrl, savedN8nKey, canAccessStage, navigate])

  const handleTestClaudeConnection = async () => {
    if (!claudeApiKey.trim()) {
      setError('Please enter your Claude API key')
      return
    }

    setError(null)
    setClaudeError(null)
    setIsTestingClaude(true)
    setClaudeStatus('testing')

    try {
      claudeClient.setApiKey(claudeApiKey.trim())
      const status = await claudeClient.testConnection()

      if (status.connected) {
        setClaudeStatus('connected')
        setClaudeApiKey(claudeApiKey.trim()) // Save to settings store
        setClaudeError(null)
      } else {
        setClaudeStatus('failed')
        setClaudeError(status.error || 'Connection failed')
      }
    } catch (err: any) {
      setClaudeStatus('failed')
      setClaudeError(err.message || 'Connection test failed')
    } finally {
      setIsTestingClaude(false)
    }
  }

  const handleTestN8nConnection = async () => {
    if (!n8nBaseUrl.trim() || !n8nApiKey.trim()) {
      setError('Please enter both n8n Base URL and API Key')
      return
    }

    setError(null)
    setN8nError(null)
    setIsTestingN8n(true)
    setN8nStatus('testing')

    try {
      n8nClient.configure(n8nBaseUrl.trim(), n8nApiKey.trim())
      const status = await n8nClient.testConnection()

      if (status.connected) {
        setN8nStatus('connected')
        setN8nBaseUrl(n8nBaseUrl.trim()) // Save to settings store
        setN8nApiKey(n8nApiKey.trim()) // Save to settings store
        setN8nError(null)
      } else {
        setN8nStatus('failed')
        setN8nError(status.error || 'Connection failed')
      }
    } catch (err: any) {
      setN8nStatus('failed')
      setN8nError(err.message || 'Connection test failed')
    } finally {
      setIsTestingN8n(false)
    }
  }

  const handleProceedToStage5 = () => {
    if (claudeStatus !== 'connected') {
      setError('Please test Claude API connection before proceeding')
      return
    }

    if (!configConfirmed) {
      setError('Please confirm your configuration is ready')
      return
    }

    // Save configuration to Stage4Data
    const parameters: ClaudeParameters = {
      complexity,
      language,
      model,
    }

    const stage4Data: Stage4Data = {
      claudeApiKey: '***REDACTED***', // Don't store actual key in project data
      connectionStatus: 'connected',
      parameters,
    }

    updateStageData('stage4', stage4Data)

    // Mark stage 4 as complete
    completeStage(4)

    // Navigate to Stage 5
    navigate('/stage5')
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'testing':
        return <span className="text-blue-400">🔄</span>
      case 'connected':
        return <span className="text-green-400">✅</span>
      case 'failed':
        return <span className="text-red-400">❌</span>
      default:
        return <span className="text-gray-400">⚪</span>
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'testing':
        return 'Testing connection...'
      case 'connected':
        return 'Connected successfully'
      case 'failed':
        return 'Connection failed'
      default:
        return 'Not tested'
    }
  }

  const stage1Data = currentProject?.stages.stage1
  const stage3Data = currentProject?.stages.stage3

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-dark-text mb-2">
          Stage 4: Claude CLI Configuration
        </h1>
        <p className="text-dark-text-secondary">
          Configure your Claude API connection and set parameters for code generation in Stage 5.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {/* Previous Stages Summary */}
      {stage1Data && stage3Data && (
        <div className="card mb-6 bg-dark-bg-secondary">
          <h2 className="text-xl font-semibold text-dark-text mb-4">
            📋 Project Summary
          </h2>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-dark-text-tertiary">Concept:</span>
              <p className="text-dark-text-secondary mt-1">{stage1Data.concept}</p>
            </div>
            <div>
              <span className="font-medium text-dark-text-tertiary">Tech Stack:</span>
              <p className="text-dark-text-secondary mt-1">{stage3Data.stack?.frontend || 'Not specified'}</p>
            </div>
            <div>
              <span className="font-medium text-dark-text-tertiary">Features:</span>
              <p className="text-dark-text-secondary mt-1">{stage3Data.features?.length || 0} features defined</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Claude API Configuration */}
        <div className="card">
          <h2 className="text-xl font-semibold text-dark-text mb-4">
            🔑 Claude API Configuration
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-text mb-2">
                Claude API Key
              </label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type={showClaudeKey ? 'text' : 'password'}
                    value={claudeApiKey}
                    onChange={(e) => setClaudeApiKeyLocal(e.target.value)}
                    placeholder="sk-ant-..."
                    disabled={isTestingClaude}
                    className="w-full bg-dark-surface text-dark-text border border-dark-border rounded-lg px-4 py-2 pr-20 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => setShowClaudeKey(!showClaudeKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-dark-text-tertiary hover:text-dark-text"
                  >
                    {showClaudeKey ? 'Hide' : 'Show'}
                  </button>
                </div>
                <Button
                  variant="secondary"
                  onClick={handleTestClaudeConnection}
                  disabled={isTestingClaude || !claudeApiKey.trim()}
                >
                  {isTestingClaude ? 'Testing...' : 'Test Connection'}
                </Button>
              </div>
              <p className="mt-1 text-sm text-dark-text-secondary">
                Get your API key from{' '}
                <a
                  href="https://console.anthropic.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-500 hover:text-primary-400"
                >
                  console.anthropic.com
                </a>
              </p>
            </div>

            {/* Connection Status */}
            {claudeStatus !== 'idle' && (
              <div
                className={`p-4 rounded-lg border ${
                  claudeStatus === 'connected'
                    ? 'bg-green-500/10 border-green-500'
                    : claudeStatus === 'failed'
                    ? 'bg-red-500/10 border-red-500'
                    : 'bg-blue-500/10 border-blue-500'
                }`}
              >
                <div className="flex items-center gap-2">
                  {getStatusIcon(claudeStatus)}
                  <span
                    className={`font-medium ${
                      claudeStatus === 'connected'
                        ? 'text-green-400'
                        : claudeStatus === 'failed'
                        ? 'text-red-400'
                        : 'text-blue-400'
                    }`}
                  >
                    {getStatusText(claudeStatus)}
                  </span>
                </div>
                {claudeError && <p className="mt-2 text-sm text-red-400">{claudeError}</p>}
              </div>
            )}
          </div>
        </div>

        {/* Parameters Configuration */}
        <div className="card">
          <h2 className="text-xl font-semibold text-dark-text mb-4">
            ⚙️ Code Generation Parameters
          </h2>

          <div className="space-y-6">
            {/* Complexity */}
            <div>
              <label className="block text-sm font-medium text-dark-text mb-3">
                Project Complexity
              </label>
              <div className="space-y-2">
                {[
                  {
                    value: 'low' as const,
                    label: 'Low Complexity',
                    description: 'Simple apps with 1-5 features, basic UI, minimal integrations',
                  },
                  {
                    value: 'medium' as const,
                    label: 'Medium Complexity',
                    description: 'Multi-feature apps with moderate complexity and some integrations',
                  },
                  {
                    value: 'high' as const,
                    label: 'High Complexity',
                    description: 'Complex apps with 10+ features, advanced integrations, scalability needs',
                  },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${
                      complexity === option.value
                        ? 'border-primary-500 bg-primary-500/10'
                        : 'border-dark-border hover:bg-dark-bg-secondary'
                    }`}
                  >
                    <input
                      type="radio"
                      value={option.value}
                      checked={complexity === option.value}
                      onChange={(e) => setComplexity(e.target.value as 'low' | 'medium' | 'high')}
                      className="mt-1 mr-3"
                    />
                    <div>
                      <div className="font-medium text-dark-text">{option.label}</div>
                      <div className="text-sm text-dark-text-secondary mt-1">{option.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Language */}
            <div>
              <Input
                label="Programming Language"
                value={language}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLanguage(e.target.value)}
                placeholder="e.g., TypeScript, JavaScript, Python"
                helperText="Primary programming language for code generation"
              />
            </div>

            {/* Model */}
            <div>
              <label className="block text-sm font-medium text-dark-text mb-2">
                Claude Model
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-dark-surface text-dark-text border border-dark-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="claude-3-opus-20240229">Claude 3 Opus (Most capable, slower)</option>
                <option value="claude-3-sonnet-20240229">Claude 3 Sonnet (Balanced - Recommended)</option>
                <option value="claude-3-haiku-20240307">Claude 3 Haiku (Fast, efficient)</option>
              </select>
              <p className="mt-1 text-sm text-dark-text-secondary">
                Sonnet provides the best balance of quality and speed for code generation
              </p>
            </div>
          </div>
        </div>

        {/* n8n Configuration (Optional) */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-dark-text">
              🔗 n8n Workflow Automation (Optional)
            </h2>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showN8nConfig}
                onChange={(e) => setShowN8nConfig(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-dark-text-secondary">Configure for Stage 6</span>
            </label>
          </div>

          {showN8nConfig && (
            <div className="space-y-4 pt-4 border-t border-dark-border">
              <div>
                <Input
                  label="n8n Base URL"
                  value={n8nBaseUrl}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setN8nBaseUrlLocal(e.target.value)}
                  placeholder="https://your-n8n-instance.com"
                  helperText="URL of your n8n instance"
                  disabled={isTestingN8n}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">
                  n8n API Key
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type={showN8nKey ? 'text' : 'password'}
                      value={n8nApiKey}
                      onChange={(e) => setN8nApiKeyLocal(e.target.value)}
                      placeholder="Your n8n API key"
                      disabled={isTestingN8n}
                      className="w-full bg-dark-surface text-dark-text border border-dark-border rounded-lg px-4 py-2 pr-20 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    <button
                      onClick={() => setShowN8nKey(!showN8nKey)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-dark-text-tertiary hover:text-dark-text"
                    >
                      {showN8nKey ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={handleTestN8nConnection}
                    disabled={isTestingN8n || !n8nBaseUrl.trim() || !n8nApiKey.trim()}
                  >
                    {isTestingN8n ? 'Testing...' : 'Test Connection'}
                  </Button>
                </div>
              </div>

              {n8nStatus !== 'idle' && (
                <div
                  className={`p-4 rounded-lg border ${
                    n8nStatus === 'connected'
                      ? 'bg-green-500/10 border-green-500'
                      : n8nStatus === 'failed'
                      ? 'bg-red-500/10 border-red-500'
                      : 'bg-blue-500/10 border-blue-500'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {getStatusIcon(n8nStatus)}
                    <span
                      className={`font-medium ${
                        n8nStatus === 'connected'
                          ? 'text-green-400'
                          : n8nStatus === 'failed'
                          ? 'text-red-400'
                          : 'text-blue-400'
                      }`}
                    >
                      {getStatusText(n8nStatus)}
                    </span>
                  </div>
                  {n8nError && <p className="mt-2 text-sm text-red-400">{n8nError}</p>}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Configuration Summary */}
        {claudeStatus === 'connected' && (
          <div className="card bg-blue-500/10 border-2 border-blue-500">
            <h2 className="text-xl font-semibold text-blue-400 mb-4">
              📋 Configuration Summary
            </h2>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-dark-text-tertiary">Claude API:</span>
                <p className="text-green-400 mt-1">✅ Connected</p>
              </div>
              <div>
                <span className="font-medium text-dark-text-tertiary">Complexity:</span>
                <p className="text-dark-text-secondary mt-1 capitalize">{complexity}</p>
              </div>
              <div>
                <span className="font-medium text-dark-text-tertiary">Language:</span>
                <p className="text-dark-text-secondary mt-1">{language}</p>
              </div>
              <div>
                <span className="font-medium text-dark-text-tertiary">Model:</span>
                <p className="text-dark-text-secondary mt-1">
                  {model.includes('opus') ? 'Opus' : model.includes('sonnet') ? 'Sonnet' : 'Haiku'}
                </p>
              </div>
              {showN8nConfig && (
                <div>
                  <span className="font-medium text-dark-text-tertiary">n8n Status:</span>
                  <p
                    className={`mt-1 ${
                      n8nStatus === 'connected' ? 'text-green-400' : 'text-dark-text-secondary'
                    }`}
                  >
                    {n8nStatus === 'connected' ? '✅ Connected' : '⚪ Not configured'}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-blue-500/30">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={configConfirmed}
                  onChange={(e) => setConfigConfirmed(e.target.checked)}
                  className="mr-3 h-5 w-5 rounded border-blue-500 text-blue-500 focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-blue-400 font-medium">
                  Configuration verified and ready for code generation
                </span>
              </label>
            </div>

            <div className="mt-4 flex gap-3">
              <Button
                variant="primary"
                onClick={handleProceedToStage5}
                disabled={!configConfirmed || claudeStatus !== 'connected'}
              >
                Proceed to Stage 5: Code Generation
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="mt-6 card bg-dark-bg-secondary">
        <h3 className="text-lg font-semibold text-dark-text mb-3">
          What happens in Stage 4?
        </h3>
        <ul className="space-y-2 text-dark-text-secondary text-sm">
          <li className="flex items-start">
            <span className="text-primary-500 mr-2">•</span>
            <span>Configure and test your Claude API connection for code generation</span>
          </li>
          <li className="flex items-start">
            <span className="text-primary-500 mr-2">•</span>
            <span>Set project complexity and programming language for optimal results</span>
          </li>
          <li className="flex items-start">
            <span className="text-primary-500 mr-2">•</span>
            <span>Choose the Claude model that best fits your needs (Opus/Sonnet/Haiku)</span>
          </li>
          <li className="flex items-start">
            <span className="text-primary-500 mr-2">•</span>
            <span>Optionally configure n8n for workflow automation in Stage 6</span>
          </li>
        </ul>
      </div>
    </div>
  )
}

export default CLIConfiguration
