export function getFieldError(error, ...path) {
  let value = error?.data
  for (const key of path) value = value?.[key]
  return Array.isArray(value) ? value[0] : value || ''
}
