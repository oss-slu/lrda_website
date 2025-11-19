import React, { useEffect, useRef, useState, useMemo } from "react";
import { createPortal } from "react-dom";
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
import { FileX2, SaveIcon, Calendar, MapPin, Music, MessageSquare, X, Download } from "lucide-react";
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
import CommentSidebar from "../comments/CommentSidebar";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import CommentBubble from "../CommentBubble";

const user = User.getInstance();

// Helper function to normalize note IDs (handles both URL format and plain ID)
const normalizeNoteId = (id: string | undefined | null): string | null => {
  if (!id) return null;
  // If it's a URL, extract the ID from it
  if (id.startsWith('http://') || id.startsWith('https://')) {
    // Extract ID from RERUM URL format: .../v1/id/{id} or .../id/{id}
    const match = id.match(/\/(?:v1\/)?id\/([^\/\?]+)/);
    if (match && match[1]) {
      return match[1];
    }
    // Fallback: get the last part of the URL
    const parts = id.split('/');
    return parts[parts.length - 1] || id;
  }
  return id;
};

// Helper function to check if two note IDs match (handles URL and plain formats)
const noteIdsMatch = (id1: string | undefined | null, id2: string | undefined | null): boolean => {
  const normalized1 = normalizeNoteId(id1);
  const normalized2 = normalizeNoteId(id2);
  if (!normalized1 || !normalized2) return false;
  return normalized1 === normalized2;
};

type NoteEditorProps = {
  note?: Note | newNote;
  isNewNote: boolean;
  onNoteDeleted?: () => void; // Add callback for when note is deleted
};

export default function NoteEditor({ note: initialNote, isNewNote, onNoteDeleted }: NoteEditorProps) {
  const { noteState, noteHandlers } = useNoteState(initialNote as Note);
  const updateNote = useNotesStore((state) => state.updateNote);
  const addNote = useNotesStore((state) => state.addNote);
  
  // Get current note ID - try noteState first, then initialNote as fallback
  const currentNoteId = noteState.note?.id || (noteState.note as any)?.["@id"] || ((initialNote && 'id' in initialNote) ? initialNote.id : undefined) || (initialNote as any)?.["@id"];
  
  // Subscribe to notes array - this will trigger re-renders when notes change
  const notes = useNotesStore((state) => state.notes);
  
  // Subscribe to the specific note in the store to force re-renders when it changes
  // Use a selector that will trigger re-renders when the notes array or the specific note changes
  // We compute a hash of the note's content to ensure re-renders when content changes
  // IMPORTANT: This selector depends on state.notes, so it will re-run whenever notes change
  const currentNoteContentHash = useNotesStore((state) => {
    // Get currentNoteId from the closure - this is computed from local state
    // But the selector will re-run whenever state.notes changes
    const noteId = noteState.note?.id || (noteState.note as any)?.["@id"] || 
                   ((initialNote && 'id' in initialNote) ? initialNote.id : undefined) || 
                   (initialNote as any)?.["@id"];
    if (!noteId) return null;
    
    const foundNote = state.notes.find((n) => {
      const noteId1 = n.id;
      const noteId2 = (n as any)["@id"];
      return noteId1 === noteId || noteId2 === noteId || 
             noteIdsMatch(noteId, noteId1) || noteIdsMatch(noteId, noteId2);
    });
    if (!foundNote) return null;
    // Return a hash of the note's content - this will change when the note changes
    return JSON.stringify({
      id: foundNote.id || (foundNote as any)?.["@id"],
      text: foundNote.text || (foundNote as any)?.BodyText,
      title: foundNote.title,
      published: foundNote.published,
      approvalRequested: foundNote.approvalRequested,
      tags: foundNote.tags,
      comments: foundNote.comments?.length || 0,
    });
  });
  
  // Use useMemo to find the current note from the store - this is reactive to both notes and currentNoteId
  const currentNoteFromStore = useMemo(() => {
    if (!currentNoteId) return undefined;
    
    const normalizedCurrentId = normalizeNoteId(currentNoteId);
    
    // Find note by comparing normalized IDs - check both id and @id fields
    // Also do direct string comparison first (fastest and most reliable)
    const found = notes.find((n) => {
      const noteId1 = n.id;
      const noteId2 = (n as any)["@id"];
      // Direct match first (fastest)
      if (noteId1 === currentNoteId || noteId2 === currentNoteId) return true;
      // Then normalized match
      return noteIdsMatch(currentNoteId, noteId1) || noteIdsMatch(currentNoteId, noteId2);
    });
    
    // Debug logging
    if (!found && notes.length > 0) {
      const firstNote = notes[0];
      const firstNoteId1 = firstNote?.id;
      const firstNoteId2 = (firstNote as any)?.["@id"];
      console.log("🔍 useMemo: Note not found", {
        currentNoteId,
        normalizedCurrentId,
        noteStateNoteId: noteState.note?.id || (noteState.note as any)?.["@id"],
        initialNoteId: ((initialNote && 'id' in initialNote) ? initialNote.id : undefined) || (initialNote as any)?.["@id"],
        storeNotesCount: notes.length,
        firstStoreNote: {
          id: firstNoteId1,
          "@id": firstNoteId2,
          normalizedId1: normalizeNoteId(firstNoteId1),
          normalizedId2: normalizeNoteId(firstNoteId2),
          directMatchId: firstNoteId1 === currentNoteId,
          directMatchAtId: firstNoteId2 === currentNoteId,
          normalizedMatchId: noteIdsMatch(currentNoteId, firstNoteId1),
          normalizedMatchAtId: noteIdsMatch(currentNoteId, firstNoteId2),
        },
        allStoreNoteIds: notes.slice(0, 3).map(n => ({
          id: n.id,
          "@id": (n as any)["@id"],
          normalizedId: normalizeNoteId(n.id || (n as any)["@id"]),
          directMatch: (n.id === currentNoteId) || ((n as any)["@id"] === currentNoteId),
        })),
      });
    } else if (found) {
      console.log("✅ useMemo: Note found in store", {
        currentNoteId,
        normalizedCurrentId,
        foundNoteId: found.id || (found as any)["@id"],
        foundNoteNormalized: normalizeNoteId(found.id || (found as any)["@id"]),
      });
    }
    
    return found;
  }, [notes, currentNoteId, noteState.note?.id, (initialNote && 'id' in initialNote) ? initialNote.id : undefined]);
  const rteRef = useRef<RichTextEditorRef>(null);

  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [loadingTags, setLoadingTags] = useState<boolean>(false);
  // Auto-save state (from main)
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedSnapshotRef = useRef<{ title: string; text: string; tags: any[]; published: boolean; approvalRequested?: boolean; latitude?: string; longitude?: string } | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(isNewNote);
  // Teacher-student state (from december-sprint)
  const [instructorId, setInstructorId] = useState<string | null>(null);
  const [isStudent, setIsStudent] = useState<boolean>(false);
  const [isInstructorUser, setIsInstructorUser] = useState<boolean>(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Check if instructor is viewing a student's note (not their own)
  const isViewingStudentNote = useMemo(() => {
    const result = !!(isInstructorUser && userId && noteState.note?.creator && noteState.note.creator !== userId);
    console.log("🔍 isViewingStudentNote calculation:", {
      isInstructorUser,
      userId,
      noteCreator: noteState.note?.creator,
      result,
      areEqual: noteState.note?.creator === userId
    });
    return result;
  }, [isInstructorUser, userId, noteState.note?.creator]);

  // Check if student is viewing their own note (to see instructor comments/feedback)
  const isStudentViewingOwnNote = useMemo(() => {
    const result = !!(isStudent && userId && noteState.note?.creator && noteState.note.creator === userId);
    console.log("🔍 isStudentViewingOwnNote calculation:", {
      isStudent,
      userId,
      noteCreator: noteState.note?.creator,
      result,
      areEqual: noteState.note?.creator === userId
    });
    return result;
  }, [isStudent, userId, noteState.note?.creator]);
  const [selectedFileType, setSelectedFileType] = useState<"pdf" | "docx">("pdf");
  const [isDownloadPopoverOpen, setIsDownloadPopoverOpen] = useState<boolean>(false);
  // Comment sidebar state
  const [isCommentSidebarOpen, setIsCommentSidebarOpen] = useState<boolean>(false);
  const [canComment, setCanComment] = useState<boolean>(false);
  // Comment bubble state for text selection
  const [showCommentBubble, setShowCommentBubble] = useState<boolean>(false);
  const [commentBubblePosition, setCommentBubblePosition] = useState<{ top: number; left: number } | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingPausedRef = useRef<boolean>(false);
  const lastEditTimeRef = useRef<number>(Date.now());
  const lastSyncedNoteRef = useRef<string>(""); // Store serialized version of last synced note

  const titleRef = useRef<HTMLInputElement | null>(null);

  const dateRef = useRef<HTMLDivElement | null>(null);
  const deleteRef = useRef<HTMLButtonElement | null>(null);
  const locationRef = useRef<HTMLDivElement | null>(null);

  // Log render with current note info to track re-renders
  console.log("NoteEditor render", {
    currentNoteId,
    notesCount: notes.length,
    currentNoteContentHash: currentNoteContentHash?.substring(0, 50),
    hasCurrentNoteInStore: !!currentNoteContentHash,
  });

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
        const intro = introJs.tour();
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
    const fetchUserDetails = async () => {
      console.log("🔍 fetchUserDetails: Starting...");
      const roles = await user.getRoles();
      const fetchedUserId = await user.getId();
      console.log("🔍 fetchUserDetails: Got userId and roles", { fetchedUserId, roles });
      
      if (!fetchedUserId) {
        console.log("⚠️ fetchUserDetails: No userId, returning early");
        return;
      }
      
      // Fetch userData to check isInstructor flag
      let userData = null;
      try {
        userData = await ApiService.fetchUserData(fetchedUserId);
        console.log("🔍 fetchUserDetails: Fetched userData", userData);
      } catch (error) {
        console.error("❌ Error fetching user data:", error);
      }
      
      // Check if user is an instructor (has administrator role OR isInstructor flag in userData)
      // Allow commenting for administrators even if isInstructor flag isn't set
      const isInstr = !!roles?.administrator || !!userData?.isInstructor;
      setIsInstructorUser(isInstr);
      const isStudentRole = !!roles?.contributor && !roles?.administrator;
      
      // Check if student is part of teacher-student relationship
      let isStudentInTeacherStudentModel = false;
      if (isStudentRole && userData) {
        // Student must have parentInstructorId to be part of teacher-student model
        isStudentInTeacherStudentModel = !!userData?.parentInstructorId;
      }
      
      setIsStudent(isStudentInTeacherStudentModel);
      setUserId(fetchedUserId);
      // Set instructorId from userData if available, otherwise use fetchedUserId if instructor
      setInstructorId(isInstr ? fetchedUserId : null);
      
      // Determine if user can comment/view comments:
      // - Administrators OR instructors with isInstructor flag (can comment on student notes)
      // - Students viewing their own notes (can view instructor comments/feedback)
      const canCommentValue = !!fetchedUserId && (
        !!roles?.administrator || 
        !!userData?.isInstructor || 
        isStudentInTeacherStudentModel
      );
      setCanComment(canCommentValue);
      
      // Debug logging
      console.log("✅ Comment button debug:", {
        fetchedUserId,
        roles: roles,
        userData: userData,
        isInstr,
        isStudentInTeacherStudentModel,
        canComment: canCommentValue,
        noteId: noteState.note?.id,
        isAdministrator: !!roles?.administrator,
        hasIsInstructorFlag: !!userData?.isInstructor,
        noteCreator: noteState.note?.creator
      });
    };
    fetchUserDetails();
  }, [noteState.note?.id, noteState.note?.creator]); // Re-run when note or creator changes to ensure canComment is set correctly

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

      // Reset the sync ref when a new note is loaded
      lastSyncedNoteRef.current = "";
      lastEditTimeRef.current = Date.now();
    }
  }, [initialNote]);

  // Watch for updates to the current note in the store and sync immediately
  // Also watch initialNote prop for changes (important for instructor review mode)
  useEffect(() => {
    // Only sync if we have a note ID (not a new note)
    const currentNoteId = noteState.note?.id || (noteState.note as any)?.["@id"] || ((initialNote && 'id' in initialNote) ? initialNote.id : undefined) || (initialNote as any)?.["@id"];
    if (!currentNoteId) {
      lastSyncedNoteRef.current = "";
      return;
    }

    // First, check if initialNote has changed (important for instructor review mode where notes come from localNotes)
    let sourceNote: Note | undefined = undefined;
    if (initialNote && 'id' in initialNote) {
      const initialNoteId = initialNote.id || (initialNote as any)?.["@id"];
      if (initialNoteId && (initialNoteId === currentNoteId || noteIdsMatch(initialNoteId, currentNoteId))) {
        sourceNote = initialNote as Note;
      }
    }

    // If not found in initialNote, try to find in the store
    if (!sourceNote) {
      sourceNote = notes.find((n) => {
        const noteId1 = n.id;
        const noteId2 = (n as any)["@id"];
        // Direct match first (fastest)
        if (noteId1 === currentNoteId || noteId2 === currentNoteId) return true;
        // Then normalized match
        return noteIdsMatch(currentNoteId, noteId1) || noteIdsMatch(currentNoteId, noteId2);
      });
    }

    if (!sourceNote) {
      // Only log once per render to avoid spam
      if ((notes.length > 0 || initialNote) && !lastSyncedNoteRef.current) {
        console.log("⚠️ Note not found in store or initialNote (sync effect):", {
          currentNoteId,
          normalizedCurrentId: normalizeNoteId(currentNoteId),
          storeNotesCount: notes.length,
          hasInitialNote: !!initialNote,
          initialNoteId: initialNote && 'id' in initialNote ? (initialNote.id || (initialNote as any)?.["@id"]) : undefined,
        });
      }
      return;
    }

    const storeNote = sourceNote;

    // Handle both text and BodyText formats
    const storeNoteText = storeNote.text || (storeNote as any).BodyText || "";
    const storeNoteId = normalizeNoteId(storeNote.id || (storeNote as any)["@id"]) || "";

    // Create a serialized version of the store note for comparison
    // Only include fields that might change externally
    const storeNoteKey = JSON.stringify({
      id: storeNoteId,
      published: storeNote.published,
      approvalRequested: storeNote.approvalRequested,
      tags: storeNote.tags,
      comments: storeNote.comments?.length || 0,
      text: storeNoteText,
      title: storeNote.title,
    });

    // Check if this is a different version than what we last synced
    const hasChanged = storeNoteKey !== lastSyncedNoteRef.current;

    if (hasChanged) {
      // Check if user has edited recently (within last 2 seconds)
      const timeSinceLastEdit = Date.now() - lastEditTimeRef.current;
      const shouldUpdate = timeSinceLastEdit > 2000; // 2 seconds grace period

      if (shouldUpdate) {
        console.log("🔄 Syncing note from store:", {
          noteId: storeNoteId,
          published: storeNote.published,
          approvalRequested: storeNote.approvalRequested,
          timeSinceLastEdit,
          hasText: !!storeNoteText,
          hasBodyText: !!(storeNote as any).BodyText,
          currentEditorContent: noteState.editorContent.substring(0, 50),
          storeNoteText: storeNoteText.substring(0, 50),
        });

        // Update the note object first
        noteHandlers.setNote(storeNote);

        // Update fields that might have changed externally
        // For title and text, only update if user hasn't edited recently (5 seconds)
        if (storeNote.title !== noteState.title && timeSinceLastEdit > 5000) {
          noteHandlers.setTitle(storeNote.title);
        }
        if (storeNoteText !== noteState.editorContent && timeSinceLastEdit > 5000) {
          console.log("📝 Updating editor content from store");
          // Update editor content via state
          noteHandlers.setEditorContent(storeNoteText);
          // Also update the editor directly if it's available
          const editor = rteRef.current?.editor;
          if (editor) {
            const currentHtml = editor.getHTML();
            if (currentHtml !== storeNoteText) {
              console.log("✏️ Updating editor directly via API");
              editor.commands.setContent(storeNoteText);
            }
          }
          // Increment counter to force RichTextEditor re-render
          noteHandlers.setCounter((prev) => prev + 1);
        }

        // Always update these as they're less likely to conflict with user edits
        if (storeNote.published !== noteState.isPublished) {
          noteHandlers.setIsPublished(storeNote.published || false);
        }
        if (storeNote.approvalRequested !== noteState.approvalRequested) {
          noteHandlers.setApprovalRequested(storeNote.approvalRequested || false);
        }
        if (JSON.stringify(storeNote.tags) !== JSON.stringify(noteState.tags)) {
          noteHandlers.setTags(storeNote.tags || []);
        }

        // Update media if it changed
        const storeImages = (storeNote.media || []).filter((item: any) => item.getType?.() === "image") as PhotoType[];
        const storeVideos = (storeNote.media || []).filter((item: any) => item.getType?.() === "video") as VideoType[];
        if (JSON.stringify(storeImages) !== JSON.stringify(noteState.images)) {
          noteHandlers.setImages(storeImages);
        }
        if (JSON.stringify(storeVideos) !== JSON.stringify(noteState.videos)) {
          noteHandlers.setVideos(storeVideos);
        }
        if (JSON.stringify(storeNote.audio) !== JSON.stringify(noteState.audio)) {
          noteHandlers.setAudio(storeNote.audio || []);
        }

        // Update the ref to track what we've synced
        lastSyncedNoteRef.current = storeNoteKey;
      } else {
        console.log("⏸️ Skipping sync - user edited recently", { timeSinceLastEdit });
      }
    } else {
      // If no changes detected, still update the ref if it's empty (initial sync)
      if (!lastSyncedNoteRef.current) {
        lastSyncedNoteRef.current = storeNoteKey;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes, currentNoteId, noteState.note?.id, noteState.editorContent, initialNote]);

  // Watch for external content changes and update the editor
  useEffect(() => {
    const editor = rteRef.current?.editor;
    if (!editor) return;

    const currentEditorContent = editor.getHTML();
    const stateContent = noteState.editorContent || "";

    // Only update if content changed externally (not from user typing)
    // Check if the editor content differs from state content
    if (currentEditorContent !== stateContent) {
      // Check if user hasn't edited recently (within last 2 seconds)
      const timeSinceLastEdit = Date.now() - lastEditTimeRef.current;
      
      // Only update if it's been more than 2 seconds since last edit
      // This prevents overwriting active user edits
      if (timeSinceLastEdit > 2000) {
        console.log("🔄 Updating RichTextEditor content from external change:", {
          currentEditorContent: currentEditorContent.substring(0, 50),
          stateContent: stateContent.substring(0, 50),
          timeSinceLastEdit,
        });
        
        // Update the editor content
        editor.commands.setContent(stateContent);
      }
    }
  }, [noteState.editorContent]);

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

  // Track text selection and show comment bubble
  // Only show when instructor is viewing a student's note (not their own)
  useEffect(() => {
    const editor = rteRef.current?.editor;
    // Show bubble when: can comment AND (instructor viewing student note OR student viewing own note)
    if (!editor || !canComment || (!isViewingStudentNote && !isStudentViewingOwnNote)) {
      setShowCommentBubble(false);
      return;
    }

    const updateBubblePosition = () => {
      const { from, to } = editor.state.selection;
      const hasSelection = from !== to;

      if (hasSelection) {
        try {
          // Get the bounding rectangle of the selected text using the editor's view
          const { $anchor, $head } = editor.state.selection;
          const startPos = Math.min($anchor.pos, $head.pos);
          const endPos = Math.max($anchor.pos, $head.pos);
          
          // Get DOM coordinates
          const startDom = editor.view.domAtPos(startPos);
          const endDom = editor.view.domAtPos(endPos);
          
          const startNode = startDom.node as HTMLElement;
          const endNode = endDom.node as HTMLElement;
          
          if (startNode && endNode) {
            // Get the range for the selection
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
              const range = selection.getRangeAt(0);
              const rect = range.getBoundingClientRect();
              const editorContainer = editor.view.dom.closest('.ProseMirror')?.getBoundingClientRect();
              
              if (editorContainer && rect.width > 0 && rect.height > 0) {
                // Position bubble above the selection, slightly to the right
                // Use absolute positioning relative to the editor container
                // The bubble is inside a relative container, so it will scroll with content
                const top = rect.top - editorContainer.top - 45; // 45px above selection
                const left = rect.right - editorContainer.left + 10; // 10px to the right
                
                setCommentBubblePosition({ top, left });
                setShowCommentBubble(true);
              }
            }
          }
        } catch (error) {
          console.error("Error calculating comment bubble position:", error);
          setShowCommentBubble(false);
        }
      } else {
        setShowCommentBubble(false);
      }
    };

    // Listen to selection changes via editor events
    const handleSelectionUpdate = () => {
      // Small delay to ensure DOM is updated
      setTimeout(updateBubblePosition, 10);
    };
    
    // Also listen to scroll events to update bubble position
    const handleScroll = () => {
      if (showCommentBubble) {
        updateBubblePosition();
      }
    };
    
    editor.on('selectionUpdate', handleSelectionUpdate);
    
    // Also listen to mouseup to catch selection changes
    const handleMouseUp = () => {
      setTimeout(updateBubblePosition, 10);
    };
    
    const editorElement = editor.view.dom;
    const scrollContainer = editorElement.closest('[data-radix-scroll-area-viewport]') || 
                           editorElement.closest('.overflow-auto') ||
                           editorElement.closest('.ScrollArea') ||
                           editorElement.parentElement;
    
    editorElement.addEventListener('mouseup', handleMouseUp);
    editorElement.addEventListener('keyup', handleSelectionUpdate);
    
    // Listen to scroll events on the scroll container
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    }

    return () => {
      editor.off('selectionUpdate', handleSelectionUpdate);
      editorElement.removeEventListener('mouseup', handleMouseUp);
      editorElement.removeEventListener('keyup', handleSelectionUpdate);
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleScroll);
      }
    };
  }, [canComment, isViewingStudentNote, isStudentViewingOwnNote, showCommentBubble]);

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
            latitude: noteState.latitude,
            longitude: noteState.longitude,
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
    // Skip auto-save if instructor is viewing a student's note (read-only mode)
    if (!noteState.note?.id || !hasContent || isViewingStudentNote) {
      return;
    }

    const last = lastSavedSnapshotRef.current;
    const isDirty =
      !last ||
      last.title !== noteState.title ||
      last.text !== noteState.editorContent ||
      last.published !== noteState.isPublished ||
      last.approvalRequested !== noteState.approvalRequested ||
      last.latitude !== noteState.latitude ||
      last.longitude !== noteState.longitude ||
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

          // Update the store with the full note object after successful save
          // This ensures the store has the latest data and triggers re-renders
          updateNote(noteState.note.id, {
            ...updatedNote,
            // Ensure we preserve the note object structure
            media: updatedNote.media || [],
            audio: updatedNote.audio || [],
          });

          lastSavedSnapshotRef.current = {
            title: noteState.title,
            text: noteState.editorContent,
            tags: noteState.tags,
            published: noteState.isPublished,
            approvalRequested: noteState.approvalRequested,
            latitude: noteState.latitude,
            longitude: noteState.longitude,
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
    noteState.latitude,
    noteState.longitude,
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

  const handleDownload = async (fileType?: "pdf" | "docx") => {
    const typeToUse = fileType || selectedFileType;
    if (!typeToUse) {
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

    if (typeToUse === "pdf") {
      // Generate PDF using jsPDF (dynamically import to avoid canvas in tests)
      const { default: jsPDF } = await import("jspdf");
      const pdf = new jsPDF();
      pdf.text(noteContent, 10, 10); // Add text to the PDF
      pdf.save(`${noteState.title || "note"}.pdf`); // Save the PDF file
    } else if (typeToUse === "docx") {
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

    toast(`Your note has been downloaded as ${typeToUse.toUpperCase()}`);
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

  // Polling effect: Check for updates to the current note from the store
  useEffect(() => {
    // Only poll if we have a note ID (not a new note)
    if (!noteState.note?.id) {
      return;
    }

    // Polling interval: 15 seconds (same as sidebar)
    const POLLING_INTERVAL = 15000;

    // Handle page visibility to pause/resume polling
    const handleVisibilityChange = () => {
      isPollingPausedRef.current = document.hidden;
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Setup polling interval
    const startPolling = () => {
      // Clear any existing interval
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }

      pollingIntervalRef.current = setInterval(() => {
        // Only poll if page is visible
        if (isPollingPausedRef.current) {
          return;
        }

        // Find the current note in the store
        const storeNote = notes.find((n) => n.id === noteState.note?.id);
        
        if (!storeNote) {
          return; // Note not found in store, might have been deleted
        }

        // Only update if:
        // 1. User hasn't edited in the last 2 seconds (to avoid overwriting active edits)
        // 2. The note in the store is different from the current note state
        const timeSinceLastEdit = Date.now() - lastEditTimeRef.current;
        const shouldUpdate = timeSinceLastEdit > 2000; // 2 seconds grace period

        if (shouldUpdate) {
          // Check if any important fields have changed
          const hasChanges = 
            storeNote.title !== noteState.title ||
            storeNote.text !== noteState.editorContent ||
            storeNote.published !== noteState.isPublished ||
            storeNote.approvalRequested !== noteState.approvalRequested ||
            JSON.stringify(storeNote.tags) !== JSON.stringify(noteState.tags) ||
            storeNote.comments?.length !== (noteState.note?.comments?.length || 0);

          if (hasChanges) {
            // Update the note state with the latest from store
            // Only update non-editable fields to avoid disrupting user's current edits
            noteHandlers.setNote(storeNote);
            
            // Update fields that might have changed externally (comments, approval status, etc.)
            // but preserve the user's current title and text if they're actively editing
            if (storeNote.title !== noteState.title && timeSinceLastEdit > 5000) {
              noteHandlers.setTitle(storeNote.title);
            }
            if (storeNote.text !== noteState.editorContent && timeSinceLastEdit > 5000) {
              noteHandlers.setEditorContent(storeNote.text || "");
            }
            
            // Always update these as they're less likely to conflict with user edits
            noteHandlers.setIsPublished(storeNote.published || false);
            noteHandlers.setApprovalRequested(storeNote.approvalRequested || false);
            noteHandlers.setTags(storeNote.tags || []);
          }
        }
      }, POLLING_INTERVAL);
    };

    startPolling();

    // Cleanup on unmount
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [noteState.note?.id, notes, noteState.title, noteState.editorContent, noteState.isPublished, noteState.approvalRequested, noteState.tags, noteHandlers]);

  // Create a unique key for the panel group based on whether comment sidebar is open
  // This forces a remount when the structure changes, preventing layout restoration errors
  const panelGroupKey = `${noteState.note?.id || 'new'}-${canComment && isCommentSidebarOpen && (isViewingStudentNote || isStudentViewingOwnNote) ? 'open' : 'closed'}`;

  return (
    <>
    <div className="relative h-full w-full min-h-0 bg-white transition-all duration-300 ease-in-out">
      <ResizablePanelGroup 
        key={panelGroupKey}
        direction="horizontal" 
        className="w-full h-full"
      >
        <ResizablePanel
          defaultSize={canComment && isCommentSidebarOpen && (isViewingStudentNote || isStudentViewingOwnNote) && noteState.note?.id ? 70 : 100}
          minSize={45}
          maxSize={canComment && isCommentSidebarOpen && (isViewingStudentNote || isStudentViewingOwnNote) && noteState.note?.id ? 85 : 100}
          className="flex flex-col min-w-[420px] transition-[flex-basis] duration-200 ease-out"
        >
          <ScrollArea className="flex flex-col w-full h-full min-h-0">
        <div aria-label="Top Bar" className="w-full flex flex-col px-8 pt-8">
          <Input
            id="note-title-input"
            value={noteState.title}
            onChange={(e) => {
              lastEditTimeRef.current = Date.now();
              handleTitleChange(noteHandlers.setTitle, e);
            }}
            placeholder="Untitled"
            disabled={isViewingStudentNote}
            readOnly={isViewingStudentNote}
            className={`border-0 p-0 font-bold text-3xl bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-gray-400 transition-all duration-200 ease-in-out ${
              isViewingStudentNote ? "cursor-default opacity-90" : ""
            }`}
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
              isInstructorReview={isViewingStudentNote}
            />

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  disabled={!noteState.note?.id || isSaving || isViewingStudentNote}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={isViewingStudentNote ? "Cannot delete student notes" : (!noteState.note?.id ? "Please wait for note to save before deleting" : "Delete this note")}
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
                  disabled={isViewingStudentNote}
                  // Allow viewing time even when disabled (read-only mode for instructors)
                />
              </div>
              <div ref={locationRef}>
                <LocationPicker
                  long={noteState.longitude}
                  lat={noteState.latitude}
                  onLocationChange={(newLong, newLat) => {
                    handleLocationChange(noteHandlers.setLongitude, noteHandlers.setLatitude, newLong, newLat);
                    // Autosave will be triggered automatically by the useEffect that watches noteState changes
                    lastEditTimeRef.current = Date.now();
                  }}
                  disabled={isViewingStudentNote}
                  // Allow viewing location even when disabled (read-only mode for instructors)
                />
              </div>
              <Popover open={isDownloadPopoverOpen} onOpenChange={setIsDownloadPopoverOpen}>
                <PopoverTrigger asChild>
                  <button
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors group"
                    aria-label="Download note"
                    // Download is always enabled - instructors can download student notes
                  >
                    <Download aria-label="download" className="h-4 w-4 text-gray-700 group-hover:text-blue-600" />
                    <span>Download</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-2" align="end">
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={async () => {
                        setIsDownloadPopoverOpen(false);
                        await handleDownload("pdf");
                      }}
                      className="w-full px-3 py-2 text-sm text-left text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    >
                      Download as PDF
                    </button>
                    <button
                      onClick={async () => {
                        setIsDownloadPopoverOpen(false);
                        await handleDownload("docx");
                      }}
                      className="w-full px-3 py-2 text-sm text-left text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    >
                      Download as DOCX
                    </button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="mt-2">
            <TagManager
              inputTags={noteState.tags}
              suggestedTags={suggestedTags}
              onTagsChange={
                (newTags) => {
                  lastEditTimeRef.current = Date.now();
                  handleTagsChange(noteHandlers.setTags, newTags);
                }
              }
              fetchSuggestedTags={fetchSuggestedTags}
              disabled={isViewingStudentNote}
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
          <div className="bg-white w-full relative">
            {/* Comment Bubble - Shows when text is selected (only when instructor is viewing student notes) */}
            {showCommentBubble && commentBubblePosition && canComment && (isViewingStudentNote || isStudentViewingOwnNote) && (
              <CommentBubble
                onClick={() => {
                  // Open comment sidebar and focus on adding a comment
                  setIsCommentSidebarOpen(true);
                  setShowCommentBubble(false);
                  // The CommentSidebar will use getCurrentSelection to get the selected text
                }}
                top={commentBubblePosition.top}
                left={commentBubblePosition.left}
              />
            )}
            <RichTextEditor
              key={`${noteState.note?.id ?? "new"}-${noteState.title}-${noteState.counter}`}
              ref={rteRef}
              className="min-h-[400px] prose prose-lg max-w-none"
              extensions={extensions}
              content={noteState.editorContent}
              immediatelyRender={false}
              editable={!isViewingStudentNote}
              onUpdate={({ editor }) => {
                if (!isViewingStudentNote) {
                  lastEditTimeRef.current = Date.now();
                  handleEditorChange(noteHandlers.setEditorContent, editor.getHTML());
                }
              }}
              renderControls={() => isViewingStudentNote ? null : (
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
        </ResizablePanel>
        {!!noteState.note?.id && canComment && isCommentSidebarOpen && (isViewingStudentNote || isStudentViewingOwnNote) && (
          <>
            <ResizableHandle withHandle className="bg-gray-200 hover:bg-gray-300 cursor-col-resize w-[6px]" />
            <ResizablePanel
              defaultSize={30}
              minSize={20}
              maxSize={40}
              className="md:border-l min-w-[280px] md:min-w-[300px] lg:min-w-[340px] transition-[flex-basis] duration-200 ease-out"
            >
              <CommentSidebar
                noteId={noteState.note.id as string}
                getCurrentSelection={() => {
                  const editor = rteRef.current?.editor;
                  if (!editor) return null;
                  const { from, to } = editor.state.selection;
                  if (from === to) return null; // require a non-empty selection
                  return { from, to };
                }}
              />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
    {/* Sticky Comment Toggle Button - Rendered via portal to ensure it's above all relative containers */}
    {(() => {
      // Show comment button when:
      // 1. Instructor viewing a student's note (to give feedback), OR
      // 2. Student viewing their own note (to see instructor feedback)
      const shouldShow = typeof window !== 'undefined' && !!noteState.note?.id && canComment && (isViewingStudentNote || isStudentViewingOwnNote);
      if (shouldShow) {
        console.log("✅ Rendering comment button via portal", { 
          noteId: noteState.note?.id, 
          canComment,
          isViewingStudentNote,
          isStudentViewingOwnNote
        });
      } else {
        console.log("❌ Comment button NOT showing:", {
          isClient: typeof window !== 'undefined',
          hasNoteId: !!noteState.note?.id,
          canComment,
          isViewingStudentNote,
          isStudentViewingOwnNote,
          noteId: noteState.note?.id,
          noteCreator: noteState.note?.creator,
          userId: userId,
          isInstructorUser: isInstructorUser,
          isStudent: isStudent
        });
      }
      return shouldShow ? createPortal(
        <button
          onClick={() => setIsCommentSidebarOpen(!isCommentSidebarOpen)}
          className="fixed top-20 right-4 z-[9999] bg-blue-500 hover:bg-blue-600 text-white rounded-full p-3 shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
          aria-label={isCommentSidebarOpen ? "Close comments" : "Open comments"}
        >
          {isCommentSidebarOpen ? (
            <>
              <X className="w-4 h-4" />
              <span className="hidden sm:inline text-sm">Close</span>
            </>
          ) : (
            <>
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline text-sm">Comments</span>
            </>
          )}
        </button>,
        document.body
      ) : null;
    })()}
    </>
  );
}
