import { apiRequest } from './http'
import { endpoints } from './endpoints'

export function getLabTestCatalogs({
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

  return apiRequest(`${endpoints.labTestCatalogs}?${params.toString()}`)
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
