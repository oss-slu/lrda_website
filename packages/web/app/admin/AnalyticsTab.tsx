import { useState } from 'react';
import { useAnalyticsSummary, useAnalyticsTimeseries } from '@/app/lib/hooks/queries/useAnalytics';
import { StatsCard } from './StatsCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Eye, Users, FileText, Link as LinkIcon, Globe, Smartphone, Monitor } from 'lucide-react';

export function AnalyticsTab() {
  const [days, setDays] = useState(30);
  const summary = useAnalyticsSummary(days);
  const timeseries = useAnalyticsTimeseries(days);

  const isLoading = summary.isLoading || timeseries.isLoading;
  const hasError = summary.isError || timeseries.isError;

  if (hasError) {
    return (
      <div className='rounded-lg border border-red-200 bg-red-50 p-6'>
        <p className='text-red-800'>Failed to load analytics data. Please try again later.</p>
      </div>
    );
  }

  const topPage = summary.data?.topPages?.[0];
  const topReferrer = summary.data?.topReferrers?.[0];

  return (
    <div className='space-y-6'>
      {/* Time Range Selector */}
      <div className='flex gap-2'>
        {[7, 30, 90].map(d => (
          <Button
            key={d}
            variant={days === d ? 'default' : 'outline'}
            size='sm'
            onClick={() => setDays(d)}
          >
            {d}d
          </Button>
        ))}
      </div>

      {/* Overview Cards */}
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <StatsCard
          title='Page Views'
          value={summary.data?.totalViews || 0}
          icon={Eye}
          loading={isLoading}
        />
        <StatsCard
          title='Visitor-Days'
          value={summary.data?.uniqueVisitors || 0}
          icon={Users}
          loading={isLoading}
        />
        <StatsCard
          title='Top Page'
          value={topPage?.title || topPage?.path || '—'}
          icon={FileText}
          loading={isLoading}
        />
        <StatsCard
          title='Top Referrer'
          value={topReferrer?.referrer || '—'}
          icon={LinkIcon}
          loading={isLoading}
        />
      </div>

      {/* Views Over Time Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Views Over Time</CardTitle>
          <CardDescription>Page views and unique visitors per day</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ?
            <Skeleton className='h-80 w-full' />
          : timeseries.data && timeseries.data.length > 0 ?
            <ResponsiveContainer width='100%' height={300}>
              <LineChart data={timeseries.data}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='date' />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type='monotone'
                  dataKey='views'
                  stroke='#3b82f6'
                  name='Page Views'
                  dot={false}
                />
                <Line
                  type='monotone'
                  dataKey='visitors'
                  stroke='#10b981'
                  name='Unique Visitors'
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          : <p className='py-8 text-center text-gray-500'>No data available</p>}
        </CardContent>
      </Card>

      {/* Top Pages and Referrers */}
      <div className='grid gap-6 lg:grid-cols-2'>
        {/* Top Pages */}
        <Card>
          <CardHeader>
            <CardTitle>Top Pages</CardTitle>
            <CardDescription>Most visited pages</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ?
              <div className='space-y-2'>
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className='h-10 w-full' />
                ))}
              </div>
            : summary.data?.topPages && summary.data.topPages.length > 0 ?
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Page</TableHead>
                    <TableHead className='text-right'>Views</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.data.topPages.map((page, i) => (
                    <TableRow key={i}>
                      <TableCell className='truncate'>
                        <div>
                          <p className='font-medium'>{page.title || page.path}</p>
                          {page.title && <p className='text-xs text-gray-500'>{page.path}</p>}
                        </div>
                      </TableCell>
                      <TableCell className='text-right'>{page.views}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            : <p className='py-4 text-center text-gray-500'>No data</p>}
          </CardContent>
        </Card>

        {/* Top Referrers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Referrers</CardTitle>
            <CardDescription>Where visitors come from</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ?
              <div className='space-y-2'>
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className='h-10 w-full' />
                ))}
              </div>
            : summary.data?.topReferrers && summary.data.topReferrers.length > 0 ?
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Referrer</TableHead>
                    <TableHead className='text-right'>Views</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.data.topReferrers.map((ref, i) => (
                    <TableRow key={i}>
                      <TableCell className='font-medium'>{ref.referrer || '(direct)'}</TableCell>
                      <TableCell className='text-right'>{ref.views}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            : <p className='py-4 text-center text-gray-500'>No data</p>}
          </CardContent>
        </Card>
      </div>

      {/* UTM Campaigns */}
      <Card>
        <CardHeader>
          <CardTitle>UTM Campaigns</CardTitle>
          <CardDescription>Campaign performance from shared links</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ?
            <div className='space-y-2'>
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className='h-10 w-full' />
              ))}
            </div>
          : summary.data?.topCampaigns && summary.data.topCampaigns.length > 0 ?
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source</TableHead>
                  <TableHead>Medium</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead className='text-right'>Views</TableHead>
                  <TableHead className='text-right'>Visitors</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.data.topCampaigns.map((campaign, i) => (
                  <TableRow key={i}>
                    <TableCell className='font-medium'>{campaign.utmSource || '—'}</TableCell>
                    <TableCell>{campaign.utmMedium || '—'}</TableCell>
                    <TableCell>{campaign.utmCampaign || '—'}</TableCell>
                    <TableCell className='text-right'>{campaign.views}</TableCell>
                    <TableCell className='text-right'>{campaign.visitors}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          : <p className='py-4 text-center text-gray-500'>No campaign data</p>}
        </CardContent>
      </Card>

      {/* Device/Browser/Screen Breakdown Grid */}
      <div className='grid gap-6 lg:grid-cols-2'>
        {/* Browsers */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Monitor className='h-5 w-5' />
              Browsers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ?
              <div className='space-y-2'>
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className='h-8 w-full' />
                ))}
              </div>
            : summary.data?.browsers && summary.data.browsers.length > 0 ?
              <div className='space-y-2'>
                {summary.data.browsers.map((browser, i) => {
                  const total = summary.data!.totalViews;
                  const percentage = total > 0 ? Math.round((browser.views / total) * 100) : 0;
                  return (
                    <div key={i} className='space-y-1'>
                      <div className='flex justify-between text-sm'>
                        <span>{browser.browser || 'Unknown'}</span>
                        <span className='font-medium'>{percentage}%</span>
                      </div>
                      <div className='h-2 w-full overflow-hidden rounded-full bg-gray-200'>
                        <div className='h-full bg-blue-500' style={{ width: `${percentage}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            : <p className='py-4 text-center text-gray-500'>No data</p>}
          </CardContent>
        </Card>

        {/* Devices */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Smartphone className='h-5 w-5' />
              Devices
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ?
              <div className='space-y-2'>
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className='h-8 w-full' />
                ))}
              </div>
            : summary.data?.devices && summary.data.devices.length > 0 ?
              <div className='space-y-2'>
                {summary.data.devices.map((device, i) => {
                  const total = summary.data!.totalViews;
                  const percentage = total > 0 ? Math.round((device.views / total) * 100) : 0;
                  return (
                    <div key={i} className='space-y-1'>
                      <div className='flex justify-between text-sm'>
                        <span className='capitalize'>{device.device || 'Unknown'}</span>
                        <span className='font-medium'>{percentage}%</span>
                      </div>
                      <div className='h-2 w-full overflow-hidden rounded-full bg-gray-200'>
                        <div className='h-full bg-green-500' style={{ width: `${percentage}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            : <p className='py-4 text-center text-gray-500'>No data</p>}
          </CardContent>
        </Card>

        {/* Screen Widths */}
        <Card>
          <CardHeader>
            <CardTitle>Screen Sizes</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ?
              <div className='space-y-2'>
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className='h-8 w-full' />
                ))}
              </div>
            : summary.data?.screenWidths && summary.data.screenWidths.length > 0 ?
              <div className='space-y-2'>
                {summary.data.screenWidths.map((screen, i) => {
                  const total = summary.data!.totalViews;
                  const percentage = total > 0 ? Math.round((screen.views / total) * 100) : 0;
                  const labels: Record<string, string> = {
                    sm: 'Mobile (<640px)',
                    md: 'Tablet (640-1024px)',
                    lg: 'Desktop (1024-1440px)',
                    xl: 'Wide (1440px+)',
                  };
                  return (
                    <div key={i} className='space-y-1'>
                      <div className='flex justify-between text-sm'>
                        <span>{labels[screen.screenWidth || ''] || screen.screenWidth}</span>
                        <span className='font-medium'>{percentage}%</span>
                      </div>
                      <div className='h-2 w-full overflow-hidden rounded-full bg-gray-200'>
                        <div className='h-full bg-purple-500' style={{ width: `${percentage}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            : <p className='py-4 text-center text-gray-500'>No data</p>}
          </CardContent>
        </Card>

        {/* Languages */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Globe className='h-5 w-5' />
              Languages
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ?
              <div className='space-y-2'>
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className='h-8 w-full' />
                ))}
              </div>
            : summary.data?.languages && summary.data.languages.length > 0 ?
              <div className='space-y-2'>
                {summary.data.languages.slice(0, 5).map((lang, i) => {
                  const total = summary.data!.totalViews;
                  const percentage = total > 0 ? Math.round((lang.views / total) * 100) : 0;
                  return (
                    <div key={i} className='space-y-1'>
                      <div className='flex justify-between text-sm'>
                        <span>{lang.language || 'Unknown'}</span>
                        <span className='font-medium'>{percentage}%</span>
                      </div>
                      <div className='h-2 w-full overflow-hidden rounded-full bg-gray-200'>
                        <div className='h-full bg-orange-500' style={{ width: `${percentage}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            : <p className='py-4 text-center text-gray-500'>No data</p>}
          </CardContent>
        </Card>
      </div>

      {/* Operating Systems */}
      <Card>
        <CardHeader>
          <CardTitle>Operating Systems</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ?
            <div className='space-y-2'>
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className='h-8 w-full' />
              ))}
            </div>
          : summary.data?.operatingSystems && summary.data.operatingSystems.length > 0 ?
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
              {summary.data.operatingSystems.map((os, i) => {
                const total = summary.data!.totalViews;
                const percentage = total > 0 ? Math.round((os.views / total) * 100) : 0;
                return (
                  <div key={i} className='rounded-lg border p-3'>
                    <p className='text-sm font-medium'>{os.os || 'Unknown'}</p>
                    <p className='text-2xl font-bold text-gray-900'>{percentage}%</p>
                    <p className='text-xs text-gray-500'>{os.views} views</p>
                  </div>
                );
              })}
            </div>
          : <p className='py-4 text-center text-gray-500'>No data</p>}
        </CardContent>
      </Card>
    </div>
  );
}
