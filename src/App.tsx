import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@hooks/useAuth'
import { PrivateRoute } from '@components/common/PrivateRoute/PrivateRoute'
import MainLayout from '@components/layout/MainLayout/MainLayout'
import Dashboard from '@pages/Dashboard/Dashboard'
import IdeaManagement from '@pages/Stage1_IdeaManagement/IdeaManagement'
import ConceptValidation from '@pages/Stage2_ConceptValidation/ConceptValidation'
import Specification from '@pages/Stage3_Specification/Specification'
import CLIConfiguration from '@pages/Stage4_CLIConfiguration/CLIConfiguration'
import CodeGeneration from '@pages/Stage5_CodeGeneration/CodeGeneration'
import Automation from '@pages/Stage6_Automation/Automation'
import Settings from '@pages/Settings/Settings'
import { Login } from '@pages/Auth/Login'
import { Signup } from '@pages/Auth/Signup'

function App() {
  const { checkSession, isLoading } = useAuth()
  const [isInitialized, setIsInitialized] = useState(false)

  // Check for existing session on mount
  useEffect(() => {
    const initAuth = async () => {
      await checkSession()
      setIsInitialized(true)
    }

    initAuth()
  }, [checkSession])

  // Show loading screen while checking authentication
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-dark-text-secondary">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <Router>
      <Routes>
        {/* Auth Routes (Public) */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* App Routes (Protected) */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <MainLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="stage1" element={<IdeaManagement />} />
          <Route path="stage2" element={<ConceptValidation />} />
          <Route path="stage3" element={<Specification />} />
          <Route path="stage4" element={<CLIConfiguration />} />
          <Route path="stage5" element={<CodeGeneration />} />
          <Route path="stage6" element={<Automation />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
