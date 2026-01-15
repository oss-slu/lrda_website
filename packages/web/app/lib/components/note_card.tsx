import React from 'react';
import { Note } from '@/app/types';
import { useCreatorName } from '../hooks/queries/useUsers';
import { Calendar, User, ImageIcon } from 'lucide-react';
import CompactCarousel from './compact_carousel';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface NoteCardProps {
  note: Note;
  isActive?: boolean;
}

// Format date as "Jan 15, 2024"
function formatShortDate(date: Date | undefined): string {
  if (!date || isNaN(date.getTime())) return 'No date';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// Safely extract tag labels (handles both string and object tags)
function getTagLabels(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];
  return tags
    .map(tag => {
      if (typeof tag === 'string') return tag;
      if (tag && typeof tag === 'object' && 'label' in tag) return String(tag.label);
      return null;
    })
    .filter((label): label is string => label !== null && label.length > 0);
}

const NoteCard: React.FC<NoteCardProps> = ({ note, isActive = false }) => {
  const title = note.title;
  const tags = getTagLabels(note.tags);
  const { data: creator, isPending: isCreatorLoading } = useCreatorName(note.creator);
  const noteDate = note.time ? new Date(note.time) : undefined;

  return (
    <Card
      className={`overflow-hidden bg-card transition-all duration-200 hover:shadow-md ${
        isActive ? 'ring-2 ring-primary ring-offset-2' : 'hover:ring-1 hover:ring-border'
      }`}
      data-testid='note-card'
    >
      {/* Media section */}
      {note.media.length > 0 ?
        <div className='aspect-[4/3] overflow-hidden'>
          <CompactCarousel mediaArray={note.media} />
        </div>
      : <div className='flex aspect-[4/3] w-full items-center justify-center bg-muted/50'>
          <ImageIcon
            aria-label='No photo present'
            className='text-muted-foreground/50'
            size={48}
            strokeWidth={1.5}
          />
        </div>
      }

      <CardContent className='p-3'>
        {/* Title */}
        <h3 className='mb-2 line-clamp-2 text-sm font-medium leading-tight text-foreground'>
          {title}
        </h3>

        {/* Metadata - stacked */}
        <div className='space-y-1 text-xs text-muted-foreground'>
          <div className='flex items-center gap-1.5'>
            <User className='h-3 w-3 flex-shrink-0' />
            <span className='truncate'>
              {isCreatorLoading ? '...' : (creator ?? 'Unknown')}
            </span>
          </div>
          <div className='flex items-center gap-1.5'>
            <Calendar className='h-3 w-3 flex-shrink-0' />
            <span>{formatShortDate(noteDate)}</span>
          </div>
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className='mt-2 flex flex-wrap gap-1'>
            {tags.slice(0, 3).map((tag, index) => (
              <Badge
                key={index}
                variant='secondary'
                className='h-5 px-1.5 text-[10px] font-normal'
              >
                {tag}
              </Badge>
            ))}
            {tags.length > 3 && (
              <Badge variant='outline' className='h-5 px-1.5 text-[10px] font-normal'>
                +{tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NoteCard;
