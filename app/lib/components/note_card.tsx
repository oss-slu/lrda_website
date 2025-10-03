import React, { useState, useEffect } from "react";
import { Note, Tag } from "@/app/types";
import ApiService from "../utils/api_service";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Calendar as CalendarIcon, TagsIcon, User2Icon, ImageIcon } from "lucide-react";
import CompactCarousel from "./compact_carousel";
import { formatDateTime } from "../utils/data_conversion";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface NoteCardProps {
  note: Note;
}

// Convert old tags (strings) to new format
const convertOldTags = (tags: (Tag | string)[] | undefined): Tag[] => {
  if (!Array.isArray(tags)) {
    return []; // Return an empty array if tags is undefined or not an array
  }
  return tags.map((tag) =>
    typeof tag === "string" ? { label: tag, origin: "user" } : tag
  );
};

const NoteCard: React.FC<NoteCardProps> = ({ note }) => {
  const title = note.title;
  const text = note.text;
  const tags: Tag[] = convertOldTags(note.tags); // Convert tags if necessary
  const [creator, setCreator] = useState<string>("Loading...");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(note.time ? new Date(note.time) : undefined);
  const imageMedia = note.media && note.media.length > 0;


  // Fetch creator name and handle potential errors
  useEffect(() => {
    if (note.creator) {
      ApiService.fetchCreatorName(note.creator)
        .then((name) => setCreator(name))
        .catch((error) => {
          console.error("Error fetching creator name:", error);
          setCreator("Unknown creator");
        });
    } else {
      setCreator("Unknown creator");
    }
  }, [note.creator]);


  return (
    <div className="w-full max-w-[256px] bg-white h-[250px] sm:h-[300px] rounded-lg shadow flex flex-col border border-gray-200">
      {imageMedia ? (
        <CompactCarousel mediaArray={note.media}></CompactCarousel>
      ) : (
        <div className="flex items-center justify-center w-auto h-[140px] sm:h-[180px] bg-gray-100 rounded-t-lg">
          <ImageIcon aria-label="No photo present" className="text-gray-400" size={72} strokeWidth={1} />
        </div>
      )}
      <div className="flex flex-col px-2 sm:px-3 h-[110px] sm:h-[118px]">
        <div className="w-full">
          <h3
            className="text-base sm:text-xl font-bold text-gray-900 truncate overflow-x-auto whitespace-nowrap"
            style={{ maxWidth: "100%" }}
          >
            {title}
          </h3>
        </div>
        <div className="flex flex-col h-[90px] sm:h-[100px] justify-evenly">
          {/* Author */}
          <div className="flex flex-row items-center align-middle">
            <User2Icon className="mr-1 sm:mr-2 w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <p className="text-xs sm:text-[15px] text-gray-500 truncate">{creator}</p>
          </div>
          
          {/* Date/Time */}
          <div className="flex flex-row items-center">
            <CalendarIcon className="mr-1 sm:mr-2 w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <p className="text-xs sm:text-sm text-gray-700 truncate">
              {formatDateTime(selectedDate)}
            </p>
          </div>
          
          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex items-center">
              <div className="flex justify-center items-center mr-1 sm:mr-2 h-[12px] w-[12px] sm:h-[15px] sm:w-[15px] rounded-full">
                <TagsIcon size={12} className="sm:w-4 sm:h-4" />
              </div>
              <div className="flex items-center h-4 sm:h-5 overflow-hidden">
                <ScrollArea className="flex flex-nowrap self-center align-middle overflow-clip mb-1">
                  {tags.map((tag, index) => (
                    <span
                      key={index}
                      className={`text-xs px-1 sm:px-2 mr-1 font-medium rounded-full whitespace-nowrap ${
                        tag.origin === "user"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-purple-200 text-purple-800"
                      }`}
                    >
                      {tag.label}
                    </span>
                  ))}
                  <ScrollBar orientation="horizontal" className="h-[3px] sm:h-[5px]" />
                </ScrollArea>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NoteCard;
