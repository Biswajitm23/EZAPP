import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { RewardsView } from '@/components'
import { bitpointsService } from '@/api'

/**
 * Bitpoints — the employee's Bitpoints balance + full history.
 *
 * Live data from GET /bitpoints (Bearer, newest-first). No static/fallback data.
 * Presentation is the shared {@link RewardsView}; the star icon matches the
 * Bitpoints bottom-nav tab.
 */
export default function BitpointsScreen() {
  const query = useQuery({
    queryKey: ['bitpoints'],
    queryFn: ({ signal }) => bitpointsService.getBitpoints(signal),
    retry: false,
  })

  return (
    <RewardsView
      kicker="Rewards & Recognition"
      title="BitPoints"
      cardLabel="Current Points"
      unit="BitPoints"
      icon="star"
      valueKey="cumulative_cash_via_bitpoints"
      rows={query.data?.bitpoints ?? []}
      isLoading={query.isLoading}
      isError={query.isError}
      onRetry={query.refetch}
      onRefresh={query.refetch}
      refreshing={query.isRefetching}
      errorTitle="Couldn't load Bitpoints"
      emptyText="No Bitpoints history yet."
    />
  )
}