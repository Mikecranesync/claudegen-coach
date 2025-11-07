import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@hooks/useAuth'
import { Button } from '@components/common/Button/Button'
import { Input } from '@components/common/Input/Input'

export const Signup: React.FC = () => {
  const navigate = useNavigate()
  const { signup, isLoading, error: authError } = useAuth()

  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState<{
    displayName?: string
    email?: string
    password?: string
    confirmPassword?: string
  }>({})

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {}

    // Display name validation
    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Display name is required'
    } else if (formData.displayName.trim().length < 2) {
      newErrors.displayName = 'Display name must be at least 2 characters'
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must include uppercase, lowercase, and number'
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    const result = await signup(formData.email, formData.password, formData.displayName)

    if (result.success) {
      if (result.needsEmailVerification) {
        // Show verification message (could be a modal or redirect to verification page)
        alert('Please check your email to verify your account before logging in.')
        navigate('/login')
      } else {
        navigate('/dashboard')
      }
    }
  }

  const handleChange = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary-400 mb-2">ClaudeGen Coach</h1>
          <p className="text-dark-text-secondary">AI-Powered Product Development Assistant</p>
        </div>

        {/* Signup Card */}
        <div className="bg-dark-surface border border-dark-border rounded-lg p-8 shadow-lg">
          <h2 className="text-2xl font-semibold text-dark-text mb-6">Create Account</h2>

          {/* Auth Error Message */}
          {authError && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-500 rounded-lg">
              <p className="text-sm text-red-400">{authError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Display Name Input */}
            <Input
              label="Display Name"
              type="text"
              placeholder="John Doe"
              value={formData.displayName}
              onChange={handleChange('displayName')}
              error={errors.displayName}
              disabled={isLoading}
              autoComplete="name"
            />

            {/* Email Input */}
            <Input
              label="Email"
              type="email"
              placeholder="your.email@example.com"
              value={formData.email}
              onChange={handleChange('email')}
              error={errors.email}
              disabled={isLoading}
              autoComplete="email"
            />

            {/* Password Input */}
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange('password')}
                error={errors.password}
                disabled={isLoading}
                autoComplete="new-password"
                helperText={!errors.password ? 'Must include uppercase, lowercase, and number' : undefined}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[38px] text-dark-text-secondary hover:text-dark-text transition-colors"
                disabled={isLoading}
              >
                {showPassword ? (
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

            {/* Confirm Password Input */}
            <div className="relative">
              <Input
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange('confirmPassword')}
                error={errors.confirmPassword}
                disabled={isLoading}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-[38px] text-dark-text-secondary hover:text-dark-text transition-colors"
                disabled={isLoading}
              >
                {showConfirmPassword ? (
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

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              className="w-full mt-6"
              disabled={isLoading}
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-dark-text-secondary">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>

          {/* Terms & Privacy */}
          <div className="mt-4 text-center text-xs text-dark-text-secondary">
            <p>
              By creating an account, you agree to our{' '}
              <a href="#" className="text-primary-400 hover:underline">Terms</a>
              {' '}and{' '}
              <a href="#" className="text-primary-400 hover:underline">Privacy Policy</a>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-dark-text-secondary">
          <p>Powered by Claude AI & Supabase</p>
        </div>
      </div>
    </div>
  )
}
