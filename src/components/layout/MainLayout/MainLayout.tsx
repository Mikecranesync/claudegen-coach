import React, { useState } from 'react'
import { Outlet, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@hooks/useAuth'
import { Button } from '@components/common/Button/Button'

const MainLayout: React.FC = () => {
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to log out?')) {
      setIsLoggingOut(true)
      const result = await logout()
      setIsLoggingOut(false)

      if (result.success) {
        navigate('/login')
      }
    }
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      <header className="bg-dark-surface border-b border-dark-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary-500">ClaudeGen Coach</h1>
            <p className="text-sm text-dark-text-secondary">AI-Driven Product Development Assistant</p>
          </div>

          {isAuthenticated && user && (
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-dark-text">{user.displayName}</p>
                <p className="text-xs text-dark-text-secondary">{user.email}</p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </Button>
            </div>
          )}
        </div>
      </header>

      <div className="flex">
        <aside className="w-64 bg-dark-surface border-r border-dark-border min-h-[calc(100vh-80px)] p-4">
          <nav className="space-y-2">
            <Link to="/dashboard" className="block px-4 py-2 rounded hover:bg-dark-border text-dark-text transition-colors">
              Dashboard
            </Link>
            <Link to="/stage1" className="block px-4 py-2 rounded hover:bg-dark-border text-dark-text transition-colors">
              Stage 1: Idea
            </Link>
            <Link to="/stage2" className="block px-4 py-2 rounded hover:bg-dark-border text-dark-text transition-colors">
              Stage 2: Concept
            </Link>
            <Link to="/stage3" className="block px-4 py-2 rounded hover:bg-dark-border text-dark-text transition-colors">
              Stage 3: Specification
            </Link>
            <Link to="/stage4" className="block px-4 py-2 rounded hover:bg-dark-border text-dark-text transition-colors">
              Stage 4: CLI Config
            </Link>
            <Link to="/stage5" className="block px-4 py-2 rounded hover:bg-dark-border text-dark-text transition-colors">
              Stage 5: Code Gen
            </Link>
            <Link to="/stage6" className="block px-4 py-2 rounded hover:bg-dark-border text-dark-text transition-colors">
              Stage 6: Automation
            </Link>
            <Link to="/settings" className="block px-4 py-2 rounded hover:bg-dark-border text-dark-text transition-colors">
              Settings
            </Link>
          </nav>
        </aside>

        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default MainLayout
