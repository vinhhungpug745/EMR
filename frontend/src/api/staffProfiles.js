import { apiRequest } from './http'
import { endpoints } from './endpoints'

export function getStaffProfiles({ search = '', ordering = 'role' } = {}) {
  const params = new URLSearchParams()

  if (search.trim()) {
    params.set('search', search.trim())
  }

  if (ordering) {
    params.set('ordering', ordering)
  }

  const query = params.toString()
  return apiRequest(`${endpoints.staffProfiles}${query ? `?${query}` : ''}`)
}

export function getStaffProfileById(staffId) {
  return apiRequest(endpoints.staffProfileDetail(staffId))
}

export function updateStaffProfile(staffId, profileData) {
  return apiRequest(endpoints.staffProfileDetail(staffId), {
    method: 'PATCH',
    body: JSON.stringify(profileData),
  })
}
