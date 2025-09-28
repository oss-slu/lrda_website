"use client";
import React, { useState } from "react";
import { Note } from "@/app/types";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Calendar as CalendarIcon, TagsIcon, User2Icon, ImageIcon } from "lucide-react";
import CompactCarousel from "./compact_carousel";
import { formatDateTime } from "../utils/data_conversion";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface NoteCardProps {
  note: Note;
  creator: string;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, creator }) => {
  const title = note.title;
  const tags: string[] = note.tags.map((tag) => tag.label); // Ensure correct mapping to labels
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(note.time ? new Date(note.time) : undefined);

  return (
    <div className="w-64 bg-white h-[300px] rounded-sm shadow flex flex-col border border-gray-200">
      {note.media.length > 0 ? (
        <CompactCarousel mediaArray={note.media}></CompactCarousel>
      ) : (
        <div className="flex items-center justify-center w-auto h-[180px] bg-gray-100">
          <ImageIcon aria-label="No photo present" className="text-gray-400" size={72} strokeWidth={1} />
        </div>
      )}
      <div className="flex flex-col px-2 h-[118px]">
        <div className="w-full">
          <h3 className="text-xl font-bold text-gray-900 truncate overflow-x-auto whitespace-nowrap" style={{ maxWidth: "100%" }}>
            {title}
          </h3>
        </div>
        <div className="flex flex-col h-[100px] justify-evenly">
          <div className="flex flex-row  items-center align-middle">
            <User2Icon className="mr-2" size={15} />
            <p className="text-[15px] text-gray-500 truncate">{creator}</p>
          </div>
          {/* Interactive Calendar with formatted display */}
          <div className="flex flex-row items-center">
            <CalendarIcon className="mr-2" size={15} />
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    "text-sm text-left font-normal text-gray-700 bg-white border border-gray-200 rounded-md px-2 py-1 hover:bg-gray-50",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  {formatDateTime(selectedDate)}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
          {tags.length > 0 && (
            <div className="flex items-center">
              <div className="flex justify-center items-center mr-2 h-[15px] w-[15px] rounded-full">
                <TagsIcon size={15} />
              </div>
              <div className="flex items-center h-5 overflow-hidden">
                <ScrollArea className="flex flex-nowrap self-center align-middle overflow-clip mb-1">
                  {tags.map((tag, index) => (
                    <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 mr-1 font-medium rounded-full whitespace-nowrap">
                      {tag}
                    </span>
                  ))}
                  <ScrollBar orientation="horizontal" className="h-[5px]" />
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
