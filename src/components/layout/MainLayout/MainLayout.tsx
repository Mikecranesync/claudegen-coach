import React from 'react'
import { Outlet } from 'react-router-dom'

const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-dark-bg">
      <header className="bg-dark-surface border-b border-dark-border px-6 py-4">
        <h1 className="text-2xl font-bold text-primary-500">ClaudeGen Coach</h1>
        <p className="text-sm text-dark-text-secondary">AI-Driven Product Development Assistant</p>
      </header>

      <div className="flex">
        <aside className="w-64 bg-dark-surface border-r border-dark-border min-h-[calc(100vh-80px)] p-4">
          <nav className="space-y-2">
            <a href="/dashboard" className="block px-4 py-2 rounded hover:bg-dark-border text-dark-text">
              Dashboard
            </a>
            <a href="/stage1" className="block px-4 py-2 rounded hover:bg-dark-border text-dark-text">
              Stage 1: Idea
            </a>
            <a href="/stage2" className="block px-4 py-2 rounded hover:bg-dark-border text-dark-text">
              Stage 2: Concept
            </a>
            <a href="/stage3" className="block px-4 py-2 rounded hover:bg-dark-border text-dark-text">
              Stage 3: Specification
            </a>
            <a href="/stage4" className="block px-4 py-2 rounded hover:bg-dark-border text-dark-text">
              Stage 4: CLI Config
            </a>
            <a href="/stage5" className="block px-4 py-2 rounded hover:bg-dark-border text-dark-text">
              Stage 5: Code Gen
            </a>
            <a href="/stage6" className="block px-4 py-2 rounded hover:bg-dark-border text-dark-text">
              Stage 6: Automation
            </a>
            <a href="/settings" className="block px-4 py-2 rounded hover:bg-dark-border text-dark-text">
              Settings
            </a>
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
