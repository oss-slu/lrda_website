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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
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
// Convert old tags (strings) to new format
const convertOldTags = (tags: (Tag | string)[] | undefined): Tag[] => {
  if (!Array.isArray(tags)) {
    return []; // Return an empty array if tags is undefined or not an array
  }
  return tags.map((tag) =>
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

  // Function to clean content by removing audio URLs
  const cleanContent = (content: string, audioArray: any[]) => {
    if (!content || !audioArray || audioArray.length === 0) return content;
    
    let cleanedContent = content;
    
    // Remove audio URLs from content
    audioArray.forEach((audio) => {
      if (audio.uri) {
        // Create a regex to match the audio URL and any surrounding text
        const audioUrlRegex = new RegExp(`[^>]*${audio.uri.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^<]*`, 'g');
        cleanedContent = cleanedContent.replace(audioUrlRegex, '');
      }
    });
    
    // Clean up any empty paragraphs or divs that might be left
    cleanedContent = cleanedContent.replace(/<p>\s*<\/p>/g, '');
    cleanedContent = cleanedContent.replace(/<div>\s*<\/div>/g, '');
    
    return cleanedContent.trim();
  };

  const data = cleanContent(note.text, note.audio);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="z-40">
          <NoteCard note={note} />
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[80%] h-[100vh]">
        <DialogHeader>
          <DialogTitle className="text-3xl">{note.title}</DialogTitle>
          <DialogDescription className="flex flex-row align-center items-center">
            <CalendarDays className="w-5 h-5" />: {formatDate(note.time)}
          </DialogDescription>
          <DialogDescription className="flex flex-row align-center items-center">
            <Clock3 className="w-5 h-5" />: {formatTime(note.time) }
          </DialogDescription>
          <div className="flex flex-row align-center items-center text-sm text-muted-foreground mb-2">
            <UserCircle className="w-5 h-5" />: {creator}
          </div>
          {tags.length > 0 && (
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
          )}

          <div className="h-1 w-[100%] bg-black bg-opacity-70 rounded-full" />
        </DialogHeader>
        <ScrollArea>
          {note.text && note.text.length > 0 ? (
            <div dangerouslySetInnerHTML={{ __html: data }} className="mb-5" />
          ) : (
            "This Note has no content"
          )}
          
          {/* Audio player in content area */}
          {note.audio && note.audio.length > 0 && (
            <div className="mt-4 mb-4">
              <h3 className="text-lg font-semibold mb-3">Audio</h3>
              <AudioPicker audioArray={note.audio} editable={false} />
            </div>
          )}
        </ScrollArea>
        <DialogFooter>
          <div className="flex flex-row w-28 absolute left-4 bottom-4">
            {note.audio.length > 0 ? (
              <Popover>
                <PopoverTrigger asChild>
                  <div className="flex flex-row shadow-sm rounded-full h-10 w-10 bg-white border-border border justify-center items-center align-center">
                    <FileAudio />
                  </div>
                </PopoverTrigger>
                <PopoverContent>
                  <AudioPicker audioArray={note.audio} editable={false} />
                </PopoverContent>
              </Popover>
            ) : null}
            {note.media.length > 0 ? (
              <Popover>
                <PopoverTrigger asChild>
                  <div className="flex flex-row shadow-sm rounded-full h-10 w-10 bg-white border-border border justify-center items-center align-center">
                    <ImageIcon />
                  </div>
                </PopoverTrigger>
                <PopoverContent className="bg-white overflow-auto rounded-lg shadow-lg w-[450px] max-w-full px-16 align-middle justify-center items-center">
                  <PopoverClose className="absolute right-4">
                    <X />
                  </PopoverClose>
                  <MediaViewer mediaArray={note.media} />
                </PopoverContent>
              </Popover>
            ) : null}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ClickableNote;
