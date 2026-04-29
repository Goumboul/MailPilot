import { useState, useEffect } from 'react'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

interface HealthStatus {
  reachable: boolean
  responseTime: number | null
  error: string | null
  checkedAt: Date | null
}

export function APIHealthCheck() {
  const [status, setStatus] = useState<HealthStatus>({
    reachable: false,
    responseTime: null,
    error: null,
    checkedAt: null,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkHealth()
    const interval = setInterval(checkHealth, 5000)
    return () => clearInterval(interval)
  }, [])

  async function checkHealth() {
    setLoading(true)
    const start = performance.now()

    try {
      const res = await fetch(`${BASE_URL}/api/recipients`, {
        signal: AbortSignal.timeout(5000),
      })

      const ms = Math.round(performance.now() - start)

      if (res.ok) {
        setStatus({
          reachable: true,
          responseTime: ms,
          error: null,
          checkedAt: new Date(),
        })
      } else {
        setStatus({
          reachable: false,
          responseTime: ms,
          error: `HTTP ${res.status} ${res.statusText}`,
          checkedAt: new Date(),
        })
      }
    } catch (error) {
      const ms = Math.round(performance.now() - start)
      const message = error instanceof Error ? error.message : String(error)

      setStatus({
        reachable: false,
        responseTime: ms,
        error: message,
        checkedAt: new Date(),
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={checkHealth}
        className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
          status.reachable
            ? 'bg-emerald-900/50 text-emerald-300 hover:bg-emerald-900'
            : 'bg-red-900/50 text-red-300 hover:bg-red-900'
        }`}
        title={`API Health - Click to recheck\n${BASE_URL}/api`}
      >
        {loading && <span className="inline-block mr-1 animate-spin">⟳</span>}
        {status.reachable ? '✓ API Online' : '✗ API Offline'}
        {status.responseTime && <span className="ml-1 opacity-75">({status.responseTime}ms)</span>}
      </button>

      {status.error && (
        <div className="mt-2 rounded-lg bg-red-950 border border-red-800 p-3 text-xs text-red-200 max-w-xs shadow-lg">
          <p className="font-medium">API Health Check</p>
          <p className="mt-1 font-mono text-red-300">{status.error}</p>
          <p className="mt-2 text-red-400">
            ℹ️ Make sure Laravel is running:
            <br />
            <code className="block mt-1">cd backend && php artisan serve</code>
          </p>
        </div>
      )}
    </div>
  )
}
