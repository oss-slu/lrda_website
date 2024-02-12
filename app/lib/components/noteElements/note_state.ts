import { useState } from "react";
import { Note } from "@/app/types";
import { AudioType } from "../../models/media_class";

const useNoteState = (initialNote: Note | undefined) => {
  const [note, setNote] = useState<Note | undefined>(initialNote);
  const [editorContent, setEditorContent] = useState<string>(
    initialNote?.text || ""
  );
  const [title, setTitle] = useState<string>(initialNote?.title || "");
  const [images, setImages] = useState<any[]>(initialNote?.media || []);
  const [time, setTime] = useState<Date>(initialNote?.time || new Date());
  const [audio, setAudio] = useState<AudioType[]>(initialNote?.audio || []);
  const [longitude, setLongitude] = useState<string>(
    initialNote?.longitude || ""
  );
  const [latitude, setLatitude] = useState<string>(initialNote?.latitude || "");
  const [tags, setTags] = useState<string[]>(initialNote?.tags || []);
  const [isPublished, setIsPublished] = useState<boolean>(initialNote?.published || false);
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
      setIsPublished,
      setCounter,
    },
  };
};

export default useNoteState;
