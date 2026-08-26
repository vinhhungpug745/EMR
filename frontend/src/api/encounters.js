import { apiRequest } from './http'
import { endpoints } from './endpoints'

export function createEncounter(data) {
  return apiRequest(endpoints.encounters, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function getEncounters(params = {}) {
  const searchParams = new URLSearchParams()

  if (params.search) {
    searchParams.set('search', params.search)
  }

  if (params.status) {
    searchParams.set('status', params.status)
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

  return apiRequest(`${endpoints.encounters}${query ? `?${query}` : ''}`)
}

export function getEncounter(id) {
  return apiRequest(endpoints.encounterDetail(id))
}

export function updateEncounter(id, data) {
  return apiRequest(endpoints.encounterDetail(id), {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export function startEncounter(id) {
  return apiRequest(endpoints.encounterDetail(id), {
    method: 'PATCH',
    body: JSON.stringify({
      status: 'in_progress',
    }),
  })
}
