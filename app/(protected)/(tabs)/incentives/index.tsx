import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { RewardsView } from '@/components'
import { bitpointsService } from '@/api'

/**
 * Incentives — the employee's incentive balance + full history.
 *
 * Same design as Bitpoints (shared {@link RewardsView}) and the SAME data source
 * (GET /bitpoints): each row carries both values, so this screen just reads the
 * `incentives` field instead of `cumulative_cash_via_bitpoints`. Live data only.
 */
export default function IncentivesScreen() {
  const query = useQuery({
    queryKey: ['bitpoints'],
    queryFn: ({ signal }) => bitpointsService.getBitpoints(signal),
    retry: false,
  })

  return (
    <RewardsView
      kicker=""
      title="Incentives"
      cardLabel="Total Incentives"
      unit="Incentives"
      icon="gift"
      valueKey="incentives"
      rows={query.data?.bitpoints ?? []}
      isLoading={query.isLoading}
      isError={query.isError}
      onRetry={query.refetch}
      onRefresh={query.refetch}
      refreshing={query.isRefetching}
      errorTitle="Couldn't load Incentives"
      emptyText="No incentives history yet."
    />
  )
}