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

const ClickableNote: React.FC<{
  note: Note;
}> = ({ note }) => {
  const [creator, setCreator] = useState<string>("Loading...");
  const [likes, setLikes] = useState(0);
  const [disLikes, setDisLikes] = useState(0);
  const tags: string[] = note.tags;
  console.log(note);

  useEffect(() => {
    ApiService.fetchCreatorName(note.creator)
      .then((name) => setCreator(name))
      .catch((error) => {
        console.error("Error fetching creator name:", error, note.creator);
        setCreator("Error loading name");
      });
  }, [note.creator]);

  const data = note.text;

  focus();

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
