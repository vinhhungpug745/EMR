import {apiRequest} from './http';
import {endpoints} from './endpoints';

export function getDepartments({search = '', ordering = 'name'} = {}) {
  const params = new URLSearchParams()

    if (search.trim()) {
        params.set('search', search.trim())
    }

    if (ordering) {
        params.set('ordering', ordering)
    }

    const query = params.toString()
    return apiRequest(`${endpoints.departments}${query ? `?${query}` : ''}`)
}

export function getDepartmentById(id) {
  return apiRequest(endpoints.departmentDetail(id))
}

export function createDepartment(data) {
  return apiRequest(endpoints.departments, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateDepartment(id, data) {
  return apiRequest(endpoints.departmentDetail(id), {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}