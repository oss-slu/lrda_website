import { useState } from "react";
import { Note, Tag } from "@/app/types";
import { AudioType, VideoType, PhotoType } from "../../models/media_class";

const useNoteState = (initialNote: Note | undefined) => {
  const [note, setNote] = useState<Note | undefined>(initialNote);
  const [editorContent, setEditorContent] = useState<string>(initialNote?.text || "");
  const [title, setTitle] = useState<string>(initialNote?.title || "");
  const initialMedia = initialNote?.media || [];
  const [images, setImages] = useState<PhotoType[]>(initialMedia.filter(item => item.getType() === 'image') as PhotoType[]);
  const [videos, setVideos] = useState<VideoType[]>(initialMedia.filter(item => item.getType() === 'video') as VideoType[]);
  const [time, setTime] = useState<Date>(initialNote?.time || new Date());
  const [audio, setAudio] = useState<AudioType[]>(initialNote?.audio || []);
  const [longitude, setLongitude] = useState<string>(initialNote?.longitude || "");
  const [latitude, setLatitude] = useState<string>(initialNote?.latitude || "");
  const [tags, setTags] = useState<Tag[]>(initialNote?.tags || []); // Update to Tag[]
  const [isPublished, setIsPublished] = useState<boolean>(initialNote?.published || false);
  const [approvalRequested, setApprovalRequested] = useState<boolean>(initialNote?.approvalRequested || false);
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
export type NoteStateType = ReturnType<typeof useNoteState>["noteState"];
export type NoteHandlersType = ReturnType<typeof useNoteState>["noteHandlers"];

