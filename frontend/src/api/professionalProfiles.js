import { apiRequest } from './http'
import { endpoints } from './endpoints'

export function getProfessionalProfile(staffId) {
  return apiRequest(endpoints.professionalProfile(staffId))
}

export function createProfessionalProfile(staffId, profileData) {
  return apiRequest(endpoints.professionalProfile(staffId), {
    method: 'POST',
    body: JSON.stringify(profileData),
  })
}

export function updateProfessionalProfile(staffId, profileData) {
  return apiRequest(endpoints.professionalProfile(staffId), {
    method: 'PATCH',
    body: JSON.stringify(profileData),
  })
}
