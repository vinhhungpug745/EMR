import { endpoints } from './endpoints'
import { apiRequest } from './http'

export function getPrescriptions(params = {}) {
  const searchParams = new URLSearchParams()

  if (params.search) searchParams.set('search', params.search)
  if (params.encounter) searchParams.set('encounter', params.encounter)
  if (params.status) searchParams.set('status', params.status)
  if (params.ordering) searchParams.set('ordering', params.ordering)
  if (params.page) searchParams.set('page', params.page)
  if (params.pageSize) searchParams.set('page_size', params.pageSize)

  const query = searchParams.toString()

  return apiRequest(
    `${endpoints.prescriptions}${query ? `?${query}` : ''}`,
  )
}

export function createPrescription(payload) {
  return apiRequest(endpoints.prescriptions, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updatePrescription(id, payload) {
  return apiRequest(endpoints.prescriptionDetail(id), {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}
