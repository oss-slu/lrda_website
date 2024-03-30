import React, { useState, useEffect } from "react";
import { Note } from "@/app/types";
import ApiService from "../utils/api_service";
import placeholderImage from "public/no-photo-placeholder.jpeg";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { PersonIcon } from "@radix-ui/react-icons";
import { Calendar, TagIcon, TagsIcon, User2Icon } from "lucide-react";
import CompactCarousel from "./compact_carousel";

interface NoteCardProps {
  note: Note;
}

function formatDateTime(date: Date) {
  if (!date) return "Pick a date";

  const hours = date.getHours();
  const minutes = date.getMinutes();
  const formattedHours = hours % 12 === 0 ? 12 : hours % 12;
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
  const ampm = hours < 12 ? "AM" : "PM";

  return `${date.toDateString()} ${formattedHours}:${formattedMinutes} ${ampm}`;
}

const NoteCard: React.FC<NoteCardProps> = ({ note }) => {
  const title = note.title;
  const date = formatDateTime(note.time);
  const text = note.text;
  const tags: string[] = note.tags;
  const imageMedia = note.media.filter((media) => media.type === "image")[0];
  const [creator, setCreator] = useState<string>("Loading...");

  useEffect(() => {
    ApiService.fetchCreatorName(note.creator)
      .then((name) => setCreator(name))
      .catch((error) => {
        console.error("Error fetching creator name:", error);
        setCreator("Error loading name");
      });
  }, [note.creator]);

  return (
    <div className="w-64 bg-white h-[300px] rounded-sm shadow flex flex-col border border-gray-200">
      {note.media.length > 0 ? (
        <CompactCarousel mediaArray={note.media}></CompactCarousel>
      ) : (
        <img
          src={placeholderImage.src}
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
          <div className="flex flex-row  items-center align-middle">
            <User2Icon className="mr-2" size={15} />
            <p className="text-[15px] text-gray-500 truncate">{creator}</p>
          </div>
          <div className="flex flex-row  items-center align-middle">
            <Calendar className="mr-2" size={15} />
            <p className="text-sm text-gray-400">{date.toString()}</p>
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
