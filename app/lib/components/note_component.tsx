"use client";
import React, { useState, useEffect } from "react";
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Input } from "@/components/ui/input";
import { Note } from "@/app/types";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

type NoteEditorProps = {
  note?: Note;
};

export default function NoteEditor({ note }: NoteEditorProps) {
  const [title, setTitle] = useState(note?.title || '');
  const editor = useEditor({
    extensions: [StarterKit],
    content: note?.text || '<p>Type your text...</p>',
  });

  useEffect(() => {
    if (note && editor) {
      setTitle(note.title);
      editor.commands.setContent(note.text);
    }
  }, [note, editor]);

  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(event.target.value);
  };

  if (!editor) {
    return null; // or a loading indicator
  }

  return (
    <div className="flex flex-col h-screen">
      <Input
        value={title}
        onChange={handleTitleChange}
        placeholder="Title"
        className="m-4"
      />
      <div className="flex justify-center space-x-2 p-2">
      <ToggleGroup type="single" aria-label="Text formatting">
    <ToggleGroupItem
      value="bold"
      onClick={() => editor.chain().focus().toggleBold().run()}
      aria-label="Bold"
      className="btn"
    >
      Bold
    </ToggleGroupItem>
    <ToggleGroupItem
      value="italic"
      onClick={() => editor.chain().focus().toggleItalic().run()}
      aria-label="Italic"
      className="btn"
    >
      Italic
    </ToggleGroupItem>
    <ToggleGroupItem
      value="underline"
      onClick={() => editor.chain().focus().toggleUnderline().run()}
      aria-label="Underline"
      className="btn"
    >
      Underline
    </ToggleGroupItem>
  </ToggleGroup>
      </div>
      <main className="flex-grow p-6">
        <div className="overflow-auto">
          <div className="mt-2 border border-black p-4 rounded-lg bg-white">
            <EditorContent editor={editor} />
          </div>
        </div>
      </main>
    </div>
  );
}