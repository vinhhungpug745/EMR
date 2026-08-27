import { endpoints } from './endpoints'
import { apiRequest } from './http'


export function getLabTechnicianQueue(params = {}) {
  const searchParams = new URLSearchParams()

  if (params.search) searchParams.set('search', params.search)
  if (params.ordering) searchParams.set('ordering', params.ordering)
  if (params.page) searchParams.set('page', params.page)
  if (params.pageSize) searchParams.set('page_size', params.pageSize)

  const query = searchParams.toString()

  return apiRequest(
    `${endpoints.labtechnicianQueue}${query ? `?${query}` : ''}`,
  )
}