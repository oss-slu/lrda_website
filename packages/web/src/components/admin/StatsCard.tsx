import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  loading: boolean;
  highlight?: boolean;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  loading,
  highlight = false,
}: StatsCardProps) {
  return (
    <Card className={`min-w-0 ${highlight ? 'border-orange-200 bg-orange-50' : ''}`}>
      <CardContent className='pt-6'>
        <div className='flex items-center justify-between gap-4'>
          <div className='min-w-0 flex-1'>
            <p className='text-sm font-medium text-gray-500'>{title}</p>
            {loading ?
              <Skeleton className='mt-1 h-8 w-16' />
            : <p
                className={`truncate text-2xl font-bold ${highlight ? 'text-orange-600' : 'text-gray-900'}`}
                title={String(value)}
              >
                {value}
              </p>
            }
          </div>
          <div className={`shrink-0 rounded-full p-3 ${highlight ? 'bg-orange-100' : 'bg-gray-100'}`}>
            <Icon className={`h-5 w-5 ${highlight ? 'text-orange-600' : 'text-gray-600'}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
