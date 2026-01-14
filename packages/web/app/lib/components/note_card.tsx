import React, { useState } from 'react';
import { Note } from '@/app/types';
import { useCreatorName } from '../hooks/queries/useUsers';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Calendar as CalendarIcon, TagsIcon, User2Icon, ImageIcon } from 'lucide-react';
import CompactCarousel from './compact_carousel';
import { formatDateTime } from '../utils/data_conversion';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface NoteCardProps {
  note: Note;
}

const NoteCard: React.FC<NoteCardProps> = ({ note }) => {
  const title = note.title;
  const tags: string[] = (note.tags || []).map(tag => tag.label); // Ensure correct mapping to labels
  const { data: creator, isPending: isCreatorLoading } = useCreatorName(note.creator);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    note.time ? new Date(note.time) : undefined,
  );

  return (
    <div
      className='flex h-[300px] w-64 flex-col rounded-sm border border-gray-200 bg-white shadow'
      data-testid='note-card'
    >
      {note.media.length > 0 ?
        <CompactCarousel mediaArray={note.media}></CompactCarousel>
      : <div className='flex h-[180px] w-auto items-center justify-center bg-gray-100'>
          <ImageIcon
            aria-label='No photo present'
            className='text-gray-400'
            size={72}
            strokeWidth={1}
          />
        </div>
      }
      <div className='flex h-[118px] flex-col px-2'>
        <div className='w-full'>
          <h3
            className='overflow-x-auto truncate whitespace-nowrap text-xl font-bold text-gray-900'
            style={{ maxWidth: '100%' }}
          >
            {title}
          </h3>
        </div>
        <div className='flex h-[100px] flex-col justify-evenly'>
          <div className='flex flex-row items-center align-middle'>
            <User2Icon className='mr-2' size={15} />
            <p className='truncate text-[15px] text-gray-500'>
              {isCreatorLoading ? 'Loading...' : (creator ?? 'Unknown')}
            </p>
          </div>
          {/* Interactive Calendar with formatted display */}
          <div className='flex flex-row items-center'>
            <CalendarIcon className='mr-2' size={15} />
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    'rounded-md border border-gray-200 bg-white px-2 py-1 text-left text-sm font-normal text-gray-700 hover:bg-gray-50',
                    !selectedDate && 'text-muted-foreground',
                  )}
                >
                  {formatDateTime(selectedDate)}
                </button>
              </PopoverTrigger>
              <PopoverContent className='w-auto p-0' align='start'>
                <Calendar
                  mode='single'
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          {tags.length > 0 && (
            <div className='flex items-center'>
              <div className='mr-2 flex h-[15px] w-[15px] items-center justify-center rounded-full'>
                <TagsIcon size={15} />
              </div>
              <div className='flex h-5 items-center overflow-hidden'>
                <ScrollArea className='mb-1 flex flex-nowrap self-center overflow-clip align-middle'>
                  {tags.map((tag, index) => (
                    <span
                      key={index}
                      className='mr-1 whitespace-nowrap rounded-full bg-blue-100 px-2 text-xs font-medium text-blue-800'
                    >
                      {tag}
                    </span>
                  ))}
                  <ScrollBar orientation='horizontal' className='h-[5px]' />
                </ScrollArea>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NoteCard;
