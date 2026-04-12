/** Returns today's date as YYYY-MM-DD in local time */
export function todayString(): string {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

/** Format ISO string to "Apr 12, 2026" */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/** Format ISO string to "Apr 12" */
export function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

/** Format ISO string to "2:34 PM" */
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

/** Get the last N days as YYYY-MM-DD strings (inclusive of today), newest first */
export function lastNDays(n: number): string[] {
  const days: string[] = []
  for (let i = 0; i < n; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    days.push(`${yyyy}-${mm}-${dd}`)
  }
  return days
}

/** Returns relative time e.g. "2h ago", "just now" */
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

/** Is an arena currently active? */
export function isArenaActive(starts_at: string, ends_at: string): boolean {
  const now = Date.now()
  return new Date(starts_at).getTime() <= now && now <= new Date(ends_at).getTime()
}

/** Is an arena upcoming? */
export function isArenaUpcoming(starts_at: string): boolean {
  return new Date(starts_at).getTime() > Date.now()
}

/** Is an arena ended? */
export function isArenaEnded(ends_at: string): boolean {
  return new Date(ends_at).getTime() < Date.now()
}

export function arenaStatusLabel(starts_at: string, ends_at: string): 'Active' | 'Upcoming' | 'Ended' {
  if (isArenaEnded(ends_at)) return 'Ended'
  if (isArenaUpcoming(starts_at)) return 'Upcoming'
  return 'Active'
}
