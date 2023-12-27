"use client";
import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Note } from "@/app/types";
import TimePicker from "./time_picker";
import {
  MenuButtonBold,
  MenuButtonItalic,
  MenuControlsContainer,
  MenuDivider,
  MenuButtonEditLink,
  MenuSelectHeading,
  MenuButtonUnderline,
  MenuButtonBulletedList,
  MenuButtonAlignLeft,
  MenuButtonAlignRight,
  MenuButtonEditLinkProps,
  LinkBubbleMenu,
  LinkBubbleMenuHandler,
  MenuButtonAlignCenter,
  RichTextEditor,
  type RichTextEditorRef,
} from "mui-tiptap";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import BulletList from "@tiptap/extension-bullet-list";
import ListItem from "@tiptap/extension-list-item";
import OrderedList from "@tiptap/extension-ordered-list";
import TagManager from "./tag_manager";
import LocationPicker from "./location_component";
import AudioPicker from "./audio_component";

type NoteEditorProps = {
  note?: Note;
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
          <AudioPicker/>
          <TimePicker initialDate={time || new Date()} />
          <LocationPicker long={longitude} lat={latitude} />
          <TagManager inputTags={tags} />
          <div className="overflow-auto">
            <RichTextEditor
              ref={rteRef}
              extensions={[
                StarterKit,
                Link,
                LinkBubbleMenuHandler,
                TextAlign.configure({
                  types: ["heading", "paragraph"],
                }),
                Underline,
                BulletList,
                ListItem,
                OrderedList,
              ]}
              content={"<p>Type your text...</p>"}
              renderControls={() => (
                <MenuControlsContainer>
                  <MenuSelectHeading />
                  <MenuDivider />
                  <MenuButtonBold />
                  <MenuButtonItalic />
                  <MenuButtonUnderline />
                  <MenuButtonEditLink />
                  <MenuButtonBulletedList />
                  <MenuButtonAlignLeft />
                  <MenuButtonAlignCenter />
                  <MenuButtonAlignRight />
                </MenuControlsContainer>
              )}
            />
          </div>
        </main>
      </div>
    )
  );
}
