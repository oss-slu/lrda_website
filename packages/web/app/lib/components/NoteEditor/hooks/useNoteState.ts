import { useState } from 'react';
import { Note, Tag } from '@/app/types';
import type { AudioMedia, VideoMedia, PhotoMedia } from '@/app/types';

const useNoteState = (initialNote: Note | undefined) => {
  const [note, setNote] = useState<Note | undefined>(initialNote);
  const [editorContent, setEditorContent] = useState<string>(initialNote?.text || '');
  const [title, setTitle] = useState<string>(initialNote?.title || '');
  const initialMedia = initialNote?.media || [];
  const [images, setImages] = useState<PhotoMedia[]>(
    initialMedia.filter((item): item is PhotoMedia => item.type === 'image'),
  );
  const [videos, setVideos] = useState<VideoMedia[]>(
    initialMedia.filter((item): item is VideoMedia => item.type === 'video'),
  );
  const [time, setTime] = useState<Date>(initialNote?.time || new Date());
  const [audio, setAudio] = useState<AudioMedia[]>(initialNote?.audio || []);
  const [longitude, setLongitude] = useState<number | null>(initialNote?.longitude ?? null);
  const [latitude, setLatitude] = useState<number | null>(initialNote?.latitude ?? null);
  const [tags, setTags] = useState<Tag[]>(initialNote?.tags || []);
  const [isPublished, setIsPublished] = useState<boolean>(initialNote?.published || false);
  const [approvalRequested, setApprovalRequested] = useState<boolean>(
    initialNote?.approvalRequested || false,
  );
  const [counter, setCounter] = useState<number>(0);

  return {
    noteState: {
      note,
      editorContent,
      title,
      images,
      time,
      audio,
      longitude,
      latitude,
      tags,
      isPublished,
      approvalRequested,
      videos,
      counter,
    },
    noteHandlers: {
      setNote,
      setEditorContent,
      setTitle,
      setImages,
      setTime,
      setAudio,
      setLongitude,
      setLatitude,
      setTags,
      setVideos,
      setIsPublished,
      setApprovalRequested,
      setCounter,
    },
  };
};

export default useNoteState;
export type NoteStateType = ReturnType<typeof useNoteState>['noteState'];
export type NoteHandlersType = ReturnType<typeof useNoteState>['noteHandlers'];
