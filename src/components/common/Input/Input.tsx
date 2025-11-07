import React from 'react'

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  error?: string
  helperText?: string
  multiline?: boolean
  rows?: number
}

interface TextAreaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  label?: string
  error?: string
  helperText?: string
  multiline: true
  rows?: number
}

type CombinedInputProps = InputProps | TextAreaProps

export const Input: React.FC<CombinedInputProps> = ({
  label,
  error,
  helperText,
  className = '',
  multiline,
  rows,
  ...props
}) => {
  const baseClasses = `w-full bg-dark-surface text-dark-text border ${
    error ? 'border-red-500' : 'border-dark-border'
  } rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${className}`

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-dark-text mb-2">
          {label}
        </label>
      )}
      {multiline ? (
        <textarea
          className={baseClasses}
          rows={rows || 4}
          {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      ) : (
        <input
          className={baseClasses}
          {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
        />
      )}
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      {helperText && !error && (
        <p className="mt-1 text-sm text-dark-text-secondary">{helperText}</p>
      )}
    </div>
  )
}
