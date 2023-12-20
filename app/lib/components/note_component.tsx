"use client";
import React, { useState, useEffect } from "react";
import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Input } from "@/components/ui/input";
import { Underline } from "@tiptap/extension-underline";
import { Note } from "@/app/types";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import TimePicker from "./time_picker";

type NoteEditorProps = {
  note?: Note;
};

export default function NoteEditor({ note }: NoteEditorProps) {
  const [title, setTitle] = useState(note?.title || "");
  const [images, setImages] = useState<any>();
  const [time, setTime] = useState<Date | undefined>(note?.time);
  const [longitude, setLongitude] = useState<string | undefined>();
  const [latitude, setLatitude] = useState<string | undefined>();

  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: note?.text || "<p>Type your text...</p>",
  });

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setImages(note.media);
      setTime(note.time);
      setLongitude(note.longitude);
      setLatitude(note.latitude);
      if (editor) {
        editor.commands.setContent(note.text);
      }
    }
  }, [note, editor]);

  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(event.target.value);
  };

  return (
    <div className="flex flex-col h-screen">
      <Input
        className="text-3xl font-bold custom-input"
        value={title}
        onChange={handleTitleChange}
        placeholder="Title"
        className="m-4"
      />
      <div className="flex justify-center space-x-2 p-2">
        <ToggleGroup type="multiple" aria-label="Text formatting">
          <ToggleGroupItem
            value="bold"
            onClick={() => editor.chain().focus().toggleBold().run()}
            aria-label="Bold"
            className={editor.isActive("bold") ? "active-btn" : "btn"}
          >
            Bold
          </ToggleGroupItem>
          <ToggleGroupItem
            value="italic"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            aria-label="Italic"
            className={editor.isActive("italic") ? "active-btn" : "btn"}
          >
            Italic
          </ToggleGroupItem>
          <ToggleGroupItem
            value="underline"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            aria-label="Underline"
            className={editor.isActive("underline") ? "active-btn" : "btn"}
          >
            Underline
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      <main className="flex-grow p-6">
        <TimePicker initialDate={time || new Date()} />
        <div className="overflow-auto">
          <div className="mt-2 border border-black p-4 rounded-lg bg-white">
            <EditorContent editor={editor} />
          </div>
        </div>
      </main>
    </div>
  );
}
