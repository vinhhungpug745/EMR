import { apiRequest } from './http'
import { endpoints } from './endpoints'

export function getMedications({ search = '', ordering = 'name' } = {}) {
  const params = new URLSearchParams()

  if (search.trim()) params.set('search', search.trim())
  if (ordering) params.set('ordering', ordering)

  const query = params.toString()
  return apiRequest(`${endpoints.medications}${query ? `?${query}` : ''}`)
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