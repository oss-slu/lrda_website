"use client";
import React, { useEffect } from "react";
import { useState } from "react";
import userDemoNotes from "../../models/user_notes_demo.json";
import {
  GoogleMap,
  useJsApiLoader,
  MarkerF,
  InfoWindow,
} from "@react-google-maps/api";
import { ScrollArea } from "@/components/ui/scroll-area";
import SearchBar from "../../components/search_bar";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Note } from "@/app/types";
import ApiService from "../../utils/api_service";
import DataConversion from "../../utils/data_conversion";
import { User } from "../../models/user_class";
import NoteCard from "../../components/note_card";
import { toast } from "sonner";

const mapAPIKey = process.env.NEXT_PUBLIC_MAP_KEY || "";

const Page = () => {
  const longitude = -90.286021;
  const latitude = 38.637334;
  const user = User.getInstance();
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [activeNote, setActiveNote] = useState<Note | null>(null);

  useEffect(() => {
    const fetchUserMessages = async () => {
      try {
        const userId = await user.getId();
        if (userId) {
          const userNotes = await ApiService.fetchUserMessages(userId);
          console.log("User Notes: ", userNotes);
          setNotes(DataConversion.convertMediaTypes(userNotes).reverse());
          setFilteredNotes(
            DataConversion.convertMediaTypes(userNotes).reverse()
          );
        } else {
          console.error("User not logged in");
        }
      } catch (error) {
        console.error("Error fetching user messages:", error);
      }
    };

    fetchUserMessages();
  }, []);

  const handleSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setFilteredNotes(notes);
      return;
    }
    const query = searchQuery.toLowerCase();
    const filtered = notes.filter(
      (note) =>
        note.title.toLowerCase().includes(query) ||
        note.tags.some((tag) => tag.toLowerCase().includes(query))
    );
    setFilteredNotes(filtered);
  };

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: mapAPIKey,
  });

  const RowTemp: React.FC<{ num: number }> = ({ num }) => {
    return (
      <div className="flex flex-row w-[95%] justify-between">
        <div className="bg-popover w-[48%] h-72 mt-3 rounded-md shadow-md flex items-center justify-center text-2xl font-bold">
          Note #{num}
        </div>
        <div className="bg-popover w-[48%] h-72 mt-3 rounded-md shadow-md flex items-center justify-center text-2xl font-bold">
          Note #{num + 1}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-row w-screen h-[90vh]">
      {/* Main area for the map */}
      <div className="flex-grow">
        {isLoaded && (
          <GoogleMap
            mapContainerStyle={{
              width: "100%",
              height: "100%",
            }}
            center={{ lat: latitude, lng: longitude }}
            zoom={10}
            options={{
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: false,
            }}
          >
            {/* Markers */}
            {filteredNotes.map((note, index) => (
              <MarkerF
                key={index}
                position={{
                  lat: parseFloat(note.latitude),
                  lng: parseFloat(note.longitude),
                }}
                onClick={() => setActiveNote(note)}
              />
            ))}
  
            {/* Info Window */}
            {activeNote && (
              <InfoWindow
                position={{
                  lat: parseFloat(activeNote.latitude),
                  lng: parseFloat(activeNote.longitude),
                }}
                onCloseClick={() => setActiveNote(null)}
              >
                <NoteCard note={activeNote} />
              </InfoWindow>
            )}
          </GoogleMap>
        )}
      </div>
  
      {/* Scrollable column for the note cards */}
      <div className="w-74 h-full overflow-y-auto bg-white">
        {filteredNotes.map((note, index) => (
          <NoteCard key={note.id} note={note} />
        ))}
      </div>
    </div>
  );
  
};

export default Page;
