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
import introJs from 'intro.js'
import 'intro.js/introjs.css';

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

  // Add the useEffect hook here to check and start the tour
  useEffect(() => {
    const checkAndStartTour = async () => {
      const userHasCompletedTour = await user.hasCompletedTour();
      if (!userHasCompletedTour) {
        startTour();
      }
    };

    checkAndStartTour();
  }, []); // Empty dependency array ensures this runs once on component mount

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

  const startTour = () => {
    const tour = introJs();
    tour.setOptions({
      steps: [
        {
          intro: "Welcome to your note editor! Let's take a quick tour.",
        },
        {
          element:'#tourStepSearchBar',
          intro: "Use this search bar to quickly find your notes.",
        },
        {
          element: '#addNoteButton',
          intro: "This is the add note button. Press this button when you wish to start creating a new note or to refresh the note editor.",
        },
        {
          element: '#noteToolbar',
          intro: "This is the toolbar for your note component. Let's walk through each part:",
        },
        {
          element: '#noteTitleInput',
          intro: "Here is where you will enter the title for your note.",
        },
        {
          element: '#publishToggle',
          intro: "This toggle controls whether your note is public or private. Switch it to publish your note or keep it private.",
        },
        {
          element: '#saveButton',
          intro: "Click here to save your note. Make sure to save your progress as you work.",
        },
        {
          element: '#deleteButton',
          intro: "This button deletes your current note. Be careful, as this action cannot be undone.",
        },
        {
          element: '#timePicker',
          intro: "Here's where you set the time for your note. You can use this to remember or organize your notes based on when they were or will be relevant.",
        },
        {
          element: '#locationPicker',
          intro: "Use the Location Picker to add or edit the geographical location for your note. This can help you remember where your notes were taken or are relevant to.",
        },
        {
          element: '#videoComponent',
          intro: "Add videos to your note here. This can enhance your notes with visual aids or important video references.",
        },
        {
          element: '#audioButton',
          intro: "Use this button to add audio recordings to your note. It's great for voice memos, music, or any audio notes.",
        },
        {
          element: '#tagManager',
          intro: "Here you can add or remove tags from your note. Tags help organize and categorize your notes for easier retrieval.",
        },
        {
          element: '#richTextEditor',
          intro: "This is where you'll spend most of your time. You can write, format, and edit the content of your note here, including adding images, links, and other multimedia.",
        },
        // Conclusion or further instructions...
      ],
    });

      tour.oncomplete(() => user.setTourCompleted());
      tour.onexit(() => user.setTourCompleted());
  
    tour.start();
  };

  

  return (
    <div
      className="flex flex-col w-full min-h-screen bg-cover bg-center bg-no-repeat flex-grow"
      key={noteState.counter}
      style={{
        backgroundImage: `url('/note_background.jpg')`,
        width: "calc(100vw - 285px)",
      }}
    >
      <div className="w-full flex flex-row items-center">
        <div
        id="noteToolbar"
          className="flex bg-popup shadow-sm rounded-md border border-border bg-white justify-around items-center m-4 w-full"
          style={{ maxWidth: "1700px" }}
        >
          <div
            className="bg-white p-4 rounded m-4 flex-grow"
            style={{ maxWidth: "330px" }}
          >
            <Input
            id="noteTitleInput" // Unique identifier for the input
              value={noteState.title}
              onChange={(e) => handleTitleChange(noteHandlers.setTitle, e)}
              placeholder="Title"
              style={{
                all: "unset",
                fontSize: "1.5em",
                fontWeight: "bold",
                outline: "none",
                width: "100%",
                minWidth: "150px",
              }}
            />
          </div>
          <div className="w-2 h-9 bg-border" />
          <div id="publishToggle">    
          <PublishToggle
            isPublished={noteState.isPublished}
            onPublishChange={(bool) =>
              handlePublishChange(noteHandlers.setIsPublished, bool)
            }
          />
          </div>
          <div className="w-2 h-9 bg-border" />
          <button
          id="saveButton" // Unique identifier
            className="hover:text-green-500 flex justify-center items-center w-full"
            onClick={onSave}
          >
            <SaveIcon className="text-current" />
            <div className="ml-2">Save</div>
          </button>
          <div className="w-2 h-9 bg-border" />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="hover:text-red-500 flex justify-center items-center w-full" id="deleteButton">
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
          <div className="w-2 h-9 bg-border" />
          <div className="flex-grow" id="timePicker">
            <TimePicker
              initialDate={noteState.time || new Date()}
              onTimeChange={(newDate) =>
                handleTimeChange(noteHandlers.setTime, newDate)
              }
            />
          </div>
          <div className="w-2 h-9 bg-border" />
          <div className= "bg-white p-2 rounded" id="locationPicker">
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
          <div className="w-2 h-9 bg-border" />
          <div className="bg-white p-2 rounded" id="videoComponent">
            <VideoComponent
              videoArray={noteState.videos || []}
              setVideo={noteHandlers.setVideos}
            />
          </div>
          <div className="w-2 h-9 bg-border" />
          <button
          id="audioButton"
            className="hover:text-orange-500 flex justify-center items-center w-full"
            onClick={() => setIsAudioModalOpen(true)}
          >
            <Music className="text-current" />
            <div className="ml-2">Audio</div>
          </button>
        </div>
      </div>
      <div className="p-2 rounded mx-4 flex items-center overflow-auto" id="tagManager">
        <TagManager
          inputTags={noteState.tags}
          onTagsChange={(newTags) =>
            handleTagsChange(noteHandlers.setTags, newTags)
          }
        />

         {/* Start Tour Button */}
  <button
    className="hover:bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded inline-flex items-center ml-4"
    onClick={startTour}
  >
    <span>Start Tour</span>
  </button>
      </div>

      {isAudioModalOpen && (
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-4 rounded-lg shadow-lg max-w-md mx-auto">
            <h2 className="text-lg font-semibold mb-2 text-center">
              Select Audio
            </h2>
            <div className="flex flex-col justify-between h-auto">
              <AudioPicker
                audioArray={noteState.audio || []}
                setAudio={noteHandlers.setAudio}
                editable={true}
              />
              <button
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 transition-colors"
                onClick={() => setIsAudioModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-col w-full h-screen bg-cover bg-center bg-no-repeat" id="richTextEditor">
        <main className="flex-grow w-full p-6 flex flex-col">
          <div className="overflow-auto bg-white w-full -ml-2">
            <RichTextEditor
              ref={rteRef}
              className="min-h-[875px]"
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
                return <LinkBubbleMenu />;
              }}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
