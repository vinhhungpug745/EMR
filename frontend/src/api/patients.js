import { apiRequest } from './http'
import { endpoints } from './endpoints'

export function getPatients({
  search = '',
  ordering = 'full_name',
  page = 1,
  pageSize = 8,
} = {}) {
  const params = new URLSearchParams()

  if (search.trim()) params.set('search', search.trim())
  if (ordering) params.set('ordering', ordering)
  params.set('page', page)
  params.set('page_size', pageSize)

  return apiRequest(`${endpoints.patients}?${params.toString()}`)
}

export function getPatient(id) {
  return apiRequest(endpoints.patientDetail(id))
}

export function createPatient(data) {
  return apiRequest(endpoints.patients, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updatePatient(id, data) {
  return apiRequest(endpoints.patientDetail(id), {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}
