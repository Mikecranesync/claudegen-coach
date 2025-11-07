import React from 'react'
import { Input } from '@components/common/Input/Input'
import { Button } from '@components/common/Button/Button'

const Settings: React.FC = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold text-dark-text mb-6">Settings</h1>
      <div className="card space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">API Configuration</h2>
          <div className="space-y-4">
            <Input
              type="password"
              label="Claude API Key"
              placeholder="sk-ant-..."
              helperText="Your Claude API key for code generation"
            />
            <Input
              type="password"
              label="n8n API Key"
              placeholder="Your n8n API key"
              helperText="API key for n8n workflow management"
            />
            <Input
              type="url"
              label="n8n Base URL"
              placeholder="https://your-n8n-instance.com"
              helperText="Base URL for your n8n instance"
            />
          </div>
        </div>
        <Button variant="primary">Save Settings</Button>
      </div>
    </div>
  )
}

export default Settings
