export const endpoints = {
  authLogin: '/auth/login/',
  authMe: '/auth/me/',
  authLogout: '/auth/logout/',

  users: '/users/',
  userDetail: (id) => `/users/${id}/`,

  staffProfiles: '/staff-profiles/',
  staffProfileDetail: (id) => `/staff-profiles/${id}/`,
  professionalProfile: (staffId) => (`/staff-profiles/${staffId}/professional-profile/`),

  departments: '/departments/',
  departmentDetail: (id) => `/departments/${id}/`,

  medications: '/medications/',
  medicationDetail: (id) => `/medications/${id}/`,

  labTestCatalogs: '/lab-test-catalogs/',
  labTestCatalogDetail: (id) => `/lab-test-catalogs/${id}/`,

  patients: '/patients/',
  patientDetail: (id) => `/patients/${id}/`,

  visits: '/visits/',
  visitDetail: (id) => `/visits/${id}/`,

  encounters: '/encounters/',
  encounterDetail: (id) => `/encounters/${id}/`,

  vitalSigns: '/vital-signs/',
  vitalSignDetail: (id) => `/vital-signs/${id}/`,
  nurseQueue: '/nurse-queue/',
}
