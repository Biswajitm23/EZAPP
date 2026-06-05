import React from 'react'
import { PointsView } from '@/components'

/**
 * Bitpoints — monthly Bitpoints balance. Static placeholder data until the API
 * is wired (mirrors the web portal's Bitpoints table).
 */
export default function BitpointsScreen() {
  return (
    <PointsView
      title="Bitpoints"
      rows={[{ month: 'March 2026', balance: '120' }]}
    />
  )
}
