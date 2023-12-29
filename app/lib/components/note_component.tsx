"use client";
import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Note } from "@/app/types";
import TimePicker from "./time_picker";
import {
  LinkBubbleMenu,
  RichTextEditor,
  type RichTextEditorRef,
} from "mui-tiptap";
import TagManager from "./tag_manager";
import LocationPicker from "./location_component";
import AudioPicker from "./audio_component";
import { AudioType } from "../models/media_class";
import EditorMenuControls from "./editor_menu_controls";
import useExtensions from "../utils/use_extensions";

type NoteEditorProps = {
  note?: Note;
};

export default function NoteEditor({ note: initialNote }: NoteEditorProps) {
  const [note, setNote] = useState<Note | undefined>(initialNote);
  const [editorContent, setEditorContent] = useState<string>(note?.text || '');
  const [title, setTitle] = useState<string>(note?.title || "");
  const [images, setImages] = useState<any[]>(note?.media || []);
  const [time, setTime] = useState<Date>(note?.time || new Date());
  const [audio, setAudio] = useState<AudioType[]>(note?.audio || []);
  const [counter, setCounter] = useState(0);
  const [longitude, setLongitude] = useState<string>(note?.longitude || "");
  const [latitude, setLatitude] = useState<string>(note?.latitude || "");
  const [tags, setTags] = useState<any[]>(note?.tags || []);
  const rteRef = useRef<RichTextEditorRef>(null);
  const extensions = useExtensions({
    placeholder: "Add your own content here...",
  });

  useEffect(() => {
    if (initialNote) {
      setNote(initialNote);
      setEditorContent(initialNote.text || '');
      setTitle(initialNote.title || '');
      setImages(initialNote.media || []);
      setTime(initialNote.time || new Date());
      setLongitude(initialNote.longitude || '');
      setLatitude(initialNote.latitude || '');
      setTags(initialNote.tags || []);
      setAudio(initialNote.audio || []);
    }
  }, [initialNote]);

  const handleEditorChange = (content: string) => {
    setEditorContent(content); // Update local state immediately for editor responsiveness
  };

  // Call this when you're ready to update the note object, e.g., on blur or save
  const updateNoteText = () => {
    setNote((prevNote: any) => ({
      ...prevNote,
      text: editorContent,
    }));
  };
  

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setImages(note.media);
      setTime(note.time);
      setLongitude(note.longitude);
      setLatitude(note.latitude);
      setTags(note.tags);
      setAudio(note.audio);
      setCounter(counter + 1);
    }
  }, [note]);

  useEffect(() => {
    if (initialNote) {
      setNote(initialNote);
    }
  }, [initialNote]);

  const printNote = () => {
    console.log("Current note object:", note);
  };

  useEffect(() => {
    if (rteRef.current?.editor) {
      const currentContent = rteRef.current.editor.getHTML();
      if (note?.text && currentContent !== note.text) {
        rteRef.current.editor.commands.setContent(note.text);
      } else if (!note?.text && currentContent !== "<p>Type your text...</p>") {
        rteRef.current.editor.commands.setContent("<p>Type your text...</p>");
      }
    }
  }, [note?.text]);
  

  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNote((prevNote: any) => ({
      ...prevNote,
      title: event.target.value
    }));
  };

  const handleLocationChange = (newLongitude: number, newLatitude: number) => {
    setNote((prevNote: any) => ({
      ...prevNote,
      longitude: newLongitude.toString(),
      latitude: newLatitude.toString(),
    }));
  };
  
  const handleTimeChange = (newDate: Date) => {
    setNote((prevNote: any) => ({
      ...prevNote,
      time: newDate,
    }));
  };
  

  return (
    console.log("Body text: ", note?.text),
    (
      <div className="flex flex-col h-screen" key={counter}>
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
            marginLeft: "1.75rem"
          }}
        />
        <main className="flex-grow p-6">
          <div className="mt-3">
            <AudioPicker audioArray={audio || []} setAudio={setAudio} />
          </div>
          <div className="mt-3">
            <TimePicker initialDate={time || new Date()} onTimeChange = {handleTimeChange} />
          </div>
          <div className="mt-3">
            <LocationPicker long={longitude} lat={latitude} onLocationChange={handleLocationChange} />
          </div>
          <div className="mt-3 mb-3">
            <TagManager inputTags={tags} />
          </div>
          <div className="overflow-auto">
            <RichTextEditor
              ref={rteRef}
              extensions= {extensions}
              content={editorContent}
              onUpdate={({ editor }) => handleEditorChange(editor.getHTML())}
              onBlur={updateNoteText} 
              renderControls={() => <EditorMenuControls />}
              children={(editor) => {
                // Make sure to check if the editor is not null
                if (!editor) return null;

                return (
                  <LinkBubbleMenu editor={editor}>
                    {/* This is where you can add additional elements that should appear in the bubble menu */}
                    {/* For example, you could include a button or form here to update the link */}
                  </LinkBubbleMenu>
                ); 
              }}
            />
          </div>
          <button
          onClick={printNote}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Print Note to Console
        </button>
        </main>
      </div>
    )
  );
}
