import React, { useState, useEffect } from "react";
import ApiService from "../utils/api_service";
import { Note } from "@/app/types";
import {
  CalendarDays,
  UserCircle,
  ThumbsUp,
  ThumbsDown,
  Tags,
  Clock3,
  FileAudio,
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

function formatDate(date: Date) {
  if (!date) return "Pick a date";

  const dateString = date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `${dateString}`;
}
function formatTime(date: Date) {
  if (!date) return "Pick a date";

  const hours = date.getHours();
  const minutes = date.getMinutes();
  const formattedHours = hours % 12 === 0 ? 12 : hours % 12;
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
  const ampm = hours < 12 ? "AM" : "PM";

  return `${formattedHours}:${formattedMinutes} ${ampm}`;
}

const ClickableNote: React.FC<{
  note: Note;
}> = ({ note }) => {
  const [creator, setCreator] = useState<string>("Loading...");
  const [likes, setLikes] = useState(0);
  const [disLikes, setDisLikes] = useState(0);
  const tags: string[] = note.tags;

  useEffect(() => {
    ApiService.fetchCreatorName(note.creator)
      .then((name) => setCreator(name))
      .catch((error) => {
        console.error("Error fetching creator name:", error);
        setCreator("Error loading name");
      });
  }, [note.creator]);

  const data = note.text;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="z-50">
          <NoteCard note={note} />
        </div>
      </DialogTrigger>
      <DialogContent className="h-[100vh]">
        <DialogHeader>
          <DialogTitle className="text-3xl">{note.title}</DialogTitle>
          <DialogDescription className="flex flex-row align-center items-center">
            <CalendarDays className="w-5 h-5" />: {formatDate(note.time)}
          </DialogDescription>
          <DialogDescription className="flex flex-row align-center items-center">
            <Clock3 className="w-5 h-5" />: {formatTime(note.time)}
          </DialogDescription>
          <DialogDescription className="flex flex-row align-center items-center">
            <UserCircle className="w-5 h-5" />: {creator}
          </DialogDescription>
          <DialogDescription>
            {tags.length > 0 ? (
              <div className="flex flex-wrap gap-2 mb-2 items-center">
                <Tags />
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-blue-100 text-blue-800 h-5 text-xs px-2 font-semibold rounded flex justify-center items-center"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </DialogDescription>

          <div className="h-1 w-[100%] bg-black bg-opacity-70 rounded-full" />
        </DialogHeader>

        <ScrollArea>
          {note.text.length > 0 ? (
            <div dangerouslySetInnerHTML={{ __html: data }} className="mb-5" />
          ) : (
            "This Note has no content"
          )}
        </ScrollArea>
        <DialogFooter>
          <div className=" absolute bottom-4 right-4 flex w-[220px] h-10 bg-popup shadow-sm rounded-full border border-border bg-white pt-2 pb-2 justify-around items-center">
            <button
              className="hover:text-green-500 flex justify-center items-center w-10"
              onClick={() => setLikes(likes + 1)}
            >
              <ThumbsUp className="text-current" />
            </button>
            {likes}
            <div className="w-1 h-7 bg-border" />
            <button
              className="hover:text-red-500 flex justify-center items-center w-10"
              onClick={() => setDisLikes(disLikes - 1)}
            >
              <ThumbsDown className="text-current" />
            </button>
            {disLikes}
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <div className="flex absolute bottom-4 left-4 shadow-sm rounded-full h-10 w-10 bg-white border-border border justify-center items-center align-center">
                <FileAudio />
              </div>
            </PopoverTrigger>
            <PopoverContent>
              <AudioPicker audioArray={note.audio} editable={false} />
            </PopoverContent>
          </Popover>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ClickableNote;
