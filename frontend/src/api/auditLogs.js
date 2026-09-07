import { apiRequest } from './http'

export function getAuditLogs({ page = 1, pageSize = 8, ...filters } = {}, signal) {
  const params = new URLSearchParams({ page, page_size: pageSize })
  for (const key of ['search', 'action', 'resource_type', 'start_date', 'end_date']) {
    const value = filters[key]?.trim()
    if (value) params.set(key, value)
  }
  return apiRequest(`/audit-logs/?${params}`, { signal })
}
