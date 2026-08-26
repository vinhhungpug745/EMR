const VI_LOCALE = 'vi-VN'
const VI_TIME_ZONE = 'Asia/Ho_Chi_Minh'

function padDatePart(value) {
  return String(value).padStart(2, '0')
}

export function getNowLocalInputValue() {
  const now = new Date()
  const year = now.getFullYear()
  const month = padDatePart(now.getMonth() + 1)
  const day = padDatePart(now.getDate())
  const hour = padDatePart(now.getHours())
  const minute = padDatePart(now.getMinutes())

  return `${year}-${month}-${day}T${hour}:${minute}`
}

export function formatVietnamTime(value, fallback = '--:--') {
  if (!value) return fallback

  return new Intl.DateTimeFormat(VI_LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: VI_TIME_ZONE,
  }).format(new Date(value))
}

export function formatVietnamDateTime(value, fallback = 'Chưa cập nhật') {
  if (!value) return fallback

  return new Intl.DateTimeFormat(VI_LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: VI_TIME_ZONE,
  }).format(new Date(value))
}

export function formatVietnamDate(value, fallback = 'Chưa cập nhật') {
  if (!value) return fallback

  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00+07:00`)
    : new Date(value)

  return new Intl.DateTimeFormat(VI_LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: VI_TIME_ZONE,
  }).format(date)
}

export function formatCurrentVietnamDate() {
  return new Intl.DateTimeFormat(VI_LOCALE, {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: VI_TIME_ZONE,
  }).format(new Date())
}
