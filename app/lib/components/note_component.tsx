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
import { User } from "../models/user_class";
import ApiService from "../utils/api_service";
import { FileX2, SaveIcon, Save } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const user = User.getInstance();

type NoteEditorProps = {
  note?: Note;
};

export default function NoteEditor({ note: initialNote }: NoteEditorProps) {
  const [note, setNote] = useState<Note | undefined>(initialNote);
  const [editorContent, setEditorContent] = useState<string>(note?.text || "");
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
      setEditorContent(initialNote.text || "");
      setTitle(initialNote.title || "");
      setImages(initialNote.media || []);
      setTime(initialNote.time || new Date());
      setLongitude(initialNote.longitude || "");
      setLatitude(initialNote.latitude || "");
      setTags(initialNote.tags || []);
      setAudio(initialNote.audio || []);
    }
  }, [initialNote]);

  const handleEditorChange = (content: string) => {
    setEditorContent(content);
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

  // useEffect(() => {
  //   if (rteRef.current?.editor) {
  //     const currentContent = rteRef.current.editor.getHTML();
  //     if (note?.text && currentContent !== note.text) {
  //       rteRef.current.editor.commands.setContent(note.text);
  //     } else if (!note?.text && currentContent !== "<p>Type your text...</p>") {
  //       rteRef.current.editor.commands.setContent("<p>Type your text...</p>");
  //     }
  //   }
  // }, [note?.text]);

  // should probably fully delete this function
  const updateNoteTitle = () => {
    // setNote((prevNote: any) => ({
    //   ...prevNote,
    //   title: title,
    // }));
  };

  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(event.target.value);
  };

  const handleLocationChange = (newLongitude: number, newLatitude: number) => {
    // setNote((prevNote: any) => ({
    //   ...prevNote,
    //   longitude: newLongitude.toString(),
    //   latitude: newLatitude.toString(),
    // }));
  };

  const handleTimeChange = (newDate: Date) => {
    // setNote((prevNote: any) => ({
    //   ...prevNote,
    //   time: newDate,
    // }));
  };

  const handleTagsChange = (newTags: string[]) => {
    // setNote((prevNote: any) => ({
    //   ...prevNote,
    //   tags: newTags,
    // }));
  };

  const handleDeleteNote = async () => {
    console.log(note);
    if (note?.id) {
      try {
        const userId = await user.getId();
        const success = await ApiService.deleteNoteFromAPI(
          note!.id,
          userId || ""
        );
        if (success) {
          toast("Error", {
            description: "Note successfully Deleted.",
            duration: 4000,
          });
          return true;
        }
      } catch (error) {
        toast("Error", {
          description:
            "Failed to delete note. System failure. Try again later.",
          duration: 4000,
        });
        console.error("Error deleting note:", error);
        return false;
      }
    } else {
      toast("Error", {
        description: "You must first save your note, before deleting it.",
        duration: 4000,
      });
    }
  };

  return (
    console.log("Body text: ", note?.text),
    (
      <div className="flex flex-col w-[100%]" key={counter}>
        <div className="flex items-center justify-between mr-6">
          <Input
            value={title}
            onChange={handleTitleChange}
            onBlur={updateNoteTitle}
            placeholder="Title"
            style={{
              all: "unset",
              fontSize: "1.5em",
              fontWeight: "bold",
              outline: "none",
              marginLeft: "1.75rem",
              maxWidth: "400px,",
            }}
          />
          <div className="flex w-[220px] bg-popup shadow-sm rounded-md border border-border bg-white pt-2 pb-2 justify-around items-center">
            <button
              className="hover:text-green-500 flex justify-center items-center w-full"
              onClick={() => {
                toast("Demo Note", {
                  description: "You cannot save in Demo Mode.",
                  duration: 2000,
                });
              }}
            >
              <SaveIcon className="text-current" />
              <div className="ml-2">Save</div>
            </button>
            <div className="w-1 h-9 bg-border" />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  className="hover:text-red-500 flex justify-center items-center w-full"
                  onClick={() => {
                    toast("Demo Note", {
                      description: "You cannot delete in Demo Mode.",
                      duration: 2000,
                    });
                  }}
                >
                  <FileX2 className="text-current" />
                  <div className="ml-2">Delete</div>
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    this note.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDeleteNote()}>
                    Continue
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <main className="flex-grow p-6">
          <div className="mt-3">
            <AudioPicker audioArray={audio || []} setAudio={setAudio} />
          </div>
          <div className="mt-3">
            <TimePicker
              initialDate={time || new Date()}
              onTimeChange={handleTimeChange}
            />
          </div>
          <div className="mt-3">
            <LocationPicker long={longitude} lat={latitude} />
          </div>
          <div className="mt-3 mb-3">
            <TagManager inputTags={tags} onTagsChange={handleTagsChange} />
          </div>
          <div className="overflow-auto">
            <RichTextEditor
              ref={rteRef}
              extensions={extensions}
              content={editorContent}
              onUpdate={({ editor }) => handleEditorChange(editor.getHTML())}
              // This needs to get permanently fixed because otherwise when a user clicks off of the editor it breaks
              // onBlur={updateNoteText}
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
          {/* <button
            onClick={printNote}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Print Note to Console
          </button> */}
        </main>
      </div>
    )
  );
}
