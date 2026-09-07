import { apiRequest, ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from './http'
import { endpoints } from './endpoints'

let currentUserRequest = null

export function loginRequest(credentials) {
  return apiRequest(endpoints.authLogin, {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
}

export function getCurrentUser() {
  // StrictMode replays the startup effect in development. Share only an
  // in-flight request for the same session; do not cache the user's profile.
  const sessionKey = JSON.stringify([
    localStorage.getItem(ACCESS_TOKEN_KEY),
    localStorage.getItem(REFRESH_TOKEN_KEY),
  ])
  if (currentUserRequest?.sessionKey === sessionKey) return currentUserRequest.promise

  const promise = apiRequest(endpoints.authMe).finally(() => {
    if (currentUserRequest?.promise === promise) currentUserRequest = null
  })
  currentUserRequest = { sessionKey, promise }
  return promise
}

export function logoutRequest() {
  return apiRequest(endpoints.authLogout, {
    method: 'POST',
    body: JSON.stringify({
      refresh: localStorage.getItem(REFRESH_TOKEN_KEY),
    }),
  })
}
