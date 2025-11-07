import React, { useState, useEffect } from 'react'
import { Input } from '@components/common/Input/Input'
import { Button } from '@components/common/Button/Button'
import { useSettingsStore } from '@store/settingsStore'
import { useAuth } from '@hooks/useAuth'
import { supabaseService } from '@services/api/supabase/supabaseService'

const Settings: React.FC = () => {
  const { user } = useAuth()
  const {
    claudeApiKey,
    n8nApiKey,
    n8nBaseUrl,
    notifications,
    saveProgress,
    setClaudeApiKey,
    setN8nApiKey,
    setN8nBaseUrl,
    setNotifications,
    setSaveProgress,
  } = useSettingsStore()

  const [formData, setFormData] = useState({
    claudeApiKey: '',
    n8nApiKey: '',
    n8nBaseUrl: '',
  })
  const [showClaudeKey, setShowClaudeKey] = useState(false)
  const [showN8nKey, setShowN8nKey] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  // Environment variable Claude API key
  const envClaudeKey = import.meta.env.VITE_CLAUDE_API_KEY

  // Initialize form with stored values or environment defaults
  useEffect(() => {
    setFormData({
      claudeApiKey: claudeApiKey || envClaudeKey || '',
      n8nApiKey: n8nApiKey || '',
      n8nBaseUrl: n8nBaseUrl || '',
    })
  }, [claudeApiKey, n8nApiKey, n8nBaseUrl, envClaudeKey])

  const handleSave = async () => {
    setIsSaving(true)
    setSaveMessage('')

    try {
      // Save to local store
      setClaudeApiKey(formData.claudeApiKey || null)
      setN8nApiKey(formData.n8nApiKey || null)
      setN8nBaseUrl(formData.n8nBaseUrl || null)

      // Save to Supabase if user is authenticated
      if (user && supabaseService.isAvailable()) {
        await supabaseService.saveUserSettings(user.id, {
          claude_api_key: formData.claudeApiKey || null,
          n8n_api_key: formData.n8nApiKey || null,
          n8n_base_url: formData.n8nBaseUrl || null,
          notifications,
          save_progress: saveProgress,
        })
        setSaveMessage('Settings saved successfully (synced to cloud)')
      } else {
        setSaveMessage('Settings saved locally')
      }

      // Clear message after 3 seconds
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (error) {
      console.error('Error saving settings:', error)
      setSaveMessage('Error saving settings. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleChange = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-dark-text mb-6">Settings</h1>

      <div className="card space-y-6">
        {/* API Configuration */}
        <div>
          <h2 className="text-xl font-semibold mb-4">API Configuration</h2>
          <div className="space-y-4">
            {/* Claude API Key */}
            <div className="relative">
              <Input
                type={showClaudeKey ? 'text' : 'password'}
                label="Claude API Key"
                placeholder="sk-ant-..."
                value={formData.claudeApiKey}
                onChange={handleChange('claudeApiKey')}
                helperText={
                  envClaudeKey && !formData.claudeApiKey
                    ? 'Using key from environment variable (.env)'
                    : 'Your Claude API key for AI-powered code generation'
                }
              />
              <button
                type="button"
                onClick={() => setShowClaudeKey(!showClaudeKey)}
                className="absolute right-3 top-[38px] text-dark-text-secondary hover:text-dark-text transition-colors"
              >
                {showClaudeKey ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                )}
              </button>
            </div>

            {/* n8n API Key */}
            <div className="relative">
              <Input
                type={showN8nKey ? 'text' : 'password'}
                label="n8n API Key (Optional)"
                placeholder="Your n8n API key"
                value={formData.n8nApiKey}
                onChange={handleChange('n8nApiKey')}
                helperText="API key for n8n workflow automation"
              />
              <button
                type="button"
                onClick={() => setShowN8nKey(!showN8nKey)}
                className="absolute right-3 top-[38px] text-dark-text-secondary hover:text-dark-text transition-colors"
              >
                {showN8nKey ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                )}
              </button>
            </div>

            {/* n8n Base URL */}
            <Input
              type="url"
              label="n8n Base URL (Optional)"
              placeholder="https://your-n8n-instance.com"
              value={formData.n8nBaseUrl}
              onChange={handleChange('n8nBaseUrl')}
              helperText="Base URL for your n8n instance"
            />
          </div>
        </div>

        {/* Preferences */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Preferences</h2>
          <div className="space-y-3">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notifications}
                onChange={(e) => setNotifications(e.target.checked)}
                className="w-4 h-4 rounded border-dark-border bg-dark-surface text-primary-500 focus:ring-2 focus:ring-primary-500"
              />
              <span className="text-dark-text">Enable notifications</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={saveProgress}
                onChange={(e) => setSaveProgress(e.target.checked)}
                className="w-4 h-4 rounded border-dark-border bg-dark-surface text-primary-500 focus:ring-2 focus:ring-primary-500"
              />
              <span className="text-dark-text">Auto-save progress</span>
            </label>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center gap-4">
          <Button variant="primary" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
          {saveMessage && (
            <p className={`text-sm ${saveMessage.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>
              {saveMessage}
            </p>
          )}
        </div>

        {/* Info Section */}
        <div className="mt-6 p-4 bg-dark-bg rounded-lg border border-dark-border">
          <h3 className="text-sm font-semibold text-dark-text mb-2">Configuration Priority</h3>
          <ul className="text-sm text-dark-text-secondary space-y-1">
            <li>1. User-entered values (stored in Settings)</li>
            <li>2. Environment variables (.env file)</li>
            <li>3. Default values</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Settings
