import React, { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Note, Tag } from "@/app/types";
import TimePicker from "./time_picker";
import {
  LinkBubbleMenu,
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
  handleTagsChange, // Imported from note_handler
  handleTimeChange,
  handlePublishChange,
} from "./note_handler";
import { PhotoType, VideoType } from "../../models/media_class";
import { v4 as uuidv4 } from "uuid";
import { newNote } from "@/app/types";
import PublishToggle from "./publish_toggle";
import VideoComponent from "./videoComponent";
import { ScrollArea } from "@/components/ui/scroll-area";

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

  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [loadingTags, setLoadingTags] = useState<boolean>(false);

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

      noteHandlers.setTags(
        (initialNote.tags || []).map((tag) =>
          typeof tag === "string" ? { label: tag, origin: "user" } : tag
        )
      );

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
        noteHandlers.setCounter((prevCounter) => prevCounter + 1);
      } else {
        await ApiService.overwriteNote(updatedNote);
        toast("Note Saved", {
          description: "Your note has been successfully saved.",
          duration: 2000,
        });
        noteHandlers.setCounter((prevCounter) => prevCounter + 1);
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
    const newImage = {
      type: "image",
      attrs: {
        src: imageUrl,
        alt: "Image description",
        loading: "lazy",
      },
    };

    const editor = rteRef.current?.editor;
    if (editor) {
      editor
        .chain()
        .focus()
        .setImage(newImage.attrs)
        .run();
    }

    noteHandlers.setImages((prevImages) => {
      const newImages = [
        ...prevImages,
        new PhotoType({
          uuid: uuidv4(),
          uri: imageUrl,
          type: "image",
        }),
      ];
      console.log("After updating images", newImages);
      return newImages;
    });
  };

  const [isAudioModalOpen, setIsAudioModalOpen] = React.useState(false);

  const fetchSuggestedTags = async () => {
    setLoadingTags(true);
    try {
      const editor = rteRef.current?.editor;
      if (editor) {
        const noteContent = editor.getHTML();
        console.log("Fetching suggested tags for content:", noteContent);

        const tags = await ApiService.generateTags(noteContent);
        console.log("Suggested tags received:", tags);
        setSuggestedTags(tags);
      } else {
        console.error("Editor instance is not available");
      }
    } catch (error) {
      console.error("Error generating tags:", error);
    } finally {
      setLoadingTags(false);
    }
  };

  return (
    <ScrollArea className="flex flex-col w-full h-[90vh] bg-cover bg-center flex-grow">
      <div
        key={noteState.counter}
        style={{
          backgroundImage: `url('/note_background.jpg')`,
          height: "full",
        }}
      >
        <div aria-label="Top Bar" className="w-full flex flex-col mx-4">
          <Input
            value={noteState.title}
            onChange={(e) => handleTitleChange(noteHandlers.setTitle, e)}
            placeholder="Title"
            className="p-4 font-bold text-2xl max-w-md bg-white mt-4"
          />
          <div className="flex flex-row bg-popup shadow-sm my-4 rounded-md border border-border bg-white justify-evenly mr-8 items-center">
            <PublishToggle
              isPublished={noteState.isPublished}
              onPublishChange={(bool) =>
                handlePublishChange(noteHandlers.setIsPublished, bool)
              }
            />
            <div className="w-2 h-9 bg-border" />
            <button
              className="hover:text-green-500 flex justify-center items-center w-full"
              onClick={onSave}
            >
              <SaveIcon className="text-current" />
              <div className="ml-2">Save</div>
            </button>
            <div className="w-2 h-9 bg-border" />
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
                      handleDeleteNote(
                        noteState.note,
                        user,
                        noteHandlers.setNote
                      )
                    }
                  >
                    Continue
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <div className="w-2 h-9 bg-border" />
            <div className="flex-grow">
              <TimePicker
                initialDate={noteState.time || new Date()}
                onTimeChange={(newDate) =>
                  handleTimeChange(noteHandlers.setTime, newDate)
                }
              />
            </div>
            <div className="w-2 h-9 bg-border" />
            <div className="bg-white p-2 rounded">
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
            <div className="bg-white p-2 rounded">
              <VideoComponent
                videoArray={noteState.videos || []}
                setVideo={noteHandlers.setVideos}
              />
            </div>
            <div className="w-2 h-9 bg-border" />
            <button
              className="hover:text-orange-500 flex justify-center items-center w-full"
              onClick={() => setIsAudioModalOpen(true)}
            >
              <Music className="text-current" />
              <div className="ml-2">Audio</div>
            </button>
          </div>
          <TagManager
  inputTags={noteState.tags}
  suggestedTags={suggestedTags}
  onTagsChange={(newTags) =>
    handleTagsChange(noteHandlers.setTags, newTags) // Ensure it uses the updated function
  }
  fetchSuggestedTags={fetchSuggestedTags}
/>

          {loadingTags && <p>Loading suggested tags...</p>}
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
        <div className="flex-grow w-full p-4 flex flex-col">
          <div className=" flex-grow flex flex-col bg-white w-full rounded">
            <RichTextEditor
              ref={rteRef}
              className="min-h-[712px]"
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
        </div>
      </div>
    </ScrollArea>
  );
}
