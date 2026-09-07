import { apiRequest } from './http'

export function getOutpatientReport(filters, signal) {
  const query = new URLSearchParams(filters)
  return apiRequest(`/reports/outpatient/?${query}`, { signal })
}
