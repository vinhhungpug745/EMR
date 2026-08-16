import { apiRequest, REFRESH_TOKEN_KEY } from './http'

export function loginRequest(credentials) {
  return apiRequest('/auth/login/', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
}

export function getCurrentUser() {
  return apiRequest('/auth/me/')
}

export function logoutRequest() {
  return apiRequest('/auth/logout/', {
    method: 'POST',
    body: JSON.stringify({
      refresh: localStorage.getItem(REFRESH_TOKEN_KEY),
    }),
  })
}
