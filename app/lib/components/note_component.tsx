"use client";
import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Note, newNote } from "@/app/types";
import TimePicker from "./time_picker";
import {
  LinkBubbleMenu,
  RichTextEditor,
  type RichTextEditorRef,
} from "mui-tiptap";
import TagManager from "./tag_manager";
import LocationPicker from "./location_component";
import EditorMenuControls from "./editor_menu_controls";
import useExtensions from "../utils/use_extensions";

type NoteEditorProps = {
  note?: Note | newNote;
};

export default function NoteEditor({ note }: NoteEditorProps) {
  console.log("Here is my note: ", note);
  const [title, setTitle] = useState(note?.title || "");
  const [images, setImages] = useState(note?.media || []);
  const [time, setTime] = useState(note?.time || new Date());
  const [longitude, setLongitude] = useState(note?.longitude || "");
  const [latitude, setLatitude] = useState(note?.latitude || "");
  const [tags, setTags] = useState(note?.tags || []);
  const rteRef = useRef<RichTextEditorRef>(null);
  const extensions = useExtensions({
    placeholder: "Add your own content here...",
  });

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setImages(note.media);
      setTime(note.time);
      setLongitude(note.longitude);
      setLatitude(note.latitude);
      setTags(note.tags);
    }
  }, [note]);

  useEffect(() => {
    if (rteRef.current?.editor && note?.text) {
      rteRef.current.editor.commands.setContent(note.text);
    } else if (rteRef.current?.editor && !note?.text) {
      rteRef.current.editor.commands.setContent("<p>Type your text...</p>");
    }
  }, [note?.text]);

  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(event.target.value);
  };

  return (
    console.log("Body text: ", note?.text),
    (
      <div className="flex flex-col h-screen">
        <Input
          value={title}
          onChange={handleTitleChange}
          placeholder="Title"
          className="m-4"
          style={{
            all: "unset",
            fontSize: "1.5em",
            fontWeight: "bold",
            outline: "none",
            marginLeft: "1rem"
          }}
        />
        <main className="flex-grow p-6">
          <TimePicker initialDate={time || new Date()} />
          <LocationPicker long={longitude} lat={latitude} />
          <TagManager inputTags={tags} />
          <div className="overflow-auto">
            <RichTextEditor
              ref={rteRef}
              extensions= {extensions}
              content={"<p>Type your text...</p>"}
              renderControls={() => <EditorMenuControls />}
              
            />
          </div>
        </main>
      </div>
    )
  );
}
