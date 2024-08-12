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

export const handlePublishChange = (
  setIsPublished: React.Dispatch<React.SetStateAction<boolean>>,
  published: boolean
) => {
  setIsPublished(published);
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

export const handleDeleteNote = async (
  note: Note | undefined,
  user: User,
  setNote: React.Dispatch<React.SetStateAction<Note | undefined>>
) => {
  if (note?.id) {
    try {
      const userId = await user.getId();
      const success = await ApiService.deleteNoteFromAPI(
        note!.id,
        userId || ""
      );
      if (success) {
        toast("Success", {
          description: "Note successfully deleted.",
          duration: 4000,
        });
        setNote(undefined); // Clear the note after successful deletion
        return true;
      }
    } catch (error) {
      toast("Error", {
        description: "Failed to delete note. System failure. Try again later.",
        duration: 4000,
      });
      console.error("Error deleting note:", error);
      return false;
    }
  } else {
    toast("Error", {
      description: "You must first save your note before deleting it.",
      duration: 4000,
    });
    return false;
  }
};
