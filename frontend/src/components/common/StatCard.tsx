import type { ReactNode } from 'react'

interface StatCardProps {
  label: string
  value: number | string
  subtitle: string
  icon: ReactNode
  iconBg: string
  iconColor: string
  /** Optional: render a bottom accent bar. Pass a Tailwind bg class. */
  accentColor?: string
}

export function StatCard({ label, value, subtitle, icon, iconBg, iconColor, accentColor }: StatCardProps) {
  return (
    <div className="group relative rounded-xl bg-zinc-900 ring-1 ring-zinc-800 p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/30 hover:ring-zinc-700">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{label}</p>
          <p className="mt-2 text-3xl font-bold text-zinc-100 tabular-nums leading-none">{value}</p>
          <p className="mt-1.5 text-sm text-zinc-500">{subtitle}</p>
        </div>
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg} transition-transform duration-200 group-hover:scale-110`}
        >
          <span className={iconColor}>{icon}</span>
        </div>
      </div>
      {accentColor && (
        <div className={`absolute bottom-0 left-6 right-6 h-0.5 rounded-full ${accentColor} opacity-50`} />
      )}
    </div>
  )
}
