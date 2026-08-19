import { apiRequest } from './http'
import { endpoints } from './endpoints'

export function getUsers({ search = '', ordering = 'username' } = {}) {
  const params = new URLSearchParams()

  if (search.trim()) {
    params.set('search', search.trim())
  }

  if (ordering) {
    params.set('ordering', ordering)
  }

  const query = params.toString()

  return apiRequest(`${endpoints.users}${query ? `?${query}` : ''}`)
}

export function getUserById(userId) {
  return apiRequest(endpoints.userDetail(userId))
}

export function createUser(userData) {
  return apiRequest(endpoints.users, {
    method: 'POST',
    body: JSON.stringify(userData),
  })
}

export function updateUser(userId, userData) {
  return apiRequest(endpoints.userDetail(userId), {
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
