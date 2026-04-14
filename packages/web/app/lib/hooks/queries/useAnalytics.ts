import { useQuery } from '@tanstack/react-query';
import {
  getAnalyticsSummary,
  getAnalyticsTimeseries,
} from '@/app/lib/services/admin.service';

// Query key factory for analytics
export const analyticsKeys = {
  all: ['analytics'] as const,
  summary: () => [...analyticsKeys.all, 'summary'] as const,
  summaryByDays: (days: number) => [...analyticsKeys.summary(), days] as const,
  timeseries: () => [...analyticsKeys.all, 'timeseries'] as const,
  timeseriesByDays: (days: number) => [...analyticsKeys.timeseries(), days] as const,
};

/**
 * Hook for fetching analytics summary data
 */
export function useAnalyticsSummary(days = 30) {
  return useQuery({
    queryKey: analyticsKeys.summaryByDays(days),
    queryFn: () => getAnalyticsSummary(days),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook for fetching analytics timeseries data
 */
export function useAnalyticsTimeseries(days = 30) {
  return useQuery({
    queryKey: analyticsKeys.timeseriesByDays(days),
    queryFn: () => getAnalyticsTimeseries(days),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
