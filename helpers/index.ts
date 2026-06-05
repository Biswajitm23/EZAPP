/**
 * General-purpose helpers.
 */

export * from './auth'
export * from './image'
export * from './onboarding'

/** Returns the initials for a name, e.g. "Ayan Roy" -> "AR". */
export const initialsOf = (name?: string | null): string => {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return parts[0]?.charAt(0).toUpperCase() || '?'
}

/** Base URL for employee profile pictures (API returns only the filename). */
export const EMPLOYEE_PIC_BASE_URL =
  'https://bitpastel.org/employee-zone/admin/uploads/employee_pic/'

/**
 * Builds the full URL for an employee profile picture.
 *
 * The API returns just a stored filename (e.g. "f77d074e66de9985f91ebab299f03af7.jpg");
 * this prefixes it with EMPLOYEE_PIC_BASE_URL. Returns undefined when there is
 * no picture, and passes through values that are already absolute URLs.
 */
export const employeePicUrl = (filename?: string | null): string | undefined => {
  const name = filename?.trim()
  if (!name) return undefined
  if (/^https?:\/\//i.test(name)) return name
  return `${EMPLOYEE_PIC_BASE_URL}${name}`
}

/** Basic email format check. */
export const isValidEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())

/** Strips HTML tags from a string (handy for CodeIgniter-rendered content). */
export const stripHtml = (html?: string | null): string => {
  if (!html) return ''
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

/** LinkedIn-style relative time: "now", "5m ago", "2h ago", "3d ago". */
export const timeAgo = (isoString?: string | null): string => {
  if (!isoString) return ''
  const past = new Date(isoString).getTime()
  if (Number.isNaN(past)) return ''
  const seconds = Math.max(0, Math.floor((Date.now() - past) / 1000))
  if (seconds < 60) return 'now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 4) return `${weeks}w ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(days / 365)}y ago`
}
