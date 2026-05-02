import React from 'react'
import { Navigate } from 'react-router-dom'
import { getCurrentUser } from '../api/config'

/**
 * AuthGuard wraps protected routes.
 * Redirects to /login if there's no valid JWT in localStorage.
 */
const AuthGuard = ({ children }) => {
  const user = getCurrentUser()
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default AuthGuard
