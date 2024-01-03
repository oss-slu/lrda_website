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
        if (!userId) {
          const userNotes = userDemoNotes;
          console.log("User Notes: ", userNotes);
          setNotes(DataConversion.convertMediaTypes(userNotes).reverse());
          setFilteredNotes(
            DataConversion.convertMediaTypes(userNotes).reverse()
          );
        } else if (userId) {
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
    <div className="flex flex-row w-screen h-[90vh] bg-background">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel
          className="min-w-[300px] max-w-[70vw]"
          defaultSize={2000}
        >
          <>
            <div className="flex flex-row h-[10%] bg-secondary items-center justify-center pl-5 pr-5">
              <SearchBar onSearch={handleSearch} />
              <div className="ml-10">
                <Select>
                  <SelectTrigger
                    className="w-[180px]"
                  >
                    <SelectValue placeholder="Event Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Event Filter</SelectLabel>
                      <SelectItem value="Religious">Religious</SelectItem>
                      <SelectItem value="Cultural">Cultural</SelectItem>
                      <SelectItem value="Sporting">Sporting</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {isLoaded && (
              <GoogleMap
                mapContainerStyle={{
                  width: "100%",
                  height: "90%",
                }}
                center={{ lat: latitude, lng: longitude }}
                zoom={10}
                options={{
                  streetViewControl: false,
                  mapTypeControl: false,
                  fullscreenControl: false,
                }}
              >
                {filteredNotes.map((note, index) => (
                  <MarkerF
                    key={index}
                    position={{
                      lat: parseFloat(note.latitude),
                      lng: parseFloat(note.longitude),
                    }}
                    onClick={() => setActiveNote(note)} // Set the active note here
                  />
                ))}

                {activeNote && (
                  <InfoWindow
                    position={{
                      lat: parseFloat(activeNote.latitude),
                      lng: parseFloat(activeNote.longitude),
                    }}
                    onCloseClick={() => setActiveNote(null)} // Clear the active note when InfoWindow is closed
                  >
                    <NoteCard note={activeNote} />
                  </InfoWindow>
                )}
              </GoogleMap>
            )}
          </>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel
          className="min-w-[400px] max-w-[70vw]"
          defaultSize={2000}
        >
          <ScrollArea className="flex flex-col w-[100%] h-[90vh] bg-popover shadow-2xl items-center justify-center align-right">
            <div className="flex flex-col w-[100%] items-center justify-center pb-3">
              {filteredNotes.map((note, index) => (
                <NoteCard key={note.id} note={note} />
              ))}
            </div>
          </ScrollArea>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default Page;
