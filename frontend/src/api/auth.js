import { apiRequest, REFRESH_TOKEN_KEY } from './http'
import { endpoints } from './endpoints'

export function loginRequest(credentials) {
  return apiRequest(endpoints.authLogin, {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
}

export function getCurrentUser() {
  return apiRequest(endpoints.authMe)
}

export function logoutRequest() {
  return apiRequest(endpoints.authLogout, {
    method: 'POST',
    body: JSON.stringify({
      refresh: localStorage.getItem(REFRESH_TOKEN_KEY),
    }),
  })
}
