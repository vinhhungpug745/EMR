import { apiRequest } from './http'

export function getUsers({ search = '', ordering = 'username' } = {}) {
  const params = new URLSearchParams()

  if (search.trim()) {
    params.set('search', search.trim())
  }

  if (ordering) {
    params.set('ordering', ordering)
  }

  const query = params.toString()

  return apiRequest(`/users/${query ? `?${query}` : ''}`)
}

export function getUserById(userId) {
  return apiRequest(`/users/${userId}/`)
}

export function createUser(userData) {
  return apiRequest('/users/', {
    method: 'POST',
    body: JSON.stringify(userData),
  })
}

export function updateUser(userId, userData) {
  return apiRequest(`/users/${userId}/`, {
    method: 'PATCH',
    body: JSON.stringify(userData),
  })
}

export function changeUserStatus(userId, isActive) {
  return updateUser(userId, {
    is_active: isActive,
    staff_profile: {
      active: isActive,
    },
  })
}
