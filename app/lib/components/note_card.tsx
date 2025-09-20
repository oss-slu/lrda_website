import React, { useState, useEffect } from "react";
import { Note } from "@/app/types";
import ApiService from "../utils/api_service";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { PersonIcon } from "@radix-ui/react-icons";
import { Calendar as CalendarIcon, TagIcon, TagsIcon, User2Icon } from "lucide-react";
import CompactCarousel from "./compact_carousel";
import { formatDateTime } from '../utils/data_conversion';
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface NoteCardProps {
  note: Note;
}

const NoteCard: React.FC<NoteCardProps> = ({ note }) => {
  const title = note.title;
  const text = note.text;
  const tags: string[] = note.tags.map(tag => tag.label); // Ensure correct mapping to labels
  const imageMedia = note.media.filter((media) => media.type === "image")[0];
  const [creator, setCreator] = useState<string>("Loading...");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    note.time ? new Date(note.time) : undefined
  );

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
        <img
          src="/no-photo-placeholder.jpeg"
          alt="Placeholder"
          className="w-full h-[140px] sm:h-[180px] object-cover rounded-t-lg"
        />
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
          <div className="flex flex-row items-center align-middle">
            <User2Icon className="mr-1 sm:mr-2 w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <p className="text-xs sm:text-[15px] text-gray-500 truncate">{creator}</p>
          </div>
          {/* Interactive Calendar with formatted display */}
          <div className="flex flex-row items-center">
            <CalendarIcon className="mr-1 sm:mr-2 w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    "text-xs sm:text-sm text-left font-normal text-gray-700 bg-white border border-gray-200 rounded-md px-1 sm:px-2 py-1 hover:bg-gray-50",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  {formatDateTime(selectedDate)}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
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
                      className="bg-blue-100 text-blue-800 text-xs px-1 sm:px-2 mr-1 font-medium rounded-full whitespace-nowrap"
                    >
                      {tag}
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
