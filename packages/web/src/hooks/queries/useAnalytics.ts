import { useQuery, queryOptions } from '@tanstack/react-query';
import { getAnalyticsSummary, getAnalyticsTimeseries } from '@/services/admin.service';

export function analyticsSummaryOptions(days = 30) {
  return queryOptions({
    queryKey: ['analytics', 'summary', days],
    queryFn: () => getAnalyticsSummary(days),
    staleTime: 1000 * 60 * 5,
  });
}

export function useAnalyticsSummary(days = 30) {
  return useQuery(analyticsSummaryOptions(days));
}

export function analyticsTimeseriesOptions(days = 30) {
  return queryOptions({
    queryKey: ['analytics', 'timeseries', days],
    queryFn: () => getAnalyticsTimeseries(days),
    staleTime: 1000 * 60 * 5,
  });
}

export function useAnalyticsTimeseries(days = 30) {
  return useQuery(analyticsTimeseriesOptions(days));
}
