import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@hooks/useAuth'

interface PrivateRouteProps {
  children: React.ReactNode
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    // Redirect to login and save the attempted URL
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
