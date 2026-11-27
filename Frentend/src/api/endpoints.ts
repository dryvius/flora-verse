export const API_ENDPOINTS = {
  authRegister: '/api/v1/auth/register',
  authLogin: '/api/v1/auth/login',
  usersMe: '/api/v1/users/me',
  meStats: '/api/v1/me/stats',
  homeOverview: '/api/v1/home/overview',
  friendRanking: '/api/v1/rank/friends',
  species: '/api/v1/species',
  speciesDetail: '/api/v1/species/:id',
  images: '/api/v1/images',
  recognitionTasks: '/api/v1/recognition/tasks',
  recognitionTaskDetail: '/api/v1/recognition/tasks/:id',
  captures: '/api/v1/captures',
  collectionSpecies: '/api/v1/collection/species',
  collectionInstances: '/api/v1/collection/instances',
  instanceDetail: '/api/v1/instances/:id'
} as const

export function fillPath(template: string, id: string): string {
  return template.replace(':id', encodeURIComponent(id))
}
