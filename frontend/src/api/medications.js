import { apiRequest } from './http'
import { endpoints } from './endpoints'

export function getMedications({
  search = '',
  ordering = 'name',
  page = 1,
  pageSize = 8,
} = {}) {
  const params = new URLSearchParams()

  if (search.trim()) params.set('search', search.trim())
  if (ordering) params.set('ordering', ordering)
  params.set('page', page)
  params.set('page_size', pageSize)

  return apiRequest(`${endpoints.medications}?${params.toString()}`)
}

export function createMedication(data) {
  return apiRequest(endpoints.medications, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateMedication(id, data) {
  return apiRequest(endpoints.medicationDetail(id), {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}
