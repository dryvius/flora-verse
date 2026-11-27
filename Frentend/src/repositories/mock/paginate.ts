import type { PageResult } from '@/types/api'

export function paginate<T>(items: T[], page: number, pageSize: number): PageResult<T> {
  const safePage = Math.max(page, 1)
  const safeSize = Math.max(pageSize, 1)
  const start = (safePage - 1) * safeSize
  return {
    items: items.slice(start, start + safeSize),
    page: safePage,
    pageSize: safeSize,
    total: items.length
  }
}
