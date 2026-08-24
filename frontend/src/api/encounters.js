import { apiRequest } from './http'
import { endpoints } from './endpoints'

export function createEncounter(data) {
  return apiRequest(endpoints.encounters, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}