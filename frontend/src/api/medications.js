import { apiRequest } from './http'
import { endpoints } from './endpoints'

export async function getMedications({
  search = '',
  ordering = 'name',
  page = 1,
  pageSize = 8,
  activeOnly = false,
} = {}) {
  const params = new URLSearchParams()

  if (search.trim()) params.set('search', search.trim())
  if (ordering) params.set('ordering', ordering)
  params.set('page', page)
  params.set('page_size', pageSize)

  const data = await apiRequest(`${endpoints.medications}?${params.toString()}`)

  if (!activeOnly) return data

  const results = Array.isArray(data) ? data : data.results || []

  if (Array.isArray(data)) {
    return results.filter((medication) => medication.active)
  }

  return {
    ...data,
    results: results.filter((medication) => medication.active),
  }
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
