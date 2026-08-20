import { apiRequest } from './http'
import { endpoints } from './endpoints'

export function getStaffProfiles({
  search = '',
  ordering = 'role',
  role = 'all',
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

  params.set('page', page)
  params.set('page_size', pageSize)

  return apiRequest(`${endpoints.staffProfiles}?${params.toString()}`)
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
