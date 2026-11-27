export const EXPLORER_RANK_THRESHOLDS = {
  SENIOR: 5,
  RECORDER: 12
} as const

export function resolveExplorerRank(discoveredSpeciesCount: number): string {
  if (discoveredSpeciesCount >= EXPLORER_RANK_THRESHOLDS.RECORDER) {
    return '博物学记录者'
  }
  if (discoveredSpeciesCount >= EXPLORER_RANK_THRESHOLDS.SENIOR) {
    return '资深寻踪者'
  }
  return '见习寻踪者'
}

export function resolveExplorerRankProgress(discoveredSpeciesCount: number): number {
  if (discoveredSpeciesCount >= EXPLORER_RANK_THRESHOLDS.RECORDER) {
    return 100
  }
  if (discoveredSpeciesCount >= EXPLORER_RANK_THRESHOLDS.SENIOR) {
    return ((discoveredSpeciesCount - EXPLORER_RANK_THRESHOLDS.SENIOR) /
      (EXPLORER_RANK_THRESHOLDS.RECORDER - EXPLORER_RANK_THRESHOLDS.SENIOR)) *
      100
  }
  return (discoveredSpeciesCount / EXPLORER_RANK_THRESHOLDS.SENIOR) * 100
}

export function resolveExplorerRankHint(discoveredSpeciesCount: number): string {
  if (discoveredSpeciesCount >= EXPLORER_RANK_THRESHOLDS.RECORDER) {
    return '当前首发图鉴最高阶位'
  }
  const nextThreshold =
    discoveredSpeciesCount >= EXPLORER_RANK_THRESHOLDS.SENIOR
      ? EXPLORER_RANK_THRESHOLDS.RECORDER
      : EXPLORER_RANK_THRESHOLDS.SENIOR
  return `下一阶位进度 ${discoveredSpeciesCount} / ${nextThreshold}`
}
