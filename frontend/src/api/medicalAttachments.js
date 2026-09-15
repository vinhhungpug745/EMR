import { endpoints } from './endpoints'
import { apiFileRequest, apiRequest } from './http'

export function getMedicalAttachments(params = {}) {
  const searchParams = new URLSearchParams()
  if (params.encounter) searchParams.set('encounter', params.encounter)
  if (params.labTest) searchParams.set('lab_test', params.labTest)
  if (params.search) searchParams.set('search', params.search)
  if (params.ordering) searchParams.set('ordering', params.ordering)
  if (params.page) searchParams.set('page', params.page)
  if (params.pageSize) searchParams.set('page_size', params.pageSize)
  const query = searchParams.toString()
  return apiRequest(
    `${endpoints.medicalAttachments}${query ? `?${query}` : ''}`,
  )
}

export function createMedicalAttachment(payload) {
  const formData = new FormData()
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      formData.append(key, value)
    }
  })
  return apiRequest(endpoints.medicalAttachments, {
    method: 'POST',
    body: formData,
  })
}

export function deleteMedicalAttachment(id) {
  return apiRequest(endpoints.medicalAttachmentDetail(id), {
    method: 'DELETE',
  })
}

export function downloadMedicalAttachment(id) {
  return apiFileRequest(endpoints.medicalAttachmentDownload(id))
}
