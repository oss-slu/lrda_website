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
import NoteToolbar from "./note_toolbar";
import useExtensions from "../../utils/use_extensions";
import { User } from "../../models/user_class";
import ApiService from "../../utils/api_service";
import { FileX2, SaveIcon, Calendar, MapPin, Music } from "lucide-react";
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
  handlePublishChange,
} from "./note_handler";
import { PhotoType, VideoType } from "../../models/media_class";
import { v4 as uuidv4 } from "uuid";
import { newNote } from "@/app/types";
import PublishToggle from "./publish_toggle";
import VideoComponent from "./videoComponent";
import { init } from "next/dist/compiled/webpack/webpack";

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
    const editor = rteRef.current?.editor;
    if (noteState.videos.length > 0 && editor) {
      const newVideo = noteState.videos[noteState.videos.length - 1];
      const videoIndex = noteState.videos.length;
      const videoLink = `Video ${videoIndex}`;
      const videoUri = newVideo.uri;

      editor
        .chain()
        .focus()
        .command(({ tr, dispatch }) => {
          if (dispatch) {
            const endPos = tr.doc.content.size;
            const paragraphNodeForNewLine = editor.schema.node("paragraph");
            const textNode = editor.schema.text(videoLink, [
              editor.schema.marks.link.create({ href: videoUri }),
            ]);
            const paragraphNodeForLink = editor.schema.node("paragraph", null, [
              textNode,
            ]);

            const transaction = tr
              .insert(endPos, paragraphNodeForNewLine)
              .insert(endPos + 1, paragraphNodeForLink);
            dispatch(transaction);
          }
          return true;
        })
        .run();
    }
  }, [noteState.videos]);

  useEffect(() => {
    if (initialNote) {
      noteHandlers.setNote(initialNote as Note);
      noteHandlers.setEditorContent(initialNote.text || "");
      noteHandlers.setTitle(initialNote.title || "");
      noteHandlers.setImages(
        (initialNote.media.filter(
          (item) => item.getType() === "image"
        ) as PhotoType[]) || []
      );
      noteHandlers.setTime(initialNote.time || new Date());
      noteHandlers.setLongitude(initialNote.longitude || "");
      noteHandlers.setLatitude(initialNote.latitude || "");
      noteHandlers.setTags(initialNote.tags || []);
      noteHandlers.setAudio(initialNote.audio || []);
      noteHandlers.setIsPublished(initialNote.published || false);
      noteHandlers.setCounter((prevCounter) => prevCounter + 1);
      noteHandlers.setVideos(
        (initialNote.media.filter(
          (item) => item.getType() === "video"
        ) as VideoType[]) || []
      );
    }
  }, [initialNote]);

  console.log("initial Note", initialNote);

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
      media: [...noteState.images, ...noteState.videos],
      published: noteState.isPublished,
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
        console.log("SAVED NOTE HERE: ", updatedNote);
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

  const [isAudioModalOpen, setIsAudioModalOpen] = React.useState(false);


return (
  <div className="flex flex-col w-full min-h-screen bg-cover bg-center bg-no-repeat flex-grow" 
  key={noteState.counter}
  style={{ backgroundImage: `url('/note_background.jpg')`, width: 'calc(100vw - 285px)' }}
>
  <div className="w-full flex flex-row items-center"> {/* Adjusted for horizontal alignment */}
    {/* Title Input Container */}
    <div className="bg-white p-4 rounded m-4 flex-grow" style={{ maxWidth: '330px' }}> {/* Keep the title input here */}
      <Input
        value={noteState.title}
        onChange={(e) => handleTitleChange(noteHandlers.setTitle, e)}
        placeholder="Title"
        style={{
          all: "unset",
          fontSize: "1.5em",
          fontWeight: "bold",
          outline: "none",
          width: '100%', // Ensure input takes the full width of its container
        }}
      />
    </div>
    {/* Buttons Container */}
    <div className="flex bg-popup shadow-sm rounded-md border border-border bg-white pt-2 pb-2 justify-around items-center m-4 w-full" style={{ maxWidth: '1700px' }}>
      <PublishToggle isPublished={noteState.isPublished} onPublishChange={(bool) =>
          handlePublishChange(noteHandlers.setIsPublished, bool)
        } />
      <div className="w-1 h-9 bg-border" />
      <button
        className="hover:text-green-500 flex justify-center items-center w-full"
        onClick={onSave}
      >
        <SaveIcon className="text-current" />
        <div className="ml-2">Save</div>
      </button>
      <div className="w-1 h-9 bg-border" />
      <AlertDialog> {/* AlertDialog */}
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
      {/* Replace the Calendar button with the TimePicker */}
      <div className="flex-grow"> {/* Adjust this wrapper as needed */}
        <TimePicker
          initialDate={noteState.time || new Date()}
          onTimeChange={(newDate) => handleTimeChange(noteHandlers.setTime, newDate)}
        />
      </div>
      <div className="w-1 h-9 bg-border" /> {/* Divider */}
      <div className="bg-white p-2 rounded"> {/* LocationPicker */}
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
      <div className="w-1 h-9 bg-border" /> {/* Divider */}
        {/* Audio Button */}
        <button
  className="hover:text-orange-500 flex justify-center items-center w-full"
  onClick={() => setIsAudioModalOpen(true)} // Set to true to open the modal
>
  <Music className="text-current" />
  <div className="ml-2">Audio</div>
</button>
      </div>
    </div>
{/* This div is for the TagManager */}
<div className="bg-white p-2 rounded m-4 flex items-center overflow-auto" style={{ maxWidth: '600px' }}>
  <TagManager
    inputTags={noteState.tags}
    onTagsChange={(newTags) => handleTagsChange(noteHandlers.setTags, newTags)}
  />
</div>
 
{/* Conditional Rendering of the Audio Modal */}
{isAudioModalOpen && (
  <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50 z-50">
    <div className="bg-white p-4 rounded-lg shadow-lg max-w-md mx-auto">
      {/* Modal content */}
      <h2 className="text-lg font-semibold mb-2 text-center">Select Audio</h2>
      
      {/* Here we include the AudioPicker component */}
      {/* Use available space more efficiently within the modal */}
      <div className="flex flex-col justify-between h-auto">
        <AudioPicker
          audioArray={noteState.audio || []}
          setAudio={noteHandlers.setAudio}
          editable={true}
        />
        <button
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 transition-colors"
          onClick={() => setIsAudioModalOpen(false)} // Close the modal
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}
  <div className="flex flex-col w-full h-screen bg-cover bg-center bg-no-repeat">
    <main className="flex-grow w-full p-6 flex flex-col"> {/* Main content area */}
      <div className="overflow-auto bg-white w-full -ml-2">
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
          children={(editor) => {
            if (!editor) return null;
            return (
              <LinkBubbleMenu/>
            );
          }}
        />
      </div>
    </main>
  </div>
</div>
);
        }
