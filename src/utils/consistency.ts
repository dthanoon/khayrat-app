import { colors } from '../constants/theme'

export function consistencyColor(pct: number): string {
  if (pct >= 80) return colors.consistencyHigh
  if (pct >= 50) return colors.consistencyMid
  return colors.consistencyLow
}

export function consistencyLabel(pct: number): string {
  if (pct >= 90) return 'Excellent'
  if (pct >= 75) return 'Great'
  if (pct >= 60) return 'Good'
  if (pct >= 40) return 'Fair'
  return 'Keep going'
}

export function rankBadge(rank: number): string {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return `#${rank}`
}

export function formatPct(pct: number): string {
  return `${Math.round(pct)}%`
}

export function formatPoints(pts: number): string {
  if (pts >= 1000) return `${(pts / 1000).toFixed(1)}k`
  return String(pts)
}
