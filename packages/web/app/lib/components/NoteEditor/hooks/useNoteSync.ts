import { useEffect, useRef, useMemo, RefObject, MutableRefObject } from "react";
import { useNotesStore } from "@/app/lib/stores/notesStore";
import { Note, newNote } from "@/app/types";
import { PhotoType, VideoType } from "@/app/lib/models/media_class";
import { normalizeNoteId, noteIdsMatch } from "../utils/noteHelpers";
import type { NoteStateType, NoteHandlersType } from "./useNoteState";
import type { RichTextEditorRef } from "mui-tiptap";

interface UseNoteSyncOptions {
  noteState: NoteStateType;
  noteHandlers: NoteHandlersType;
  initialNote: Note | newNote | undefined;
  rteRef: RefObject<RichTextEditorRef | null>;
  lastEditTimeRef: MutableRefObject<number>;
}

export const useNoteSync = ({
  noteState,
  noteHandlers,
  initialNote,
  rteRef,
  lastEditTimeRef,
}: UseNoteSyncOptions) => {
  const notes = useNotesStore((state) => state.notes);
  const lastSyncedNoteRef = useRef<string>("");
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingPausedRef = useRef<boolean>(false);

  // Store noteHandlers in ref to avoid dependency issues
  const noteHandlersRef = useRef(noteHandlers);
  // eslint-disable-next-line react-hooks/refs -- intentional pattern to keep ref in sync
  noteHandlersRef.current = noteHandlers;

  // Destructure noteState for stable dependencies
  const {
    note,
    title,
    editorContent,
    isPublished,
    approvalRequested,
    tags,
    images,
    videos,
    audio,
  } = noteState;

  const stateNoteId = note?.id;

  // Get current note ID
  const currentNoteId =
    stateNoteId ||
    (note as any)?.["@id"] ||
    (initialNote && "id" in initialNote ? initialNote.id : undefined) ||
    (initialNote as any)?.["@id"];

  // Find current note in store
  const currentNoteFromStore = useMemo(() => {
    if (!currentNoteId) return undefined;

    return notes.find((n) => {
      const noteId1 = n.id;
      const noteId2 = (n as any)["@id"];
      if (noteId1 === currentNoteId || noteId2 === currentNoteId) return true;
      return noteIdsMatch(currentNoteId, noteId1) || noteIdsMatch(currentNoteId, noteId2);
    });
  }, [notes, currentNoteId]);

  // Content hash for change detection
  const currentNoteContentHash = useMemo(() => {
    if (!currentNoteFromStore) return null;
    return JSON.stringify({
      id: currentNoteFromStore.id || (currentNoteFromStore as any)?.["@id"],
      text: currentNoteFromStore.text || (currentNoteFromStore as any)?.BodyText,
      title: currentNoteFromStore.title,
      published: currentNoteFromStore.published,
      approvalRequested: currentNoteFromStore.approvalRequested,
      tags: currentNoteFromStore.tags,
      comments: currentNoteFromStore.comments?.length || 0,
    });
  }, [currentNoteFromStore]);

  // Initialize note from initialNote prop
  useEffect(() => {
    if (initialNote) {
      const handlers = noteHandlersRef.current;
      handlers.setNote(initialNote as Note);
      handlers.setEditorContent(initialNote.text || "");
      handlers.setTitle(initialNote.title || "");
      handlers.setImages((initialNote.media.filter((item) => item.getType() === "image") as PhotoType[]) || []);
      handlers.setTime(initialNote.time || new Date());
      handlers.setLongitude(initialNote.longitude || "");
      handlers.setLatitude(initialNote.latitude || "");
      handlers.setTags((initialNote.tags || []).map((tag) => (typeof tag === "string" ? { label: tag, origin: "user" } : tag)));
      handlers.setAudio(initialNote.audio || []);
      handlers.setIsPublished(initialNote.published || false);
      handlers.setApprovalRequested(initialNote.approvalRequested || false);
      handlers.setCounter((prevCounter) => prevCounter + 1);
      handlers.setVideos((initialNote.media.filter((item) => item.getType() === "video") as VideoType[]) || []);

      lastSyncedNoteRef.current = "";
      lastEditTimeRef.current = Date.now();
    }
  }, [initialNote, lastEditTimeRef]);

  // Sync from store/initialNote to local state
  useEffect(() => {
    if (!currentNoteId) {
      lastSyncedNoteRef.current = "";
      return;
    }

    let sourceNote: Note | undefined = undefined;
    if (initialNote && "id" in initialNote) {
      const initialNoteId = initialNote.id || (initialNote as any)?.["@id"];
      if (initialNoteId && (initialNoteId === currentNoteId || noteIdsMatch(initialNoteId, currentNoteId))) {
        sourceNote = initialNote as Note;
      }
    }

    if (!sourceNote) {
      sourceNote = notes.find((n) => {
        const noteId1 = n.id;
        const noteId2 = (n as any)["@id"];
        if (noteId1 === currentNoteId || noteId2 === currentNoteId) return true;
        return noteIdsMatch(currentNoteId, noteId1) || noteIdsMatch(currentNoteId, noteId2);
      });
    }

    if (!sourceNote) {
      return;
    }

    const storeNote = sourceNote;
    const storeNoteText = storeNote.text || (storeNote as any).BodyText || "";
    const storeNoteId = normalizeNoteId(storeNote.id || (storeNote as any)["@id"]) || "";

    const storeNoteKey = JSON.stringify({
      id: storeNoteId,
      published: storeNote.published,
      approvalRequested: storeNote.approvalRequested,
      tags: storeNote.tags,
      comments: storeNote.comments?.length || 0,
      text: storeNoteText,
      title: storeNote.title,
    });

    const hasChanged = storeNoteKey !== lastSyncedNoteRef.current;

    if (hasChanged) {
      const timeSinceLastEdit = Date.now() - lastEditTimeRef.current;
      const shouldUpdate = timeSinceLastEdit > 2000;

      if (shouldUpdate) {
        const handlers = noteHandlersRef.current;
        handlers.setNote(storeNote);

        if (storeNote.title !== title && timeSinceLastEdit > 5000) {
          handlers.setTitle(storeNote.title);
        }
        if (storeNoteText !== editorContent && timeSinceLastEdit > 5000) {
          handlers.setEditorContent(storeNoteText);
          const editor = rteRef.current?.editor;
          if (editor) {
            const currentHtml = editor.getHTML();
            if (currentHtml !== storeNoteText) {
              editor.commands.setContent(storeNoteText);
            }
          }
          handlers.setCounter((prev) => prev + 1);
        }

        if (storeNote.published !== isPublished) {
          handlers.setIsPublished(storeNote.published || false);
        }
        if (storeNote.approvalRequested !== approvalRequested) {
          handlers.setApprovalRequested(storeNote.approvalRequested || false);
        }
        if (JSON.stringify(storeNote.tags) !== JSON.stringify(tags)) {
          handlers.setTags(storeNote.tags || []);
        }

        const storeImages = (storeNote.media || []).filter((item: any) => item.getType?.() === "image") as PhotoType[];
        const storeVideos = (storeNote.media || []).filter((item: any) => item.getType?.() === "video") as VideoType[];
        if (JSON.stringify(storeImages) !== JSON.stringify(images)) {
          handlers.setImages(storeImages);
        }
        if (JSON.stringify(storeVideos) !== JSON.stringify(videos)) {
          handlers.setVideos(storeVideos);
        }
        if (JSON.stringify(storeNote.audio) !== JSON.stringify(audio)) {
          handlers.setAudio(storeNote.audio || []);
        }

        lastSyncedNoteRef.current = storeNoteKey;
      }
    } else {
      if (!lastSyncedNoteRef.current) {
        lastSyncedNoteRef.current = storeNoteKey;
      }
    }
  }, [notes, currentNoteId, stateNoteId, editorContent, initialNote, title, isPublished, approvalRequested, tags, images, videos, audio, rteRef, lastEditTimeRef]);

  // Watch for external content changes and update editor
  useEffect(() => {
    const editor = rteRef.current?.editor;
    if (!editor) return;

    const currentEditorContent = editor.getHTML();
    const stateContent = editorContent || "";

    if (currentEditorContent !== stateContent) {
      const timeSinceLastEdit = Date.now() - lastEditTimeRef.current;
      if (timeSinceLastEdit > 2000) {
        editor.commands.setContent(stateContent);
      }
    }
  }, [editorContent, rteRef, lastEditTimeRef]);

  // Focus at start only when switching to a different note (based on initialNote)
  // Not when a draft note gets saved and receives an ID
  const initialNoteIdRef = useRef<string | undefined>(
    initialNote && "id" in initialNote ? initialNote.id : undefined
  );

  useEffect(() => {
    const currentInitialId = initialNote && "id" in initialNote ? initialNote.id : undefined;
    const previousInitialId = initialNoteIdRef.current;

    // Only focus if we're switching to a different note (initialNote changed)
    // or if this is the first mount
    if (currentInitialId !== previousInitialId || previousInitialId === undefined) {
      const editor = rteRef.current?.editor;
      if (editor) {
        const t = setTimeout(() => editor.chain().focus("start").run(), 0);
        initialNoteIdRef.current = currentInitialId;
        return () => clearTimeout(t);
      }
    }
    initialNoteIdRef.current = currentInitialId;
  }, [initialNote, rteRef]);

  // Polling for updates
  useEffect(() => {
    if (!stateNoteId) {
      return;
    }

    const POLLING_INTERVAL = 15000;

    const handleVisibilityChange = () => {
      isPollingPausedRef.current = document.hidden;
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    const startPolling = () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }

      pollingIntervalRef.current = setInterval(() => {
        if (isPollingPausedRef.current) {
          return;
        }

        const storeNote = notes.find((n) => n.id === stateNoteId);
        if (!storeNote) {
          return;
        }

        const timeSinceLastEdit = Date.now() - lastEditTimeRef.current;
        const shouldUpdate = timeSinceLastEdit > 2000;

        if (shouldUpdate) {
          const handlers = noteHandlersRef.current;
          const currentTitle = title;
          const currentEditorContent = editorContent;
          const currentIsPublished = isPublished;
          const currentApprovalRequested = approvalRequested;
          const currentTags = tags;
          const currentNoteComments = note?.comments?.length || 0;

          const hasChanges =
            storeNote.title !== currentTitle ||
            storeNote.text !== currentEditorContent ||
            storeNote.published !== currentIsPublished ||
            storeNote.approvalRequested !== currentApprovalRequested ||
            JSON.stringify(storeNote.tags) !== JSON.stringify(currentTags) ||
            storeNote.comments?.length !== currentNoteComments;

          if (hasChanges) {
            handlers.setNote(storeNote);

            if (storeNote.title !== currentTitle && timeSinceLastEdit > 5000) {
              handlers.setTitle(storeNote.title);
            }
            if (storeNote.text !== currentEditorContent && timeSinceLastEdit > 5000) {
              handlers.setEditorContent(storeNote.text || "");
            }

            handlers.setIsPublished(storeNote.published || false);
            handlers.setApprovalRequested(storeNote.approvalRequested || false);
            handlers.setTags(storeNote.tags || []);
          }
        }
      }, POLLING_INTERVAL);
    };

    startPolling();

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [stateNoteId, notes, title, editorContent, isPublished, approvalRequested, tags, note?.comments?.length, lastEditTimeRef]);

  return {
    currentNoteId,
    currentNoteFromStore,
    currentNoteContentHash,
  };
};
