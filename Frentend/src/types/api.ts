export interface ApiResponse<T> {
  code: string
  message: string
  data: T
  requestId?: string
}

export interface PageQuery {
  page: number
  pageSize: number
}

export interface PageResult<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
}

export interface SpeciesSearchQuery extends PageQuery {
  keyword?: string
  family?: string
}

export interface InstanceListQuery extends PageQuery {
  speciesId?: string
}

export interface ImageAsset {
  imageKey: string
  originalUrl: string
  displayUrl: string
  thumbnailUrl: string
}
