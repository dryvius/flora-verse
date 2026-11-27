import { resolveCampWeatherStation } from '@/constants/camp-climate'
import { AuthStatus } from '@/enums/auth-status'
import { resolveAuthenticatedDisplayName } from '@/pages/me/me-identity'
import type { UserProfile } from '@/types/user'
import type { HomeOverview } from '@/types/views'

export const CAMP_GUEST_DISPLAY_NAME = '游客'

export function shouldPresentGuestCamp(status: AuthStatus, bootstrapped: boolean): boolean {
  if (status === AuthStatus.Authenticated || status === AuthStatus.Bootstrapping) {
    return false
  }
  if (status === AuthStatus.Guest && !bootstrapped) {
    return false
  }
  return true
}

export function resolveCampPlayerName(authenticated: boolean, profile: UserProfile | null): string {
  if (!authenticated) {
    return CAMP_GUEST_DISPLAY_NAME
  }
  return resolveAuthenticatedDisplayName(profile)
}

export function createGuestCampOverview(now: Date = new Date()): HomeOverview {
  return {
    userDisplayName: CAMP_GUEST_DISPLAY_NAME,
    discoveredSpeciesCount: 0,
    instanceCount: 0,
    catalogSpeciesTotal: 0,
    weatherStation: resolveCampWeatherStation(now),
    featuredPlant: null,
    recentInstances: []
  }
}
