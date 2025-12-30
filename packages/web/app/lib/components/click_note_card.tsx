import React, { useState, useEffect } from "react"; // comment test
import ApiService from "../utils/api_service";
import { Note, Tag } from "@/app/types";
import {
  CalendarDays,
  UserCircle,
  ThumbsUp,
  ThumbsDown,
  Tags,
  Clock3,
  FileAudio,
  ImageIcon,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import NoteCard from "./note_card";
import { ScrollArea } from "@/components/ui/scroll-area";
import AudioPicker from "./noteElements/audio_component";
import MediaViewer from "./media_viewer";
import { PopoverClose } from "@radix-ui/react-popover";

// Utility function to format the date into a readable string
function formatDate(date: string | number | Date) {
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) return "Invalid Date";

  const dateString = parsedDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `${dateString}`;
}

// Utility function to format the time into a readable string
function formatTime(date: string | number | Date) {
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) return "Invalid Date";

  const hours = parsedDate.getHours();
  const minutes = parsedDate.getMinutes();
  const formattedHours = hours % 12 === 0 ? 12 : hours % 12;
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
  const ampm = hours < 12 ? "AM" : "PM";

  return `${formattedHours}:${formattedMinutes} ${ampm}`;
}

// Convert old tags (strings) to new format
const convertOldTags = (tags: (Tag | string)[] | undefined): Tag[] => {
  if (!Array.isArray(tags)) return [];
  return tags.map(tag =>
    typeof tag === "string" ? { label: tag, origin: "user" } : tag
  );
};

// ClickableNote component
const ClickableNote: React.FC<{
  note: Note;
}> = ({ note }) => {
  const [creator, setCreator] = useState<string>("Loading...");
  const [likes, setLikes] = useState(0);
  const [disLikes, setDisLikes] = useState(0);
  const tags: Tag[] = convertOldTags(note.tags); // Convert tags if necessary

  // Fetch the creator's name based on the note's creator ID
  useEffect(() => {
    ApiService.fetchCreatorName(note.creator)
      .then((name) => setCreator(name))
      .catch((error) => {
        console.error("Error fetching creator name:", error, note.creator);
        setCreator("Error loading name");
      });
  }, [note.creator]);

  const data = note.text;

  return (
    <DialogContent className="sm:max-w-[80%] h-[100vh] p-0 flex flex-col">
      
      {/* 2. This is the non-scrolling header */}
      <DialogHeader className="p-6 pb-4 border-b">
        <DialogTitle className="text-3xl">{note.title}</DialogTitle>
        <DialogDescription className="flex flex-row items-center">
          <CalendarDays className="w-5 h-5" />: {formatDate(note.time)}
        </DialogDescription>
        <DialogDescription className="flex flex-row items-center">
          <Clock3 className="w-5 h-5" />: {formatTime(note.time)}
        </DialogDescription>
        <DialogDescription className="flex flex-row items-center">
          <UserCircle className="w-5 h-5" />: {creator}
        </DialogDescription>

        {tags.length > 0 && (
          <DialogDescription>
            <div className="flex flex-wrap gap-2 mb-2 items-center">
              <Tags /> 
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className={`h-5 text-xs px-2 font-semibold rounded flex justify-center items-center ${
                    tag.origin === "user"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-purple-200 text-purple-800"
                  }`}
                >
                  {tag.label}
                </span>
              ))}
            </div>
          </DialogDescription>
        )}

        <div className="h-1 w-full bg-black bg-opacity-70 rounded-full" />
      </DialogHeader>

      {/* This is the scrollable main area */}
      <ScrollArea className="flex-1 overflow-auto min-h-0">
        <div className="pb-20"> {/* Padding at the bottom */}
          {note.text && note.text.length > 0 ? (
            <div
              dangerouslySetInnerHTML={{ __html: data }}
              className="mb-5 note-content px-6"
            />
          ) : (
            <div className="px-6 pb-6">This Note has no content</div>
          )}
        </div>
      </ScrollArea>

      {/* This is the floating footer */}
      <DialogFooter className="absolute bottom-6 left-6 z-50 p-0 m-0 bg-transparent">
        <div className="flex flex-row w-28 gap-2">
          {note.audio.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <div className="flex flex-row shadow-sm rounded-full h-9 w-9 bg-white border border-border justify-center items-center
                                hover:bg-gray-100 hover:scale-105 active:scale-95 cursor-pointer transition-transform duration-150">
                  <FileAudio className="h-6 w-6 stroke-[1.75]" />
                </div>
              </PopoverTrigger>
              <PopoverContent>
                <AudioPicker audioArray={note.audio} editable={false} />
              </PopoverContent>
            </Popover>
          )}

          {note.media.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <div className="flex flex-row shadow-sm rounded-full h-9 w-9 bg-white border border-border justify-center items-center
                                hover:bg-gray-100 hover:scale-105 active:scale-95 cursor-pointer transition-transform duration-150">
                  <ImageIcon className="h-6 w-6 stroke-[1.75]" />
                </div>
              </PopoverTrigger>
              <PopoverContent className="bg-white overflow-auto rounded-lg shadow-lg w-[450px] max-w-full px-16 align-middle justify-center items-center">
                <PopoverClose className="absolute right-4">
                  <X />
                </PopoverClose>
                <MediaViewer mediaArray={note.media} />
              </PopoverContent>
            </Popover>
          )}
        </div>
      </DialogFooter>
    </DialogContent>
  );
};

export default ClickableNote;