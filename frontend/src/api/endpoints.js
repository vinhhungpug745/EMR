export const endpoints = {
  authLogin: '/auth/login/',
  authMe: '/auth/me/',
  authLogout: '/auth/logout/',
  auditLogs: '/audit-logs/',

  users: '/users/',
  userDetail: (id) => `/users/${id}/`,

  staffProfiles: '/staff-profiles/',
  staffProfileDetail: (id) => `/staff-profiles/${id}/`,
  professionalProfile: (staffId) => (`/staff-profiles/${staffId}/professional-profile/`),

  departments: '/departments/',
  departmentDetail: (id) => `/departments/${id}/`,

  medications: '/medications/',
  medicationDetail: (id) => `/medications/${id}/`,
  prescriptions: '/prescriptions/',
  prescriptionDetail: (id) => `/prescriptions/${id}/`,

  labTestCatalogs: '/lab-test-catalogs/',
  labTestCatalogDetail: (id) => `/lab-test-catalogs/${id}/`,

  labTests: '/lab-tests/',
  labTestDetail: (id) => `/lab-tests/${id}/`,

  patients: '/patients/',
  patientDetail: (id) => `/patients/${id}/`,

  medicalRecords: '/medical-records/',
  medicalRecordDetail: (id) => `/medical-records/${id}/`,
  medicalAttachments: '/medical-attachments/',
  medicalAttachmentDetail: (id) => `/medical-attachments/${id}/`,
  medicalAttachmentDownload: (id) => `/medical-attachments/${id}/download/`,

  visits: '/visits/',
  visitDetail: (id) => `/visits/${id}/`,

  encounters: '/encounters/',
  encounterDetail: (id) => `/encounters/${id}/`,

  vitalSigns: '/vital-signs/',
  vitalSignDetail: (id) => `/vital-signs/${id}/`,
  
  vitalSignQueue: '/vital-sign-queue/',
  consultationQueue: '/consultation-queue/',
  labtechnicianQueue: '/lab-technician-queue/',
}
