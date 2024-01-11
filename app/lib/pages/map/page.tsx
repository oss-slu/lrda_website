"use client";
import React, { useEffect } from "react";
import { useState } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  MarkerF,
  InfoWindow,
} from "@react-google-maps/api";
import SearchBar from "../../components/search_bar";
import { Note } from "@/app/types";
import ApiService from "../../utils/api_service";
import DataConversion from "../../utils/data_conversion";
import { User } from "../../models/user_class";
import ClickableNote from "../../components/click_note_card";
import mapPin from "public/3d-map-pin.jpeg";
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

  const getMarkerLabel = (note: Note): string => {
    const label =
      note.tags && note.tags.length > 0
        ? note.tags[0]
        : note.title.split(" ")[0];
    return label.length > 10 ? label.substring(0, 10) + "..." : label;
  };

  const getMarkerIcon = () => {
    return {
      // '/3d-map-pin.jpeg' looks better without this
      url: mapPin,
      labelOrigin: new window.google.maps.Point(15, -10),
      scaledSize: new window.google.maps.Size(25, 35),
    };
  };

  return (
    <div className="flex flex-row w-screen h-[90vh]">
      {/* Search bar and event filter */}
      <div className="absolute top-30 left-0 z-10 m-5">
        <SearchBar onSearch={handleSearch} />
      </div>

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
                // icon={getMarkerIcon()}
                // label={{
                //   text: getMarkerLabel(note),
                //   color: "white",
                //   className: 'custom-marker-label',
                // }}
                zIndex={index}
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
                <ClickableNote note={activeNote} />
              </InfoWindow>
            )}
          </GoogleMap>
        )}
      </div>

      {/* Scrollable column for the note cards */}
      <div className="w-74 h-full overflow-y-auto bg-white">
        {filteredNotes.map((note, index) => (
          <ClickableNote key={note.id} note={note} />
        ))}
      </div>
    </div>
  );
};

export default Page;
