import React, { useState, useEffect } from "react";
import ApiService from "../utils/api_service";
import { Note, Tag } from "@/app/types";
import {
  CalendarDays,
  UserCircle,
  Tags,
  Clock3,
  FileAudio,
  ImageIcon,
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import AudioPicker from "./noteElements/audio_component";
import MediaViewer from "./media_viewer";
import NoteCard from "./note_card";

/**
 * Extracts the first few sentences from a string of HTML content.
 * @param {string} bodyText - The HTML content to extract from.
 * @param {number} sentenceCount - The number of sentences to extract.
 * @returns {string} The extracted sentences as plain text.
 */
const getBodyPreview = (bodyText: string, sentenceCount = 2): string => {
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = bodyText;
  const plainText = tempDiv.textContent || tempDiv.innerText || "";
  const sentences = plainText.split(/(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?)\s/);
  return sentences.slice(0, sentenceCount).join(" ");
};

// Utility function to format the date
function formatDate(date: string | number | Date) {
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) return "Invalid Date";
  return parsedDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Utility function to format time
function formatTime(date: string | number | Date) {
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) return "Invalid Date";
  const hours = parsedDate.getHours();
  const minutes = parsedDate.getMinutes();
  const ampm = hours < 12 ? "AM" : "PM";
  return `${hours % 12 || 12}:${minutes.toString().padStart(2, "0")} ${ampm}`;
}

// Convert old tags (strings) to the new format
const convertOldTags = (tags: (Tag | string)[] | undefined): Tag[] => {
  if (!Array.isArray(tags)) return [];
  return tags.map((tag) =>
    typeof tag === "string" ? { label: tag, origin: "user" } : tag
  );
};

const EnhancedNoteCard: React.FC<{ note: Note }> = ({ note }) => {
  const [creator, setCreator] = useState<string>("Loading...");
  const [isImageLoading, setIsImageLoading] = useState(true); // Spinner state
  const [location, setLocation] = useState<string>("Fetching location..."); // State to store the exact location
  const tags: Tag[] = convertOldTags(note.tags);

  // Debugging logs to check incoming data
  useEffect(() => {
    console.log("EnhancedNoteCard received note:", note);
  }, [note]);

  // Fetch the creator's name
  useEffect(() => {
    ApiService.fetchCreatorName(note.creator)
      .then((name) => setCreator(name))
      .catch(() => setCreator("Unknown Creator"));
  }, [note.creator]);

  // Get the body text preview
  const bodyPreview = getBodyPreview(note.text || "", 2);

  // Fetch the exact location (state) using reverse geocoding
  useEffect(() => {
    const fetchLocation = async () => {
      const MAPS_API_KEY = process.env.NEXT_PUBLIC_MAP_KEY;

      if (!MAPS_API_KEY) {
        console.error("Google Maps API Key is missing in the environment variables.");
        setLocation("API Key Missing");
        return;
      }

      try {
        console.log("Fetching location for Lat/Lng:", note.latitude, note.longitude);

        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${note.latitude},${note.longitude}&key=${MAPS_API_KEY}`
        );

        const data = await response.json();
        console.log("Geocoding API response:", data); // Log the full API response

        const state =
          data.results.find((result: any) =>
            result.types.includes("administrative_area_level_1")
          )?.formatted_address ||
          data.results.find((result: any) =>
            result.types.includes("locality")
          )?.formatted_address ||
          "Location not found";

        setLocation(state);
      } catch (error) {
        console.error("Error fetching location:", error);
        setLocation("Location not found");
      }
    };

    fetchLocation();
  }, [note.latitude, note.longitude]);

  // Get the first image from the note.media array
  const coverImage = note.media?.find((media) => media.type === "image")?.uri;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="cursor-pointer border rounded-lg shadow-md bg-white hover:shadow-lg transition-all max-w-sm">
          {/* Image at the Top with Spinner */}
          {coverImage && (
            <div className="relative w-full h-40">
              {isImageLoading && (
                <div className="absolute inset-0 flex justify-center items-center bg-gray-100">
                  <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 border-gray-300 border-t-gray-600 rounded-full" />
                </div>
              )}
              <img
                src={coverImage}
                alt="Note Cover"
                className={`w-full h-full object-cover rounded-t-lg ${
                  isImageLoading ? "hidden" : "block"
                }`}
                onLoad={() => setIsImageLoading(false)}
                onError={() => setIsImageLoading(false)}
              />
            </div>
          )}
          <div className="p-4">
            {/* Title */}
            <div className="text-lg font-bold mb-2">{note.title}</div>
            {/* Creator */}
            <div className="text-sm text-gray-500 mb-2 flex items-center">
              <UserCircle size={16} className="mr-1" /> {creator}
            </div>
            {/* Date and Time */}
            <div className="text-sm text-gray-500 mb-2">
              <div className="flex items-center gap-2">
                <CalendarDays size={16} /> {formatDate(note.time)}
              </div>
              <div className="flex items-center gap-2">
                <Clock3 size={16} />
                {note.time ? formatTime(note.time) : "Unknown Time"}
              </div>
            </div>
            {/* Location */}
            <div className="text-sm text-gray-500 mb-2 flex items-center">
              <ImageIcon size={16} className="mr-1" /> {location}
            </div>
            {/* Body Preview */}
            <p className="text-sm text-gray-700">{bodyPreview}</p>
          </div>
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[90%] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold">{note.title}</DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <CalendarDays size={16} /> {formatDate(note.time)}
            </div>
            <div className="flex items-center gap-2">
              <Clock3 size={16} />
              {note.time ? formatTime(note.time) : "Unknown Time"}
            </div>
            <div className="flex items-center gap-2">
              <UserCircle size={16} /> {creator}
            </div>
            <div className="flex items-center gap-2">
              <ImageIcon size={16} /> {location}
            </div>
          </DialogDescription>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              <Tags size={16} />
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="bg-blue-100 text-blue-800 px-2 py-1 text-sm rounded"
                >
                  {tag.label}
                </span>
              ))}
            </div>
          )}
        </DialogHeader>
        <ScrollArea>
          {/* Display BodyText content */}
          {note.text ? (
            <div
              className="mt-4 text-base"
              dangerouslySetInnerHTML={{ __html: note.text }}
            />
          ) : (
            <p className="text-gray-500">No content available.</p>
          )}
        </ScrollArea>
        <DialogFooter className="flex gap-4">
          {/* Audio Picker */}
          {note.audio.length > 0 && (
            <Popover>
              <PopoverTrigger>
                <div className="bg-white border rounded-full p-1 w-8 h-8 flex justify-center items-center">
                  <FileAudio size={20} />
                </div>
              </PopoverTrigger>
              <PopoverContent>
                <AudioPicker audioArray={note.audio} editable={false} />
              </PopoverContent>
            </Popover>
          )}
          {/* Media Viewer */}
          {note.media.length > 0 && (
            <Popover>
              <PopoverTrigger>
                <div className="bg-white border rounded-full p-1 w-8 h-8 flex justify-center items-center">
                  <ImageIcon size={20} />
                </div>
              </PopoverTrigger>
              <PopoverContent className="max-w-md p-4">
                <MediaViewer mediaArray={note.media} />
              </PopoverContent>
            </Popover>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedNoteCard;
