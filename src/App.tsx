import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
// import { useAuthStore } from '@store/authStore'
import MainLayout from '@components/layout/MainLayout/MainLayout'
import Dashboard from '@pages/Dashboard/Dashboard'
import IdeaManagement from '@pages/Stage1_IdeaManagement/IdeaManagement'
import ConceptValidation from '@pages/Stage2_ConceptValidation/ConceptValidation'
import Specification from '@pages/Stage3_Specification/Specification'
import CLIConfiguration from '@pages/Stage4_CLIConfiguration/CLIConfiguration'
import CodeGeneration from '@pages/Stage5_CodeGeneration/CodeGeneration'
import Automation from '@pages/Stage6_Automation/Automation'
import Settings from '@pages/Settings/Settings'

function App() {
  // const { isAuthenticated } = useAuthStore()

  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />}>
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
