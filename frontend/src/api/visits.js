import { apiRequest } from './http'
import { endpoints } from './endpoints'

export function createVisit(data) {
  return apiRequest(endpoints.visits, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}