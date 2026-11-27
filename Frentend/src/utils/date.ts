export function nowIso(): string {
  return new Date().toISOString()
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return iso
  }
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

export function formatDateTimeWithSeconds(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return iso
  }
  const base = formatDateTime(iso)
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${base}:${seconds}`
}

export function formatDate(iso: string): string {
  return formatDateTime(iso).slice(0, 10)
}
