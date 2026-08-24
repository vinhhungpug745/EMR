import { apiRequest } from './http'
import { endpoints } from './endpoints'


export function getVitalSigns(params = {}) {
  const searchParams = new URLSearchParams()

  if (params.search) {
    searchParams.set('search', params.search)
  }

  if (params.encounter) {
    searchParams.set('encounter', params.encounter)
  }

  if (params.ordering) {
    searchParams.set('ordering', params.ordering)
  }

  if (params.page) {
    searchParams.set('page', params.page)
  }

  if (params.pageSize) {
    searchParams.set('page_size', params.pageSize)
  }

  const query = searchParams.toString()

  return apiRequest(
    `${endpoints.vitalSigns}${query ? `?${query}` : ''}`,
  )
}


export function getVitalSign(id) {
  return apiRequest(
    endpoints.vitalSignDetail(id),
  )
}


export function createVitalSign(data) {
  return apiRequest(
    endpoints.vitalSigns,
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
  )
}


export function updateVitalSign(id, data) {
  return apiRequest(
    endpoints.vitalSignDetail(id),
    {
      method: 'PATCH',
      body: JSON.stringify(data),
    },
  )
}