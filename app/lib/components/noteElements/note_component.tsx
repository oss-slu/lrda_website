import React, { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Tag } from "@/app/types";
import TimePicker from "./time_picker";
import { LinkBubbleMenu, RichTextEditor, type RichTextEditorRef } from "mui-tiptap";
import TagManager from "./tag_manager";
import LocationPicker from "./location_component";
import AudioPicker from "./audio_component";
import EditorMenuControls from "../editor_menu_controls";
import NoteToolbar from "./note_toolbar";
import useExtensions from "../../utils/use_extensions";
import { User } from "../../models/user_class";
import { Document, Packer, Paragraph } from "docx"; // For DOCX
import jsPDF from "jspdf"; // For PDF
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
import { PhotoType, VideoType, AudioType } from "../../models/media_class";
import { v4 as uuidv4 } from "uuid";
import PublishToggle from "./publish_toggle";
import VideoComponent from "./videoComponent";
import { ScrollArea } from "@/components/ui/scroll-area";
import introJs from "intro.js";
import "intro.js/introjs.css";
import { initializeApp } from "firebase/app";
import type { NoteStateType, NoteHandlersType } from "./note_state";

import { Button } from "@/components/ui/button";
import { newNote, Note } from "@/app/types"; // make sure types are imported
import { useNotesStore } from "../../stores/notesStore";

const user = User.getInstance();

type NoteEditorProps = {
  note?: Note | newNote;
  isNewNote: boolean;
  onNoteSaved?: () => void; // Add callback for when note is saved
};

export default function NoteEditor({ note: initialNote, isNewNote, onNoteSaved }: NoteEditorProps) {
  const { noteState, noteHandlers } = useNoteState(initialNote as Note);
  const updateNote = useNotesStore((state) => state.updateNote); // Get updateNote from store
  const rteRef = useRef<RichTextEditorRef>(null);
  const extensions = useExtensions({
    placeholder: "Add your own content here...",
  });

  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [loadingTags, setLoadingTags] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const titleRef = useRef<HTMLInputElement | null>(null);

  const dateRef = useRef<HTMLDivElement | null>(null);
  const deleteRef = useRef<HTMLSpanElement | null>(null);
  const locationRef = useRef<HTMLDivElement | null>(null);

  const getCookie = (name: string) => {
    const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
    return match ? match[2] : null;
  };

  // Helper function to set a cookie
  const setCookie = (name: string, value: string, days: number) => {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value}; path=/; expires=${date.toUTCString()}`;
  };

  const [selectedFileType, setSelectedFileType] = useState<"pdf" | "docx">("pdf");
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const addNote = document.getElementById("add-note-button");
      const title = titleRef.current;
      const deleteButton = deleteRef.current;
      const date = dateRef.current;
      const location = locationRef.current;

      // Check if all elements are present
      if (addNote && title && deleteButton && date && location) {
        const intro = introJs();
        const hasAddNoteIntroBeenShown = getCookie("addNoteIntroShown");

        if (!hasAddNoteIntroBeenShown) {
          intro.setOptions({
            steps: [
              {
                element: addNote,
                intro: "Click this button to add a note",
              },
              {
                element: title,
                intro: "You can name your note here!",
              },
              {
                element: deleteButton,
                intro: "If you don't like your note, you can archive it here.",
              },
              {
                element: date,
                intro: "We will automatically date and time your entry!",
              },
              {
                element: location,
                intro: "Make sure you specify the location of your note.",
              },
            ],
            scrollToElement: false,
            skipLabel: "Skip",
          });

          intro.oncomplete(() => {
            // After the intro is completed, set the cookie
            setCookie("addNoteIntroShown", "true", 365);
          });

          intro.onexit(() => {
            // Set the cookie if the user exits the intro
            setCookie("addNoteIntroShown", "true", 365);
          });

          intro.start();

          // Apply inline styling to the skip button after a short delay to ensure it has rendered
          setTimeout(() => {
            const skipButton = document.querySelector(".introjs-skipbutton") as HTMLElement;
            if (skipButton) {
              skipButton.style.position = "absolute";
              skipButton.style.top = "2px"; // Move it up by decreasing the top value
              skipButton.style.right = "20px"; // Adjust positioning as needed
              skipButton.style.fontSize = "18px"; // Adjust font size as needed
              skipButton.style.padding = "4px 10px"; // Adjust padding as needed
            }
          }, 100); // 100ms delay to wait for rendering

          observer.disconnect(); // Stop observing once the elements are found and the intro is set up
        }
      }
    });

    // Start observing the body for changes to detect when the elements appear
    observer.observe(document.body, { childList: true, subtree: true });

    // Cleanup the observer when the component unmounts
    return () => observer.disconnect();
  }, []); // Empty dependency array ensures this effect runs only once

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
            const textNode = editor.schema.text(videoLink, [editor.schema.marks.link.create({ href: videoUri })]);
            const paragraphNodeForLink = editor.schema.node("paragraph", null, [textNode]);

            const transaction = tr.insert(endPos, paragraphNodeForNewLine).insert(endPos + 1, paragraphNodeForLink);
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

      noteHandlers.setImages((initialNote.media.filter((item) => item.getType() === "image") as PhotoType[]) || []);
      noteHandlers.setTime(initialNote.time || new Date());
      noteHandlers.setLongitude(initialNote.longitude || "");
      noteHandlers.setLatitude(initialNote.latitude || "");

      noteHandlers.setTags((initialNote.tags || []).map((tag) => (typeof tag === "string" ? { label: tag, origin: "user" } : tag)));

      noteHandlers.setAudio(initialNote.audio || []);
      noteHandlers.setIsPublished(initialNote.published || false);
      noteHandlers.setCounter((prevCounter) => prevCounter + 1);
      noteHandlers.setVideos((initialNote.media.filter((item) => item.getType() === "video") as VideoType[]) || []);
    }
  }, [initialNote]);

  // After a note loads, place caret at the start ONCE so typing begins at top,
  // but don't override click-based placement afterward.
  useEffect(() => {
    const editor = rteRef.current?.editor;
    if (editor) {
      // Small timeout to ensure editor has mounted with new content
      const t = setTimeout(() => editor.chain().focus('start').run(), 0);
      return () => clearTimeout(t);
    }
  }, [noteState.note?.id]);

  useEffect(() => {
    if (initialNote) {
      noteHandlers.setNote(initialNote as Note);
    }
  }, [initialNote]);

  useEffect(() => {
    if (initialNote) {
      noteHandlers.setEditorContent(initialNote.text || "");
      noteHandlers.setTitle(initialNote.title || "");
      noteHandlers.setImages((initialNote.media.filter((item) => item.getType() === "image") as PhotoType[]) || []);
      noteHandlers.setTime(initialNote.time || new Date());
      noteHandlers.setLongitude(initialNote.longitude || "");
      noteHandlers.setLatitude(initialNote.latitude || "");
      noteHandlers.setTags((initialNote.tags || []).map((tag) => (typeof tag === "string" ? { label: tag, origin: "user" } : tag)));
      noteHandlers.setAudio(initialNote.audio || []);
      noteHandlers.setIsPublished(initialNote.published || false);

      noteHandlers.setCounter((prevCounter) => prevCounter + 1);
      noteHandlers.setVideos((initialNote.media.filter((item) => item.getType() === "video") as VideoType[]) || []);
    }
  }, [initialNote]);

  // Auto-save effect: saves note 2 seconds after user stops typing
  useEffect(() => {
    // Clear any existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Don't auto-save if note doesn't have an ID yet (new notes are saved immediately on creation)
    if (!noteState.note?.id) {
      return;
    }

    // Set a new timer to auto-save after 2 seconds of inactivity
    autoSaveTimerRef.current = setTimeout(async () => {
      if (noteState.note?.id && !isSaving) {
        setIsSaving(true);
        
        const updatedNote: any = {
          ...noteState.note,
          text: noteState.editorContent,
          title: noteState.title || "Untitled",
          media: [...noteState.images, ...noteState.videos],
          published: noteState.isPublished,
          time: noteState.time,
          longitude: noteState.longitude,
          latitude: noteState.latitude,
          tags: noteState.tags,
          audio: noteState.audio,
          id: noteState.note.id,
          creator: noteState.note.creator,
        };

        try {
          await ApiService.overwriteNote(updatedNote);
          
          // Update the global store so sidebar shows changes immediately
          if (noteState.note?.id) {
            updateNote(noteState.note.id, {
              title: updatedNote.title,
              text: updatedNote.text,
              tags: updatedNote.tags,
              published: updatedNote.published,
              time: updatedNote.time,
              latitude: updatedNote.latitude,
              longitude: updatedNote.longitude,
            });
          }
          
          // Silent save - no toast notification for auto-save
          if (onNoteSaved) {
            onNoteSaved();
          }
        } catch (error) {
          console.error("Auto-save error:", error);
        } finally {
          setIsSaving(false);
        }
      }
    }, 2000); // Auto-save after 2 seconds of inactivity

    // Cleanup function
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [noteState.title, noteState.editorContent, noteState.tags, noteState.isPublished]);

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
      creator: noteState.note?.creator || user.getId(),
    };

    try {
      if (isNewNote) {
        await ApiService.writeNewNote(updatedNote);
        toast("Note Created", {
          description: "Your note has been successfully created.",
          duration: 2000,
        });
      } else {
        await ApiService.overwriteNote(updatedNote);
        toast("Note Saved", {
          description: "Your note has been successfully saved.",
          duration: 2000,
        });
      }

      // Trigger parent component to refresh sidebar
      // The note stays open so user can continue editing
      if (onNoteSaved) {
        onNoteSaved();
      }
    } catch (error) {
      console.error("Error saving note:", error);
      toast("Error", {
        description: "Failed to save note. Try again later.",
        duration: 4000,
      });
    }
  };

  const handlePublishChange = async (noteState: NoteStateType, noteHandlers: NoteHandlersType) => {
    const creatorId = noteState.note?.creator || (await user.getId());
    const updatedNote = {
      ...noteState.note,
      text: noteState.editorContent,
      title: noteState.title,
      media: [...noteState.images, ...noteState.videos],
      time: noteState.time,
      longitude: noteState.longitude,
      latitude: noteState.latitude,
      tags: noteState.tags,
      audio: noteState.audio,
      id: noteState.note?.id || "",
      uid: noteState.note?.uid ?? "",
      creator: creatorId || "",
      published: !noteState.isPublished,
    };

    try {
      await ApiService.overwriteNote(updatedNote);

      noteHandlers.setIsPublished(updatedNote.published);
      noteHandlers.setNote(updatedNote);

      toast(updatedNote.published ? "Note Published" : "Note Unpublished", {
        description: updatedNote.published ? "Your note has been published successfully." : "Your note has been unpublished successfully.",
        duration: 4000,
      });

      noteHandlers.setCounter((prevCounter) => prevCounter + 1);
    } catch (error) {
      console.error("Error updating note state:", error);
      toast("Error", {
        description: "Failed to update note state. Please try again later.",
        duration: 4000,
      });
    }
  };

  const handleDownload = async () => {
    if (!selectedFileType) {
      alert("Please select a file type.");
      return;
    }

    // Extract plain text from HTML content
    const plainTextContent = new DOMParser().parseFromString(noteState.editorContent, "text/html").body.innerText;

    const noteContent = `
      Title: ${noteState.title}
      Content: ${plainTextContent}
      Tags: ${noteState.tags.map((tag) => tag.label).join(", ")}
      Location: ${noteState.latitude}, ${noteState.longitude}
      Time: ${noteState.time}
    `;

    if (selectedFileType === "pdf") {
      // Generate PDF using jsPDF
      const pdf = new jsPDF();
      pdf.text(noteContent, 10, 10); // Add text to the PDF
      pdf.save(`${noteState.title || "note"}.pdf`); // Save the PDF file
    } else if (selectedFileType === "docx") {
      // Generate Word document using docx
      const doc = new Document({
        sections: [
          {
            children: [
              new Paragraph({
                text: `Title: ${noteState.title}`,
              }),
              new Paragraph(`Content: ${plainTextContent}`),
              new Paragraph(`Tags: ${noteState.tags.map((tag) => tag.label).join(", ")}`),
              new Paragraph(`Location: ${noteState.latitude}, ${noteState.longitude}`),
              new Paragraph(`Time: ${noteState.time}`),
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(doc); // Generate DOCX file as Blob
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${noteState.title || "note"}.docx`; // Set the filename
      link.click();
      URL.revokeObjectURL(url);
    }

    toast(`Your note has been downloaded as ${selectedFileType.toUpperCase()}`);
  };

  // const addImageToNote = (imageUrl: string) => {
  //   console.log("Before updating images", noteState.images);
  //   const newImage = {
  //     type: "image",
  //     attrs: {
  //       src: imageUrl,
  //       alt: "Image description",
  //       loading: "lazy",
  //     },
  //   };

  //   const editor = rteRef.current?.editor;
  //   if (editor) {
  //     editor
  //       .chain()
  //       .focus()
  //       .setImage(newImage.attrs)
  //       .run();
  //   }

  //   noteHandlers.setImages((prevImages) => {
  //     const newImages = [
  //       ...prevImages,
  //       new PhotoType({
  //         uuid: uuidv4(),
  //         uri: imageUrl,
  //         type: "image",
  //       }),
  //     ];
  //     console.log("After updating images", newImages);
  //     return newImages;
  //   });
  // };

  const [isAudioModalOpen, setIsAudioModalOpen] = React.useState(false);

  const fetchSuggestedTags = async () => {
    setLoadingTags(true);
    try {
      const editor = rteRef.current?.editor;
      if (editor) {
        const noteContent = editor.getHTML();

        const tags = await ApiService.generateTags(noteContent);
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
    <div className="relative h-full w-full min-h-0 bg-white transition-all duration-300 ease-in-out">

      <ScrollArea className="flex flex-col w-full h-full min-h-0">
        <div aria-label="Top Bar" className="w-full flex flex-col px-8 py-6">
          <Input
            id="note-title-input"
            value={noteState.title}
            onChange={(e) => handleTitleChange(noteHandlers.setTitle, e)}
            placeholder="Untitled"
            className="border-0 p-0 font-bold text-3xl bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-gray-400 transition-all duration-200 ease-in-out"
            ref={titleRef}
          />
          <div className="flex flex-row items-center gap-4 mt-6 pb-4 border-b border-gray-200">
            {/* Auto-save indicator */}
            <div className="inline-flex items-center gap-2 text-sm text-gray-500">
              {isSaving ? (
                <>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>All changes saved</span>
                </>
              )}
            </div>
            
            <PublishToggle
              id="publish-toggle-button"
              isPublished={Boolean(noteState.isPublished)}
              onPublishClick={() => handlePublishChange(noteState, noteHandlers)}
            />

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button 
                  disabled={!noteState.note?.id || isSaving}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={!noteState.note?.id ? "Please wait for note to save before archiving" : "Archive this note"}
                >
                  <FileX2 className="w-4 h-4" />
                  <span ref={deleteRef}>Archive</span>
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>This action cannot be undone. This will permanently archive this note.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={async () => {
                    const success = await handleDeleteNote(noteState.note, user, noteHandlers.setNote);
                    if (success && onNoteSaved) {
                      // Wait a moment for the API to propagate the archive change
                      // before refreshing the sidebar
                      setTimeout(() => {
                        onNoteSaved();
                      }, 1000); // 1 second delay
                    }
                  }}>
                    Continue
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <div className="flex items-center gap-4 ml-auto">
              <div ref={dateRef}>
                <TimePicker
                  initialDate={noteState.time || new Date()}
                  onTimeChange={(newDate) => handleTimeChange(noteHandlers.setTime, newDate)}
                />
              </div>
              <div ref={locationRef}>
                <LocationPicker
                  long={noteState.longitude}
                  lat={noteState.latitude}
                  onLocationChange={(newLong, newLat) =>
                    handleLocationChange(noteHandlers.setLongitude, noteHandlers.setLatitude, newLong, newLat)
                  }
                />
              </div>
            </div>
          </div>
          <div className="mt-6">
            <TagManager
              inputTags={noteState.tags}
              suggestedTags={suggestedTags}
              onTagsChange={
                (newTags) => handleTagsChange(noteHandlers.setTags, newTags) // Ensure it uses the updated function
              }
              fetchSuggestedTags={fetchSuggestedTags}
            />
          </div>

          {loadingTags && <p>Loading suggested tags...</p>}
        </div>
        <div
          className="w-full px-8 pb-8 transition-opacity duration-200 ease-in-out"
          onMouseDown={(e) => {
            const editor = rteRef.current?.editor;
            if (!editor) return;
            const target = e.target as HTMLElement;
            // If the click is NOT inside the ProseMirror content, focus the editor at the start
            if (!target.closest('.ProseMirror')) {
              e.preventDefault();
              editor.chain().focus('start').run();
            }
          }}
          onKeyDown={(e) => {
            const editor = rteRef.current?.editor;
            if (!editor) return;
            // When the editor is empty, allow ArrowDown to create a new paragraph so users can "go down"
            if (e.key === 'ArrowDown' && editor.isEmpty) {
              e.preventDefault();
              editor.chain().focus().insertContent('<p><br/></p>').run();
            }
          }}
        >
          <div className="bg-white w-full">
            <RichTextEditor
              key={`${noteState.note?.id ?? 'new'}-${noteState.title}`}
              ref={rteRef}
              className="min-h-[400px] prose prose-lg max-w-none"
              extensions={extensions}
              content={noteState.editorContent}
              onUpdate={({ editor }) => handleEditorChange(noteHandlers.setEditorContent, editor.getHTML())}
              immediatelyRender={false}
              renderControls={() => (
                <EditorMenuControls
                  onMediaUpload={(media) => {
                    if (media.type === "image") {
                      const defaultWidth = "100"; // or "100%" or any px value you want
                      const defaultHeight = "auto"; // or set a fixed height like "480"

                      const newImage = {
                        type: "image",
                        attrs: {
                          src: media.uri,
                          alt: "Image description",
                          loading: "lazy",
                          width: defaultWidth,
                          height: defaultHeight,
                        },
                      };

                      const editor = rteRef.current?.editor;
                      if (editor) {
                        editor.chain().focus().setImage(newImage.attrs).run();
                      }

                      noteHandlers.setImages((prevImages) => [
                        ...prevImages,
                        new PhotoType({
                          uuid: uuidv4(),
                          uri: media.uri,
                          type: "image",
                        }),
                      ]);
                    } else if (media.type === "video") {
                      const newVideo = new VideoType({
                        uuid: uuidv4(),
                        uri: media.uri,
                        type: "video",
                        thumbnail: "",
                        duration: "0:00",
                      });

                      noteHandlers.setVideos((prevVideos) => [...prevVideos, newVideo]);

                      const editor = rteRef.current?.editor;
                      if (editor) {
                        const videoLink = `Video ${noteState.videos.length + 1}`;
                        editor
                          .chain()
                          .focus()
                          .command(({ tr, dispatch }) => {
                            if (dispatch) {
                              const endPos = tr.doc.content.size;
                              const paragraphNodeForNewLine = editor.schema.node("paragraph");
                              const textNode = editor.schema.text(videoLink, [editor.schema.marks.link.create({ href: media.uri })]);
                              const paragraphNodeForLink = editor.schema.node("paragraph", null, [textNode]);

                              const transaction = tr.insert(endPos, paragraphNodeForNewLine).insert(endPos + 1, paragraphNodeForLink);
                              dispatch(transaction);
                            }
                            return true;
                          })
                          .run();
                      }
                    } else if (media.type === "audio") {
                      const newAudio = new AudioType({
                        uuid: uuidv4(),
                        uri: media.uri,
                        type: "audio", // Explicitly set the type
                        duration: "0:00", // Default duration
                        name: `Audio Note ${noteState.audio.length + 1}`,
                        isPlaying: false, // Default play status
                      });

                      noteHandlers.setAudio((prevAudio) => [...prevAudio, newAudio]);
                    }
                  }}
                />
              )}
              children={(editor) => {
                if (!editor) return null;
                return <LinkBubbleMenu />;
              }}
            />
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
