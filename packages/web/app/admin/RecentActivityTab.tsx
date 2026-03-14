import type { RecentActivityItem } from '@/app/lib/services';
import { formatDateShort } from '@/app/lib/utils/data_conversion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FileText } from 'lucide-react';

interface RecentActivityTabProps {
  activity: RecentActivityItem[];
  loading: boolean;
}

export function RecentActivityTab({ activity, loading }: RecentActivityTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest note activity across all users</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ?
          <div className='space-y-3'>
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className='h-12 w-full' />
            ))}
          </div>
        : activity.length === 0 ?
          <div className='flex flex-col items-center justify-center py-12 text-center'>
            <FileText className='mb-4 h-12 w-12 text-gray-300' />
            <h3 className='text-lg font-medium text-gray-900'>No recent activity</h3>
            <p className='mt-1 text-sm text-gray-500'>
              Notes will appear here as users create and edit them.
            </p>
          </div>
        : <div className='rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Creator</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activity.map(item => (
                  <TableRow key={item.noteId}>
                    <TableCell className='font-medium'>
                      {item.title || '(Untitled)'}
                    </TableCell>
                    <TableCell className='text-gray-500'>{item.creatorName}</TableCell>
                    <TableCell>
                      {item.isPublished ?
                        <Badge variant='default' className='bg-green-600 text-xs'>
                          Published
                        </Badge>
                      : <Badge variant='secondary' className='text-xs'>
                          Draft
                        </Badge>
                      }
                    </TableCell>
                    <TableCell className='text-gray-500'>
                      {formatDateShort(item.createdAt)}
                    </TableCell>
                    <TableCell className='text-gray-500'>
                      {formatDateShort(item.updatedAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        }
      </CardContent>
    </Card>
  );
}
