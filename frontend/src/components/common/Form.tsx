import { type InputHTMLAttributes, type TextareaHTMLAttributes, type ReactNode } from 'react'

interface FieldProps {
  label: string
  error?: string
  required?: boolean
  children: ReactNode
  hint?: string
}

export function Field({ label, error, required, children, hint }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-zinc-300">
        {label}
        {required && <span className="ml-1 text-red-400">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-zinc-500">{hint}</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

const inputBase =
  'w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

export function Input({ error, className = '', ...props }: InputProps) {
  return (
    <input
      className={`${inputBase} ${error ? 'border-red-500 focus:ring-red-500' : ''} ${className}`}
      {...props}
    />
  )
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}

export function Textarea({ error, className = '', ...props }: TextareaProps) {
  return (
    <textarea
      rows={4}
      className={`${inputBase} resize-y ${error ? 'border-red-500 focus:ring-red-500' : ''} ${className}`}
      {...props}
    />
  )
}

interface SelectProps extends InputHTMLAttributes<HTMLSelectElement> {
  error?: boolean
  children: ReactNode
}

export function Select({ error, className = '', children, ...props }: SelectProps) {
  return (
    <select
      className={`${inputBase} ${error ? 'border-red-500 focus:ring-red-500' : ''} ${className}`}
      {...(props as React.SelectHTMLAttributes<HTMLSelectElement>)}
    >
      {children}
    </select>
  )
}

// Re-export React to avoid issues
import React from 'react'
void React
