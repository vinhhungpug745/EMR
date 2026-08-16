import { useCallback, useEffect, useMemo, useState } from 'react'

import { getCurrentUser, loginRequest, logoutRequest } from '../api/auth'
import {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  clearAuthTokens,
} from '../api/http'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function restoreSession() {
      if (
        !localStorage.getItem(ACCESS_TOKEN_KEY)
        && !localStorage.getItem(REFRESH_TOKEN_KEY)
      ) {
        setIsLoading(false)
        return
      }

      try {
        const data = await getCurrentUser()
        if (isMounted) setUser(data.user)
      } catch {
        clearAuthTokens()
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    restoreSession()
    return () => {
      isMounted = false
    }
  }, [])

  const login = useCallback(async (credentials) => {
    const data = await loginRequest(credentials)
    localStorage.setItem(ACCESS_TOKEN_KEY, data.access)
    localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh)
    setUser(data.user)
    return data.user
  }, [])

  const logout = useCallback(async () => {
    try {
      await logoutRequest()
    } finally {
      clearAuthTokens()
      setUser(null)
    }
  }, [])

  const value = useMemo(
    () => ({ user, isLoading, login, logout }),
    [user, isLoading, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
