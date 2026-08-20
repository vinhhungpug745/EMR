import { useCallback, useEffect, useState } from 'react'

export function useSnackbar(autoHideMs = 3000) {
  const [snackbar, setSnackbar] = useState(null)

  const showSnackbar = useCallback((nextSnackbar) => {
    setSnackbar(nextSnackbar)
  }, [])

  const clearSnackbar = useCallback(() => {
    setSnackbar(null)
  }, [])

  useEffect(() => {
    if (!snackbar || snackbar.type === 'confirm') return undefined

    const timer = window.setTimeout(clearSnackbar, autoHideMs)
    return () => window.clearTimeout(timer)
  }, [autoHideMs, clearSnackbar, snackbar])

  return {
    snackbar,
    setSnackbar,
    showSnackbar,
    clearSnackbar,
  }
}
