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
  const [mapCenter, setMapCenter] = useState(defaultLocation);
  const [mapZoom, setMapZoom] = useState(10);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hoveredNoteId, setHoveredNoteId] = useState(null);
  const user = User.getInstance();

  const onMapLoad = (map: any) => {
    map.addListener("dragend", () => {
      setMapCenter({
        lat: map.getCenter().lat(),
        lng: map.getCenter().lng(),
      });
    });

    map.addListener("zoom_changed", () => {
      setMapZoom(map.getZoom());
    });
  };

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
            center={mapCenter}
            zoom={mapZoom}
            onLoad={onMapLoad}
            options={{
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: false,
            }}
          >
            {filteredNotes.map((note, index) => (
              <MarkerF
              key={note.id}
              position={{ lat: parseFloat(note.latitude), lng: parseFloat(note.longitude) }}
              onClick={() => {
                console.log("Marker clicked:", note.id);
                if (activeNote?.id !== note.id) {
                  setActiveNote(note);
                } else {
                  console.log("Attempt to set the same active note:", note.id);
                }
              }}
              onMouseOver={() => setHoveredNoteId(note.id)}
              onMouseOut={() => setHoveredNoteId(null)}
              // make the marker green if it's the hovered note
              icon={{
                scaledSize: new window.google.maps.Size(40, 40),
                origin: new window.google.maps.Point(0, 0),
                anchor: new window.google.maps.Point(20, 20),
                label: {
                  text: getMarkerLabel(note),
                  color: "black",
                  fontSize: "12px",
                },
                // color: hoveredNoteId === note.id ? "green" : "red",
              }}
              zIndex={index}
            />
            
            ))}
            {activeNote && (
              <InfoWindow
                key={new Date().getMilliseconds() + new Date().getTime()}
                position={{
                  lat: parseFloat(activeNote.latitude),
                  lng: parseFloat(activeNote.longitude),
                }}
                onCloseClick={() => {
                  setActiveNote(null);
                }}
              >
              <div className="transition-transform duration-300 ease-in-out hover:scale-105 hover:shadow-lg">
              <ClickableNote note={activeNote} />
              </div>
               
              </InfoWindow>
            )}
          </GoogleMap>
        )}
      </div>
      <div className="h-full overflow-y-auto bg-white grid grid-cols-1 lg:grid-cols-2 gap-2 p-2">
  {filteredNotes.map((note) => (
    <div className="transition-transform duration-300 ease-in-out hover:scale-105 hover:shadow-lg hover:shadow-[color] cursor-pointer">
      <ClickableNote key={note.id} note={note} />
    </div>
  ))}
</div>


    </div>
  );
};

export default Page;
