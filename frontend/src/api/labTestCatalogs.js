import { apiRequest } from './http'
import { endpoints } from './endpoints'

export async function getLabTestCatalogs({
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

  const data = await apiRequest(`${endpoints.labTestCatalogs}?${params.toString()}`)

  if (!activeOnly) return data

  const results = Array.isArray(data) ? data : data.results || []

  if (Array.isArray(data)) {
    return results.filter((test) => test.active)
  }

  return {
    ...data,
    results: results.filter((test) => test.active),
  }
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
