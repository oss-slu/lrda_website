import React from 'react';
import { Note, Tag } from '@/app/types';
import { notesService } from '@/app/lib/services';
import { toast } from 'sonner';
import type { NoteStateType, NoteHandlersType } from '../hooks/useNoteState';

export const handleTitleChange = (
  setTitle: React.Dispatch<React.SetStateAction<string>>,
  event: React.ChangeEvent<HTMLInputElement>,
) => {
  setTitle(event.target.value);
};

export const handleLocationChange = (
  setLongitude: React.Dispatch<React.SetStateAction<string>>,
  setLatitude: React.Dispatch<React.SetStateAction<string>>,
  newLongitude: number,
  newLatitude: number,
) => {
  setLatitude(newLatitude.toString());
  setLongitude(newLongitude.toString());
};

export const handleTimeChange = (
  setTime: React.Dispatch<React.SetStateAction<Date>>,
  newDate: Date,
) => {
  setTime(newDate);
};

export const handlePublishChange = async (
  noteState: NoteStateType,
  noteHandlers: NoteHandlersType,
) => {
  if (!noteState.note) {
    console.error('No note found.');
    return;
  }

  const updatedNote = {
    ...noteState.note,
    text: noteState.editorContent,
    title: noteState.title,
    media: [...noteState.images, ...noteState.videos],
    time: noteState.time,
    longitude: noteState.longitude,
    latitude: noteState.latitude,
    tags: noteState.tags,
    audio: noteState.audio,
    id: noteState.note?.id || '',
    published: !noteState.isPublished,
  };

  try {
    await notesService.update(updatedNote);
    noteHandlers.setIsPublished(updatedNote.published);
    noteHandlers.setNote(updatedNote);

    toast(updatedNote.published ? 'Note Published' : 'Note Unpublished', {
      description:
        updatedNote.published ?
          'Your note has been published successfully.'
        : 'Your note has been unpublished successfully.',
      duration: 4000,
    });

    noteHandlers.setCounter(prevCounter => prevCounter + 1);
  } catch (error) {
    console.error('Error updating publish state:', error);
    toast('Error', {
      description: 'Failed to update publish state. Try again later.',
      duration: 4000,
    });
  }
};

export const handleTagsChange = (
  setTags: React.Dispatch<React.SetStateAction<Tag[]>>,
  newTags: (Tag | string)[],
) => {
  const formattedTags = newTags.map(tag =>
    typeof tag === 'string' ? { label: tag, origin: 'user' as const } : tag,
  );
  setTags(formattedTags);
};

export const handleEditorChange = (
  setEditorContent: React.Dispatch<React.SetStateAction<string>>,
  content: string,
) => {
  setEditorContent(content);
};

export const handleDeleteNote = async (
  note: Note | undefined,
  setNote: React.Dispatch<React.SetStateAction<Note | undefined>>,
) => {
  if (!note) {
    toast('Error', {
      description: 'No note selected to archive.',
      duration: 4000,
    });
    return false;
  }

  if (!note.id || note.id === '') {
    console.log('Note ID is missing or empty:', note);
    toast('Error', {
      description: "This note hasn't been saved yet. Please wait a moment and try again.",
      duration: 4000,
    });
    return false;
  }

  try {
    const updatedNote = {
      ...note,
      isArchived: true,
      published: false,
      archivedAt: new Date().toISOString(),
    };

    await notesService.update(updatedNote);

    toast('Success', {
      description: 'Note successfully archived.',
      duration: 4000,
    });
    setNote(undefined);
    return true;
  } catch (error) {
    toast('Error', {
      description: 'Failed to archive note. Please try again.',
      duration: 4000,
    });
    console.error('Error archiving note:', error);
    return false;
  }
};
