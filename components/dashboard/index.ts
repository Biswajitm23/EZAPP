/**
 * Dashboard components barrel.
 *   import { DashboardHeader, CategoryTabs, HeroCarousel } from '@/components/dashboard'
 */
export { DashboardHeader } from './DashboardHeader'
export type { DashboardHeaderProps } from './DashboardHeader'

export { CategoryTabs } from './CategoryTabs'
export type { CategoryTabsProps } from './CategoryTabs'

export { HeroCarousel } from './HeroCarousel'
export type { HeroCarouselProps } from './HeroCarousel'

// HeroCard + PaginationDots are used internally by HeroCarousel but are exported
// for reuse. `cardState` is the shared dashboard status helper.
export { HeroCard, cardState } from './HeroCard'
export type { HeroCardProps } from './HeroCard'

export { PaginationDots } from './PaginationDots'
export type { PaginationDotsProps } from './PaginationDots'
