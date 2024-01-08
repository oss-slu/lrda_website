import React from "react";
import { Note } from "@/app/types";
import { AudioType } from "../../models/media_class";
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

export const handleTagsChange = (
  setTags: React.Dispatch<React.SetStateAction<string[]>>,
  newTags: string[]
) => {
  setTags(newTags);
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
  setNote: React.Dispatch<React.SetStateAction<Note | undefined>>,
) => {
  console.log(note);
  if (note?.id) {
    try {
      const userId = await user.getId();
      const success = await ApiService.deleteNoteFromAPI(note!.id, userId || "");
      if (success) {
        toast("Error", {
          description: "Note successfully Deleted.",
          duration: 4000,
        });
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
      description: "You must first save your note, before deleting it.",
      duration: 4000,
    });
  }
};
