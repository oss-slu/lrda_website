import { useQuery, queryOptions } from '@tanstack/react-query';
import {
  getAnalyticsSummary,
  getAnalyticsTimeseries,
} from '@/app/services/admin.service';

// Query key factory for analytics
export const analyticsKeys = {
  all: ['analytics'] as const,
  summary: () => [...analyticsKeys.all, 'summary'] as const,
  summaryByDays: (days: number) => [...analyticsKeys.summary(), days] as const,
  timeseries: () => [...analyticsKeys.all, 'timeseries'] as const,
  timeseriesByDays: (days: number) => [...analyticsKeys.timeseries(), days] as const,
};

/**
 * Query options for analytics summary data.
 */
export function analyticsSummaryOptions(days = 30) {
  return queryOptions({
    queryKey: analyticsKeys.summaryByDays(days),
    queryFn: () => getAnalyticsSummary(days),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook for fetching analytics summary data
 */
export function useAnalyticsSummary(days = 30) {
  return useQuery(analyticsSummaryOptions(days));
}

/**
 * Query options for analytics timeseries data.
 */
export function analyticsTimeseriesOptions(days = 30) {
  return queryOptions({
    queryKey: analyticsKeys.timeseriesByDays(days),
    queryFn: () => getAnalyticsTimeseries(days),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook for fetching analytics timeseries data
 */
export function useAnalyticsTimeseries(days = 30) {
  return useQuery(analyticsTimeseriesOptions(days));
}
