import { describe, expect, it } from 'vitest'
import { AuthStatus } from '@/enums/auth-status'
import {
  CAMP_GUEST_DISPLAY_NAME,
  createGuestCampOverview,
  resolveCampPlayerName,
  shouldPresentGuestCamp
} from '@/pages/home/camp-guest'
import type { UserProfile } from '@/types/user'

describe('游客营地', () => {
  it('未确认身份前不展示游客营地', (): void => {
    expect(shouldPresentGuestCamp(AuthStatus.Guest, false)).toBe(false)
    expect(shouldPresentGuestCamp(AuthStatus.Bootstrapping, false)).toBe(false)
    expect(shouldPresentGuestCamp(AuthStatus.Bootstrapping, true)).toBe(false)
  })

  it('已确认游客和暂时无法确认身份时展示游客营地', (): void => {
    expect(shouldPresentGuestCamp(AuthStatus.Guest, true)).toBe(true)
    expect(shouldPresentGuestCamp(AuthStatus.Unavailable, false)).toBe(true)
    expect(shouldPresentGuestCamp(AuthStatus.Authenticated, true)).toBe(false)
  })

  it('登录后营地昵称跟随当前用户，而不是演示账号', (): void => {
    const profile: UserProfile = {
      id: 'usr_real',
      displayName: '星辰',
      avatarKey: '',
      createdAt: '2026-11-26T06:00:00.000Z'
    }

    expect(resolveCampPlayerName(false, profile)).toBe('游客')
    expect(resolveCampPlayerName(true, profile)).toBe('星辰')
    expect(resolveCampPlayerName(true, { ...profile, displayName: '  ' })).toBe('旅人')
    expect(resolveCampPlayerName(true, null)).toBe('旅人')
  })

  it('游客营地只保留公共气象，不带收藏数据', (): void => {
    const overview = createGuestCampOverview(new Date(2026, 3, 15))

    expect(overview.userDisplayName).toBe(CAMP_GUEST_DISPLAY_NAME)
    expect(overview.userDisplayName).toBe('游客')
    expect(overview.discoveredSpeciesCount).toBe(0)
    expect(overview.instanceCount).toBe(0)
    expect(overview.catalogSpeciesTotal).toBe(0)
    expect(overview.featuredPlant).toBeNull()
    expect(overview.recentInstances).toEqual([])
    expect(overview.weatherStation.weatherLabel.length).toBeGreaterThan(0)
  })
})
