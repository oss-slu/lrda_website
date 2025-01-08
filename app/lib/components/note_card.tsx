import React, { useState, useEffect } from "react";
import { Note } from "@/app/types";
import ApiService from "../utils/api_service";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Calendar, TagsIcon, User2Icon } from "lucide-react";
import CompactCarousel from "./compact_carousel";
import { formatDateTime } from "../utils/data_conversion";

interface NoteCardProps {
  note: Note;
}

const NoteCard: React.FC<NoteCardProps> = ({ note }) => {
  // Provide default values for properties in case they are missing or undefined
  const title = note.title || "Untitled";
  const date = note.time ? formatDateTime(note.time) : "Unknown date";
  const text = note.text || "No content available.";
  const tags = note.tags?.map((tag) => tag.label) || []; // Ensure `tags` is always an array
  const imageMedia = note.media?.find((media) => media.type === "image"); // Safely access `media`
  const [creator, setCreator] = useState<string>("Loading...");

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
    <div className="w-64 bg-white h-[300px] rounded-sm shadow flex flex-col border border-gray-200">
      {imageMedia ? (
        <CompactCarousel mediaArray={note.media}></CompactCarousel>
      ) : (
        <img
          src="/no-photo-placeholder.jpeg"
          alt="Placeholder"
          className="w-auto h-[180px] object-cover rounded-t-sm"
        />
      )}
      <div className="flex flex-col px-2 h-[118px]">
        <div className="w-full">
          <h3
            className="text-xl font-bold text-gray-900 truncate overflow-x-auto whitespace-nowrap"
            style={{ maxWidth: "100%" }}
          >
            {title}
          </h3>
        </div>
        <div className="flex flex-col h-[100px] justify-evenly">
          <div className="flex flex-row items-center align-middle">
            <User2Icon className="mr-2" size={15} />
            <p className="text-[15px] text-gray-500 truncate">{creator}</p>
          </div>
          <div className="flex flex-row items-center align-middle">
            <Calendar className="mr-2" size={15} />
            <p className="text-sm text-gray-400">{date}</p>
          </div>
          {tags.length > 0 && (
            <div className="flex items-center">
              <div className="flex justify-center items-center mr-2 h-[15px] w-[15px] rounded-full">
                <TagsIcon size={15} />
              </div>
              <div className="flex items-center h-5 overflow-hidden">
                <ScrollArea className="flex flex-nowrap self-center align-middle overflow-clip mb-1">
                  {tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-800 text-xs px-2 mr-1 font-medium rounded-full whitespace-nowrap"
                    >
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
