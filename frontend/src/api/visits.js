import { apiRequest } from './http'
import { endpoints } from './endpoints'

export function getVisits(params = {}) {
  const query = new URLSearchParams()

  if (params.search) query.set('search', params.search)
  if (params.status) query.set('status', params.status)
  if (params.ordering) query.set('ordering', params.ordering)
  if (params.page) query.set('page', params.page)
  if (params.pageSize || params.page_size) query.set('page_size', params.pageSize || params.page_size)

  return apiRequest(`${endpoints.visits}${query.toString() ? `?${query}` : ''}`)
}

export function updateVisit(id, data) {
  return apiRequest(endpoints.visitDetail(id), {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export function createVisit(data) {
  return apiRequest(endpoints.visits, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
