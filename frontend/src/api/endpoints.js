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
}
