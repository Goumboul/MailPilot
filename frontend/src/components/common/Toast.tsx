import { useEffect, useState } from 'react'

export type ToastVariant = 'success' | 'error'

interface ToastProps {
  message: string
  variant?: ToastVariant
  duration?: number
  onDismiss: () => void
}

export function Toast({ message, variant = 'success', duration = 3500, onDismiss }: ToastProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(onDismiss, 300)
    }, duration)
    return () => clearTimeout(timer)
  }, [duration, onDismiss])

  const base = variant === 'success'
    ? 'bg-emerald-950 ring-emerald-500/30 text-emerald-300'
    : 'bg-red-950 ring-red-500/30 text-red-300'

  return (
    <div
      className={`flex items-start gap-3 rounded-xl px-4 py-3 ring-1 shadow-2xl transition-all duration-300 ${base} ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
    >
      {variant === 'success' ? (
        <svg className="h-4 w-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      ) : (
        <svg className="h-4 w-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
      <p className="text-sm font-medium leading-snug">{message}</p>
      <button
        onClick={() => { setVisible(false); setTimeout(onDismiss, 300) }}
        className="ml-auto shrink-0 opacity-60 hover:opacity-100 transition-opacity"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

/* ------------------------------------------------------------------
 * ToastContainer — mounts in a fixed portal at the top-right corner
 * ------------------------------------------------------------------ */
export interface ToastItem {
  id: number
  message: string
  variant: ToastVariant
}

interface ToastContainerProps {
  toasts: ToastItem[]
  onDismiss: (id: number) => void
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-80">
      {toasts.map((t) => (
        <Toast key={t.id} message={t.message} variant={t.variant} onDismiss={() => onDismiss(t.id)} />
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------
 * useToast — minimal hook for managing toast state
 * ------------------------------------------------------------------ */
let _nextId = 1

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const push = (message: string, variant: ToastVariant = 'success') => {
    const id = _nextId++
    setToasts((prev) => [...prev, { id, message, variant }])
  }

  const dismiss = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return { toasts, push, dismiss }
}
