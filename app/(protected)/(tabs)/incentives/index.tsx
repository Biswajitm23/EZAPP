import React from 'react'
import { PointsView } from '@/components'

/**
 * Incentives — "Sum Of Total Cash" monthly incentive balance. Static
 * placeholder data until the API is wired (mirrors the web portal).
 */
export default function IncentivesScreen() {
  return (
    <PointsView
      title="Sum Of Total Cash"
      rows={[{ month: 'March 2026', balance: '300' }]}
    />
  )
}
