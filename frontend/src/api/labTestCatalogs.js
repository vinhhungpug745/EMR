import { apiRequest } from './http'
import { endpoints } from './endpoints'

export function getLabTestCatalogs({ search = '', ordering = 'name' } = {}) {
  const params = new URLSearchParams()

  if (search.trim()) params.set('search', search.trim())
  if (ordering) params.set('ordering', ordering)

  const query = params.toString()
  return apiRequest(`${endpoints.labTestCatalogs}${query ? `?${query}` : ''}`)
}

export function createLabTestCatalog(data) {
  return apiRequest(endpoints.labTestCatalogs, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateLabTestCatalog(id, data) {
  return apiRequest(endpoints.labTestCatalogDetail(id), {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}