import {
  MIN_PROJECT_NAME_LENGTH,
  MAX_PROJECT_NAME_LENGTH,
  MIN_DESCRIPTION_LENGTH,
  MAX_DESCRIPTION_LENGTH,
} from './constants'

export const validateProjectName = (name: string): string | null => {
  if (!name || name.trim().length === 0) {
    return 'Project name is required'
  }
  if (name.length < MIN_PROJECT_NAME_LENGTH) {
    return `Project name must be at least ${MIN_PROJECT_NAME_LENGTH} characters`
  }
  if (name.length > MAX_PROJECT_NAME_LENGTH) {
    return `Project name must be less than ${MAX_PROJECT_NAME_LENGTH} characters`
  }
  return null
}

export const validateDescription = (description: string): string | null => {
  if (!description || description.trim().length === 0) {
    return 'Description is required'
  }
  if (description.length < MIN_DESCRIPTION_LENGTH) {
    return `Description must be at least ${MIN_DESCRIPTION_LENGTH} characters`
  }
  if (description.length > MAX_DESCRIPTION_LENGTH) {
    return `Description must be less than ${MAX_DESCRIPTION_LENGTH} characters`
  }
  return null
}

export const validateApiKey = (apiKey: string): string | null => {
  if (!apiKey || apiKey.trim().length === 0) {
    return 'API key is required'
  }
  // Basic validation - adjust based on actual API key format
  if (apiKey.length < 10) {
    return 'API key appears to be invalid'
  }
  return null
}

export const validateUrl = (url: string): string | null => {
  if (!url || url.trim().length === 0) {
    return 'URL is required'
  }
  try {
    new URL(url)
    return null
  } catch {
    return 'Invalid URL format'
  }
}

export const validateEmail = (email: string): string | null => {
  if (!email || email.trim().length === 0) {
    return 'Email is required'
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return 'Invalid email format'
  }
  return null
}
