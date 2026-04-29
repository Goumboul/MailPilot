export function APIErrorAlert({ error }: { error: string }) {
  return (
    <div className="rounded-lg border border-red-800 bg-red-950 p-4 text-sm text-red-200">
      <div className="flex gap-3">
        <div className="mt-0.5 flex-shrink-0">
          <svg
            className="h-5 w-5 text-red-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="flex-1">
          <p className="font-medium text-red-100">Connection Error</p>
          <p className="mt-1 text-red-300">{error}</p>
          <p className="mt-2 text-xs text-red-400">
            Make sure the Laravel backend is running on http://127.0.0.1:8000
          </p>
        </div>
      </div>
    </div>
  )
}
