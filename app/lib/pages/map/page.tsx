"use client";
import React, { useEffect, useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import { GlobeIcon, UserIcon } from "lucide-react";

const mapAPIKey = process.env.NEXT_PUBLIC_MAP_KEY || "";

const Page = () => {
  const defaultLocation = { lat: 38.637334, lng: -90.286021 };
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [personalNotes, setPersonalNotes] = useState<Note[]>([]);
  const [globalNotes, setGlobalNotes] = useState<Note[]>([]);
  const [global, setGlobal] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const user = User.getInstance();

  useEffect(() => {
    async function fetchNotes() {
      try {
        const userId = await user.getId();

        let personalNotes: any[] | ((prevState: Note[]) => Note[]) = [];
        let globalNotes = [];
        if (userId) {
          setIsLoggedIn(true);
          personalNotes = await ApiService.fetchUserMessages(userId);
          personalNotes =
            DataConversion.convertMediaTypes(personalNotes).reverse();
        }
        globalNotes = await ApiService.fetchPublishedNotes();
        globalNotes = DataConversion.convertMediaTypes(globalNotes).reverse();

        setPersonalNotes(personalNotes);
        setGlobalNotes(globalNotes);

        setNotes(global ? globalNotes : personalNotes);
        setFilteredNotes(global ? globalNotes : personalNotes);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    }

    fetchNotes();
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

  const getMarkerIcon = () => ({
    url: mapPin,
    labelOrigin: new window.google.maps.Point(15, -10),
    scaledSize: new window.google.maps.Size(25, 35),
  });

  const getMarkerLabel = (note: Note) => {
    const label = note.tags?.[0] ?? note.title.split(" ")[0];
    return label.length > 10 ? `${label.substring(0, 10)}...` : label;
  };

  const toggleFilter = () => {
    setGlobal(!global);
    const notesToUse = !global ? globalNotes : personalNotes;
    setNotes(notesToUse);
    setFilteredNotes(notesToUse);
  };

  console.log(isLoggedIn);

  return (
    <div className="flex flex-row w-screen h-[90vh] min-w-[600px]">
      <div className="flex flex-row absolute top-30 w-[30vw] left-0 z-10 m-5 align-center items-center">
        <div className="min-w-[80px] mr-3">
          <SearchBar onSearch={handleSearch} />
        </div>
        {isLoggedIn ? (
          <div className="flex flex-row justify-evenly items-center">
            <GlobeIcon className="text-primary" />
            <Switch onClick={toggleFilter} />
            <UserIcon className="text-primary" />
          </div>
        ) : null}
      </div>
      <div className="flex-grow">
        {isLoaded && (
          <GoogleMap
            mapContainerStyle={{ width: "100%", height: "100%" }}
            center={defaultLocation}
            zoom={10}
            options={{
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: false,
            }}
          >
            {filteredNotes.map((note, index) => (
              <MarkerF
                key={note.id}
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
            {activeNote && (
              <InfoWindow
                key={activeNote.id}
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
      <div className="w-74 h-full overflow-y-auto bg-white">
        {filteredNotes.map((note) => (
          <ClickableNote key={note.id} note={note} />
        ))}
      </div>
    </div>
  );
};

export default Page;
