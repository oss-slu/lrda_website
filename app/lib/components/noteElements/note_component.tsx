import React, { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import TimePicker from "./time_picker";
import { LinkBubbleMenu, RichTextEditor, type RichTextEditorRef } from "mui-tiptap";
import TagManager from "./tag_manager";
import LocationPicker from "./location_component";
import EditorMenuControls from "../editor_menu_controls";
import useExtensions from "../../utils/use_extensions";
import { User } from "../../models/user_class";
import { Document, Packer, Paragraph } from "docx"; // For DOCX
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
  handleDeleteNote as handleArchiveNote,
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
// intro.js will be loaded dynamically to avoid SSR issues
import type { NoteStateType, NoteHandlersType } from "./note_state";

import { Button } from "@/components/ui/button";
import { newNote, Note } from "@/app/types"; // make sure types are imported
import { useNotesStore } from "../../stores/notesStore";

const user = User.getInstance();

type NoteEditorProps = {
  note?: Note | newNote;
  isNewNote: boolean;
  onNoteDeleted?: () => void; // Add callback for when note is deleted
};

export default function NoteEditor({ note: initialNote, isNewNote, onNoteDeleted }: NoteEditorProps) {
  const { noteState, noteHandlers } = useNoteState(initialNote as Note);
  const updateNote = useNotesStore((state) => state.updateNote);
  const addNote = useNotesStore((state) => state.addNote);
  const rteRef = useRef<RichTextEditorRef>(null);

  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [loadingTags, setLoadingTags] = useState<boolean>(false);
  // Auto-save state (from main)
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedSnapshotRef = useRef<{ title: string; text: string; tags: any[]; published: boolean; approvalRequested?: boolean } | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(isNewNote);
  // Teacher-student state (from december-sprint)
  const [instructorId, setInstructorId] = useState<string | null>(null);
  const [isStudent, setIsStudent] = useState<boolean>(false);
  const [isInstructorUser, setIsInstructorUser] = useState<boolean>(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedFileType, setSelectedFileType] = useState<"pdf" | "docx">("pdf");

  const titleRef = useRef<HTMLInputElement | null>(null);

  const dateRef = useRef<HTMLDivElement | null>(null);
  const deleteRef = useRef<HTMLButtonElement | null>(null);
  const locationRef = useRef<HTMLDivElement | null>(null);

  console.log("NoteEditor render");

  const extensions = useExtensions({
    placeholder: "Add your own content here...",
  });

  const getCookie = (name: string) => {
    if (typeof window === 'undefined') return null;
    const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
    return match ? match[2] : null;
  };

  // Helper function to set a cookie
  const setCookie = (name: string, value: string, days: number) => {
    if (typeof window === 'undefined') return;
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value}; path=/; expires=${date.toUTCString()}`;
  };

  useEffect(() => {
    if (typeof window === 'undefined') return; // Skip SSR

    const observer = new MutationObserver(async () => {
      const addNote = document.getElementById("add-note-button");
      const title = titleRef.current;
      const deleteButton = deleteRef.current;
      const date = dateRef.current;
      const location = locationRef.current;

      // Check if all elements are present
      if (addNote && title && deleteButton && date && location) {
        // Dynamically import intro.js only on client side
        const introJs = (await import("intro.js")).default;
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
                intro: "If you don't like your note, you can delete it here.",
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
    const initRoleFlags = async () => {
      const roles = await user.getRoles();
      const isInstr = await user.isInstructor();
      setIsInstructorUser(!!isInstr);
      setIsStudent(!!roles?.contributor && !roles?.administrator);
      const fetchedInstructorId = await user.getInstructorId();
      setInstructorId(fetchedInstructorId);
      const fetchedUserId = await user.getId();
      setUserId(fetchedUserId);
    };
    initRoleFlags();
  }, []);

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
      noteHandlers.setApprovalRequested(initialNote.approvalRequested || false);
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
      const t = setTimeout(() => editor.chain().focus("start").run(), 0);
      return () => clearTimeout(t);
    }
  }, [noteState.note?.id]);

  useEffect(() => {
    if (initialNote) {
      noteHandlers.setNote(initialNote as Note);
    }
  }, [initialNote]);

  // Auto-save effect: saves note 2 seconds after user stops typing, only if dirty and non-blank
  useEffect(() => {
    // Clear any existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Compute content state
    const titleTrim = (noteState.title || "").trim();
    const textTrim = (noteState.editorContent || "").trim();
    const hasContent =
      titleTrim.length > 0 ||
      textTrim.length > 0 ||
      noteState.images.length > 0 ||
      noteState.videos.length > 0 ||
      noteState.audio.length > 0;

    // If this is a brand new note (no ID yet), create it in DB on first meaningful content
    if (isCreatingNew && !noteState.note?.id && hasContent) {
      autoSaveTimerRef.current = setTimeout(async () => {
        setIsSaving(true);
        try {
          const newNoteData: any = {
            title: noteState.title || "Untitled",
            text: noteState.editorContent,
            time: noteState.time,
            media: [...noteState.images, ...noteState.videos],
            audio: noteState.audio,
            creator: await user.getId(),
            latitude: noteState.latitude,
            longitude: noteState.longitude,
            published: noteState.isPublished,
            approvalRequested: noteState.approvalRequested || false,
            tags: noteState.tags,
            isArchived: false,
          };

          const response = await ApiService.writeNewNote(newNoteData);
          if (!response.ok) throw new Error("Failed to create note");

          const data = await response.json();
          const noteId = data["@id"] || data.id;
          if (!noteId) throw new Error("No ID returned");

          const savedNote = {
            ...newNoteData,
            id: noteId,
            uid: data.uid || noteId,
          };

          // Update local state and store
          noteHandlers.setNote(savedNote as Note);
          addNote(savedNote as Note);
          setIsCreatingNew(false);
          lastSavedSnapshotRef.current = {
            title: noteState.title,
            text: noteState.editorContent,
            tags: noteState.tags,
            published: noteState.isPublished,
            approvalRequested: noteState.approvalRequested,
          };

          toast("Note Created", { description: "Your note has been saved.", duration: 2000 });
        } catch (error) {
          console.error("Error creating note:", error);
          toast("Error", { description: "Failed to create note.", duration: 4000 });
        } finally {
          setIsSaving(false);
        }
      }, 500);
      return () => {
        if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      };
    }

    // For existing notes: auto-save only if dirty and has content
    if (!noteState.note?.id || !hasContent) {
      return;
    }

    const last = lastSavedSnapshotRef.current;
    const isDirty =
      !last ||
      last.title !== noteState.title ||
      last.text !== noteState.editorContent ||
      last.published !== noteState.isPublished ||
      last.approvalRequested !== noteState.approvalRequested ||
      JSON.stringify(last.tags) !== JSON.stringify(noteState.tags);

    // Update the store for instant UI updates
    if (noteState.note?.id) {
      updateNote(noteState.note.id, {
        title: noteState.title || "Untitled",
        text: noteState.editorContent,
        tags: noteState.tags,
        published: noteState.isPublished,
        time: noteState.time,
        latitude: noteState.latitude,
        longitude: noteState.longitude,
      });
    }

    if (!isDirty) {
      return; // Skip if nothing changed
    }

    // Set a new timer to auto-save to API after 500ms of inactivity
    autoSaveTimerRef.current = setTimeout(async () => {
      if (noteState.note?.id && !isSaving) {
        setIsSaving(true);

        const updatedNote: any = {
          ...noteState.note,
          text: noteState.editorContent,
          title: noteState.title || "Untitled",
          media: [...noteState.images, ...noteState.videos],
          published: noteState.isPublished,
          approvalRequested: noteState.approvalRequested || false,
          time: noteState.time,
          longitude: noteState.longitude,
          latitude: noteState.latitude,
          tags: noteState.tags,
          audio: noteState.audio,
          id: noteState.note.id,
          creator: noteState.note.creator,
        };

        try {
          console.log("Auto-saving note...", updatedNote);
          await ApiService.overwriteNote(updatedNote);

          lastSavedSnapshotRef.current = {
            title: noteState.title,
            text: noteState.editorContent,
            tags: noteState.tags,
            published: noteState.isPublished,
            approvalRequested: noteState.approvalRequested,
          };
        } catch (error) {
          console.error("Auto-save error:", error);
        } finally {
          setIsSaving(false);
        }
      }
    }, 500); // Auto-save after 500ms of inactivity

    // Cleanup function
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [
    noteState.title,
    noteState.editorContent,
    noteState.tags,
    noteState.isPublished,
    noteState.images.length,
    noteState.videos.length,
    noteState.audio.length,
    isCreatingNew,
  ]);

  const handleRequestApprovalClick = async () => {
    try {
      const updatedApprovalStatus = !noteState.approvalRequested;
  
      const updatedNote: any = {
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
        creator: noteState.note?.creator || (await user.getId()),
        approvalRequested: updatedApprovalStatus,
        instructorId: instructorId || null,
        published: false, // Student notes are never published directly
      };
  
      // 1. First update the main note
      const response = await ApiService.overwriteNote(updatedNote);
  
      if (response.ok) {
        if (updatedApprovalStatus && instructorId) {
          // 2. Also send approval request to instructor's Firestore document
          // Include full note data so it persists correctly and doesn't change state on refresh
          await ApiService.requestApproval({
            instructorId: instructorId,
            title: updatedNote.title || "",
            text: updatedNote.text || "",
            creator: updatedNote.creator || "",
            noteId: updatedNote.id || "",
            time: updatedNote.time || new Date(),
            latitude: updatedNote.latitude || "",
            longitude: updatedNote.longitude || "",
            tags: updatedNote.tags || [],
            media: updatedNote.media || [],
            audio: updatedNote.audio || [],
            approvalRequested: true,
          });
        }
  
        // 3. Update local frontend state
        noteHandlers.setApprovalRequested(updatedApprovalStatus);
  
        toast(
          updatedApprovalStatus
            ? "Approval Requested"
            : "Approval Request Canceled",
          {
            description: updatedApprovalStatus
              ? "Your note has been submitted for instructor approval."
              : "Your approval request has been canceled.",
            duration: 4000,
          }
        );
      } else {
        throw new Error("Failed to update approval status in backend.");
      }
    } catch (error) {
      console.error("Error requesting approval:", error);
      toast("Error", {
        description: "Failed to request approval. Please try again later.",
      });
    }
  };

  const handlePublishChange = async (noteState: NoteStateType, noteHandlers: NoteHandlersType) => {
    const creatorId = noteState.note?.creator || (await user.getId());
    const roles = await user.getRoles();
    const isStudentRole = !!roles?.contributor && !roles?.administrator;
    
    const updatedNote: any = {
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
      approvalRequested: isStudentRole ? false : noteState.approvalRequested, // Clear approval for students when publishing
    };

    try {
      await ApiService.overwriteNote(updatedNote);

      noteHandlers.setIsPublished(updatedNote.published);
      noteHandlers.setApprovalRequested(updatedNote.approvalRequested);
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
      // Generate PDF using jsPDF (dynamically import to avoid canvas in tests)
      const { default: jsPDF } = await import("jspdf");
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

  async function handleDeleteNote(noteState: NoteStateType, user: User, noteHandlers: NoteHandlersType) {
    try {
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
        isArchived: true,
      };

      if (noteState.note?.id) {
        updateNote(noteState.note.id, {
          isArchived: true,
        });
      }

      noteHandlers.setNote(updatedNote);

      return await handleArchiveNote(updatedNote, user, noteHandlers.setNote);
    } catch (error) {
      console.error("Error updating note state:", error);
      toast("Error", {
        description: "Failed to update note state. Please try again later.",
        duration: 4000,
      });
    }
    return false;
  }

  return (
    <div className="relative h-full w-full min-h-0 bg-white transition-all duration-300 ease-in-out">
      <ScrollArea className="flex flex-col w-full h-full min-h-0">
        <div aria-label="Top Bar" className="w-full flex flex-col px-8 pt-8">
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
              isApprovalRequested={noteState.approvalRequested || false}
              noteId={noteState.note?.id || ""}
              userId={userId}
              instructorId={instructorId}
              onPublishClick={() => handlePublishChange(noteState, noteHandlers)}
              onRequestApprovalClick={handleRequestApprovalClick}
              isInstructorReview={false}
            />

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  disabled={!noteState.note?.id || isSaving}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={!noteState.note?.id ? "Please wait for note to save before deleting" : "Delete this note"}
                  ref={deleteRef}
                >
                  <FileX2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>This action cannot be undone. This will permanently delete this note.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={async () => {
                      const success = await handleDeleteNote(noteState, user, noteHandlers);

                      if (success && onNoteDeleted) {
                        onNoteDeleted();
                      }
                    }}
                  >
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
          <div className="mt-2">
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
            if (!target.closest(".ProseMirror")) {
              e.preventDefault();
              editor.chain().focus("start").run();
            }
          }}
          onKeyDown={(e) => {
            const editor = rteRef.current?.editor;
            if (!editor) return;
            // When the editor is empty, allow ArrowDown to create a new paragraph so users can "go down"
            if (e.key === "ArrowDown" && editor.isEmpty) {
              e.preventDefault();
              editor.chain().focus().insertContent("<p><br/></p>").run();
            }
          }}
        >
          <div className="bg-white w-full">
            <RichTextEditor
              key={`${noteState.note?.id ?? "new"}-${noteState.title}`}
              ref={rteRef}
              className="min-h-[400px] prose prose-lg max-w-none"
              extensions={extensions}
              content={noteState.editorContent}
              immediatelyRender={false}
              onUpdate={({ editor }) => handleEditorChange(noteHandlers.setEditorContent, editor.getHTML())}
              renderControls={() => (
                <EditorMenuControls
                  onMediaUpload={(media) => {
                    if (media.type === "image") {
                      const defaultWidth = 100; // or "100%" or any px value you want
                      const defaultHeight: number | undefined = undefined; // or set a fixed height like 480

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
