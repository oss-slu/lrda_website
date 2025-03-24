import React from "react";
import { Note, Tag } from "@/app/types";
import ApiService from "../../utils/api_service";
import { toast } from "sonner";
import { User } from "../../models/user_class";

export const handleTitleChange = (
  setTitle: React.Dispatch<React.SetStateAction<string>>,
  event: React.ChangeEvent<HTMLInputElement>
) => {
  setTitle(event.target.value);
};

export const handleLocationChange = (
  setLongitude: React.Dispatch<React.SetStateAction<string>>,
  setLatitude: React.Dispatch<React.SetStateAction<string>>,
  newLongitude: number,
  newLatitude: number
) => {
  setLatitude(newLatitude.toString());
  setLongitude(newLongitude.toString());
};

export const handleTimeChange = (
  setTime: React.Dispatch<React.SetStateAction<Date>>,
  newDate: Date
) => {
  setTime(newDate);
};

export const handlePublishChange = async (
  noteState,
  noteHandlers
) => {
  if (!noteState.note) {
    console.error("No note found.");
    return;
  }

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
    creator: noteState.note?.creator || User.getInstance().getId(),
    published: !noteState.isPublished, // Toggle the published state
  };

  try {
    await ApiService.overwriteNote(updatedNote);

    // Update state
    noteHandlers.setIsPublished(updatedNote.published);
    noteHandlers.setNote(updatedNote);

    toast(updatedNote.published ? "Note Published" : "Note Unpublished", {
      description: updatedNote.published
        ? "Your note has been published successfully."
        : "Your note has been unpublished successfully.",
      duration: 4000,
    });

    noteHandlers.setCounter((prevCounter) => prevCounter + 1); // Force re-render
  } catch (error) {
    console.error("Error updating publish state:", error);
    toast("Error", {
      description: "Failed to update publish state. Try again later.",
      duration: 4000,
    });
  }
};



export const handleTagsChange = (
  setTags: React.Dispatch<React.SetStateAction<Tag[]>>, 
  newTags: (Tag | string)[]
) => {
  const formattedTags = newTags.map((tag) =>
    typeof tag === "string"
      ? { label: tag, origin: "user" as const } // Ensure origin is correctly typed
      : tag
  );
  setTags(formattedTags);
};

export const handleEditorChange = (
  setEditorContent: React.Dispatch<React.SetStateAction<string>>,
  content: string
) => {
  setEditorContent(content);
};

export const handleDeleteNote = async ( //supposed to be archive but named as delete
  note: Note | undefined,
  user: User,
  setNote: React.Dispatch<React.SetStateAction<Note | undefined>>
) => {
  if (note?.id) {
    try {
      const userId = await user.getId();

      // Step 1: Add an `isArchived` flag and `archivedAt` timestamp to the note
      const updatedNote = {
        ...note,
        isArchived: true, // Mark the note as archived; this IS happening

        published: false,

        archivedAt: new Date().toISOString(), // Add a timestamp for archiving
      };

      // update the note
      const response = await ApiService.overwriteNote(updatedNote);

      if (response.ok) {
        toast("Success", {
          description: "Note successfully archived.",
          duration: 4000,
        });
        setNote(undefined); // Clear the note from the state after archiving
        return true;
      } else {
        throw new Error("Archiving failed");
      }
    } catch (error) {
      toast("Error", {
        description: "Failed to archive note. System failure. Try again later.",
        duration: 4000,
      });
      console.error("Error archiving note:", error);
      return false;
    }
  } else {
    toast("Error", {
      description: "You must first save your note before archiving it.",
      duration: 4000,
    });
    return false;
  }
};