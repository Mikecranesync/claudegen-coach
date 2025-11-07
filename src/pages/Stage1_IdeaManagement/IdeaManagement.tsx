import React from 'react'
import { Input } from '@components/common/Input/Input'
import { Button } from '@components/common/Button/Button'

const IdeaManagement: React.FC = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold text-dark-text mb-6">Stage 1: Idea Management & Validation</h1>
      <div className="card space-y-4">
        <Input
          label="Core Concept"
          placeholder="Describe your product idea..."
          helperText="What is the main concept of your product?"
        />
        <Input
          label="Target User"
          placeholder="Who is this for?"
          helperText="Define your target audience"
        />
        <Input
          label="Problem Statement"
          placeholder="What problem does this solve?"
          helperText="Clearly define the problem you're addressing"
        />
        <Button variant="primary">Analyze & Refine</Button>
      </div>
    </div>
  )
}

export default IdeaManagement
