import { useCallback, useEffect, useMemo, useState } from 'react'

import { getCurrentUser, loginRequest, logoutRequest } from '../api/auth'
import { AuthContext } from './auth-context'

const TOKEN_KEY = 'emr_access_token'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function restoreSession() {
      if (!localStorage.getItem(TOKEN_KEY)) {
        setIsLoading(false)
        return
      }

      try {
        const data = await getCurrentUser()
        if (isMounted) setUser(data.user)
      } catch {
        localStorage.removeItem(TOKEN_KEY)
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
    localStorage.setItem(TOKEN_KEY, data.token)
    setUser(data.user)
    return data.user
  }, [])

  const logout = useCallback(async () => {
    try {
      await logoutRequest()
    } finally {
      localStorage.removeItem(TOKEN_KEY)
      setUser(null)
    }
  }, [])

  const value = useMemo(
    () => ({ user, isLoading, login, logout }),
    [user, isLoading, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
