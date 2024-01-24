"use client";
import React, { useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Note } from "@/app/types";
import TimePicker from "./time_picker";
import {
  LinkBubbleMenu,
  MenuButtonEditLink,
  RichTextEditor,
  type RichTextEditorRef,
} from "mui-tiptap";
import TagManager from "./tag_manager";
import LocationPicker from "./location_component";
import AudioPicker from "./audio_component";
import EditorMenuControls from "../editor_menu_controls";
import useExtensions from "../../utils/use_extensions";
import { User } from "../../models/user_class";
import ApiService from "../../utils/api_service";
import { FileX2, SaveIcon } from "lucide-react";
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
import useNoteState from "./note_state";
import { toast } from "sonner";
import {
  handleTitleChange,
  handleDeleteNote,
  handleEditorChange,
  handleLocationChange,
  handleTagsChange,
  handleTimeChange,
} from "./note_handler";
import { PhotoType } from "../../models/media_class";
import { v4 as uuidv4 } from "uuid";
import { newNote } from "@/app/types";

const user = User.getInstance();

type NoteEditorProps = {
  note?: Note | newNote;
  isNewNote: boolean;
};

export default function NoteEditor({
  note: initialNote,
  isNewNote,
}: NoteEditorProps) {
  const { noteState, noteHandlers } = useNoteState(initialNote as Note);

  const rteRef = useRef<RichTextEditorRef>(null);
  const extensions = useExtensions({
    placeholder: "Add your own content here...",
  });

  useEffect(() => {
    if (initialNote) {
      noteHandlers.setNote(initialNote as Note);
      noteHandlers.setEditorContent(initialNote.text || "");
      noteHandlers.setTitle(initialNote.title || "");
      noteHandlers.setImages(initialNote.media || []);
      noteHandlers.setTime(initialNote.time || new Date());
      noteHandlers.setLongitude(initialNote.longitude || "");
      noteHandlers.setLatitude(initialNote.latitude || "");
      noteHandlers.setTags(initialNote.tags || []);
      noteHandlers.setAudio(initialNote.audio || []);
      noteHandlers.setCounter((prevCounter) => prevCounter + 1);
    }
  }, [initialNote]);

  useEffect(() => {
    if (initialNote) {
      noteHandlers.setNote(initialNote as Note);
    }
  }, [initialNote]);
  const onSave = async () => {
    const updatedNote: any = {
      ...noteState.note,
      text: noteState.editorContent,
      title: noteState.title,
      media: noteState.images,
      time: noteState.time,
      longitude: noteState.longitude,
      latitude: noteState.latitude,
      tags: noteState.tags,
      audio: noteState.audio,
      id: noteState.note?.id || "",
      creator: noteState.note?.creator || "",
    };

    try {
      if (isNewNote) {
        await ApiService.writeNewNote(updatedNote);
        toast("Note Created", {
          description: "Your new note has been successfully created.",
          duration: 2000,
        });
      } else {
        await ApiService.overwriteNote(updatedNote);
        toast("Note Saved", {
          description: "Your note has been successfully saved.",
          duration: 2000,
        });
      }
    } catch (error) {
      console.error("Error saving note:", error);
      toast("Error", {
        description: "Failed to save note. Try again later.",
        duration: 4000,
      });
    }
  };

  const addImageToNote = (imageUrl: string) => {
    console.log("Before updating images", noteState.images);
    const newImage = new PhotoType({
      uuid: uuidv4(),
      uri: imageUrl,
      type: "image",
    });

    noteHandlers.setImages((prevImages) => {
      const newImages = [...prevImages, newImage];
      console.log("After updating images", newImages);
      return newImages;
    });
  };

  return (
    <div className="flex flex-col w-[100%]" key={noteState.counter}>
      <div className="flex items-center justify-between mr-6">
        <Input
          value={noteState.title}
          onChange={(e) => handleTitleChange(noteHandlers.setTitle, e)}
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
            onClick={onSave}
          >
            <SaveIcon className="text-current" />
            <div className="ml-2">Save</div>
          </button>
          <div className="w-1 h-9 bg-border" />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="hover:text-red-500 flex justify-center items-center w-full">
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
                <AlertDialogAction
                  onClick={() =>
                    handleDeleteNote(noteState.note, user, noteHandlers.setNote)
                  }
                >
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <main className="flex-grow p-6">
        <div className="mt-3">
          <AudioPicker
            audioArray={noteState.audio || []}
            setAudio={noteHandlers.setAudio}
            editable={true}
          />
        </div>
        <div className="mt-3">
          <TimePicker
            initialDate={noteState.time || new Date()}
            onTimeChange={(newDate) =>
              handleTimeChange(noteHandlers.setTime, newDate)
            }
          />
        </div>
        <div className="mt-3">
          <LocationPicker
            long={noteState.longitude}
            lat={noteState.latitude}
            onLocationChange={(newLong, newLat) =>
              handleLocationChange(
                noteHandlers.setLongitude,
                noteHandlers.setLatitude,
                newLong,
                newLat
              )
            }
          />
        </div>
        <div className="mt-3 mb-3">
          <TagManager
            inputTags={noteState.tags}
            onTagsChange={(newTags) =>
              handleTagsChange(noteHandlers.setTags, newTags)
            }
          />
        </div>
        <div className="overflow-auto">
          <RichTextEditor
            ref={rteRef}
            extensions={extensions}
            content={noteState.editorContent}
            onUpdate={({ editor }) =>
              handleEditorChange(
                noteHandlers.setEditorContent,
                editor.getHTML()
              )
            }
            renderControls={() => (
              <EditorMenuControls onImageUpload={addImageToNote} />
            )}
<<<<<<< HEAD
            // this is causing build errors
            // children={(editor) => {
            //   if (!editor) return null;
            //   return (
            //     <LinkBubbleMenu>
            //       {/* This is where you can add additional elements that should appear in the bubble menu */}
            //       {/* For example, you could include pedagogical comments here */}
            //     </LinkBubbleMenu>
            //   );
            // }}
=======
            children={(editor) => {
              if (!editor) return null;
              return (
                <LinkBubbleMenu/>
              );
            }}
>>>>>>> e2ade6a (pulling recent changes)
          />
        </div>
      </main>
    </div>
  );
}
