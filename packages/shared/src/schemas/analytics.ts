import { z } from 'zod';

export const PageViewTrackingSchema = z.object({
  path: z.string().max(500),
  pageTitle: z.string().max(200).nullish(),
  referrer: z.string().max(500).nullish(),
  utmSource: z.string().max(100).nullish(),
  utmMedium: z.string().max(100).nullish(),
  utmCampaign: z.string().max(200).nullish(),
  screenWidth: z.enum(['sm', 'md', 'lg', 'xl']).nullish(),
  language: z.string().max(10).nullish(),
});

export const TimeSeriesDataSchema = z.object({
  date: z.string(),
  views: z.number(),
  visitors: z.number(),
});

export const TopPageSchema = z.object({
  path: z.string(),
  title: z.string().nullable(),
  views: z.number(),
  visitors: z.number(),
});

export const ReferrerSchema = z.object({
  referrer: z.string(),
  views: z.number(),
});

export const UtmCampaignSchema = z.object({
  utmSource: z.string().nullable(),
  utmMedium: z.string().nullable(),
  utmCampaign: z.string().nullable(),
  views: z.number(),
  visitors: z.number(),
});

export const ScreenWidthBreakdownSchema = z.object({
  screenWidth: z.string().nullable(),
  views: z.number(),
});

export const LanguageBreakdownSchema = z.object({
  language: z.string().nullable(),
  views: z.number(),
});

export const BrowserBreakdownSchema = z.object({
  browser: z.string().nullable(),
  views: z.number(),
});

export const OsBreakdownSchema = z.object({
  os: z.string().nullable(),
  views: z.number(),
});

export const DeviceBreakdownSchema = z.object({
  device: z.string().nullable(),
  views: z.number(),
});

export const AnalyticsSummarySchema = z.object({
  totalViews: z.number(),
  uniqueVisitors: z.number(),
  topPages: z.array(TopPageSchema),
  topReferrers: z.array(ReferrerSchema),
  topCampaigns: z.array(UtmCampaignSchema),
  browsers: z.array(BrowserBreakdownSchema),
  devices: z.array(DeviceBreakdownSchema),
  screenWidths: z.array(ScreenWidthBreakdownSchema),
  languages: z.array(LanguageBreakdownSchema),
  operatingSystems: z.array(OsBreakdownSchema),
});

export const AnalyticsTimeSeriesSchema = z.array(TimeSeriesDataSchema);
