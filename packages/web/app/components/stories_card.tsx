/**
 * EnhancedClickableNote Component
 *
 * Composes the card preview and detail dialog into a single interactive component.
 * This is the main export that replaces the previous monolithic implementation.
 */

import React from 'react';
import { Note } from '@/app/types';
import { StoriesCardPreview } from './stories/StoriesCardPreview';
import { StoryDetailDialog } from './stories/StoryDetailDialog';

interface EnhancedClickableNoteProps {
  note: Note;
}

const EnhancedClickableNote: React.FC<EnhancedClickableNoteProps> = ({ note }) => {
  return (
    <StoryDetailDialog note={note}>
      <StoriesCardPreview note={note} />
    </StoryDetailDialog>
  );
};

export default EnhancedClickableNote;
