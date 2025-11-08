import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@components/common/Button/Button'

const Dashboard: React.FC = () => {
  const navigate = useNavigate()

  const handleCreateProject = () => {
    navigate('/stage1')
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-dark-text mb-6">Dashboard</h1>
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Welcome to ClaudeGen Coach</h2>
        <p className="text-dark-text-secondary mb-6">
          Start your product development journey by creating a new project or continue working on an existing one.
        </p>
        <Button variant="primary" onClick={handleCreateProject}>
          Create New Project
        </Button>
      </div>
    </div>
  )
}

export default Dashboard
