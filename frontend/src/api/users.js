import { apiRequest } from './http'
import { endpoints } from './endpoints'

export function getUsers({
  search = '',
  ordering = 'username',
  role = 'all',
  status = 'all',
  page = 1,
  pageSize = 8,
} = {}) {
  const params = new URLSearchParams()

  if (search.trim()) {
    params.set('search', search.trim())
  }

  if (ordering) {
    params.set('ordering', ordering)
  }

  if (role && role !== 'all') {
    params.set('role', role)
  }

  if (status && status !== 'all') {
    params.set('status', status)
  }

  params.set('page', page)
  params.set('page_size', pageSize)

  return apiRequest(`${endpoints.users}?${params.toString()}`)
}

export function getUserById(userId) {
  return apiRequest(endpoints.userDetail(userId))
}

export function getUserSummary() {
  return apiRequest(`${endpoints.users}summary/`)
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
