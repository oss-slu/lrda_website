"use client";
import React, { useEffect, useState, useRef } from "react";
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

interface Location {
  lat: number;
  lng: number;
}

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
  const [hoveredNoteId, setHoveredNoteId] = useState<string | null>(null);
  const [markers, setMarkers] = useState(new Map());
  const [mapBounds, setMapBounds] = useState<google.maps.LatLngBounds | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const noteRefs = useRef({});
  
  const user = User.getInstance();

  const onMapLoad = (map: any) => {
    const updateBounds = () => {
      const newCenter: Location = {
        lat: map.getCenter().lat(),
        lng: map.getCenter().lng(),
      };
      const newBounds = map.getBounds();
      
      setMapCenter(newCenter);
      setMapBounds(newBounds);
      updateFilteredNotes(newCenter, newBounds, notes);
    };
  
    map.addListener("dragend", updateBounds);
    map.addListener("zoom_changed", updateBounds);
  
    setTimeout(() => {
      updateBounds();
    }, 100);
  };

  

  // Filter function
  const filterNotesByMapBounds = (
    bounds: google.maps.LatLngBounds | null,
    notes: Note[]
  ): Note[] => {
    if (!bounds) return notes;

    const ne = bounds.getNorthEast(); // North East corner
    const sw = bounds.getSouthWest(); // South West corner

    return notes.filter((note) => {
      const lat = parseFloat(note.latitude);
      const lng = parseFloat(note.longitude);
      return (
        lat >= sw.lat() &&
        lat <= ne.lat() &&
        lng >= sw.lng() &&
        lng <= ne.lng()
      );
    });
  };

  
  const updateFilteredNotes = async (
    center: Location,
    bounds: google.maps.LatLngBounds | null,
    allNotes: Note[]
  ) => {
    setIsLoading(true);
    const visibleNotes = filterNotesByMapBounds(bounds, allNotes);
    setFilteredNotes(visibleNotes);
    setIsLoading(false);
  };

  const fetchNotes = async () => {
    try {
      const userId = await user.getId();

      let personalNotes: Note[] = [];
      let globalNotes: Note[] = [];
      if (userId) {
        setIsLoggedIn(true);
        personalNotes = await ApiService.fetchUserMessages(userId);
        personalNotes = DataConversion.convertMediaTypes(personalNotes).reverse();
      }
      globalNotes = await ApiService.fetchPublishedNotes();
      globalNotes = DataConversion.convertMediaTypes(globalNotes).reverse();

      return { personalNotes, globalNotes };
    } catch (error) {
      console.error("Error fetching messages:", error);
      return { personalNotes: [], globalNotes: [] };
    }
  };

  useEffect(() => {
    fetchNotes().then(({ personalNotes, globalNotes }) => {
      setPersonalNotes(personalNotes);
      setGlobalNotes(globalNotes);

      const initialNotes = global ? globalNotes : personalNotes;
      setNotes(initialNotes);
      setFilteredNotes(initialNotes); // Initially, filteredNotes are the same as notes
    });
  }, [global]);

  // New useEffect hook for map bounds changes
  useEffect(() => {
    const currentNotes = global ? globalNotes : personalNotes;
    updateFilteredNotes(mapCenter, mapBounds, currentNotes);
  }, [mapCenter, mapZoom, mapBounds, globalNotes, personalNotes, global]);

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

  function createMarkerIcon(isHighlighted: boolean) {
    if (isHighlighted) {
      // Change the color to a highlighted color and increase the scale by 20%
      return {
        url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png", // A green icon URL
        scaledSize: new window.google.maps.Size(48, 48), // 20% larger than the default size (40, 40)
      };
    } else {
      // Return the default red marker icon
      return {
        url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png", // Default red icon URL
        scaledSize: new window.google.maps.Size(40, 40), // Default icon size
      };
    }
  }

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

  
  const scrollToNoteTile = (noteId) => {
    const noteTile = noteRefs.current[noteId];
    if (noteTile) {
      noteTile.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  useEffect(() => {
    markers.forEach((marker, noteId) => {
      const isHovered = hoveredNoteId === noteId;
      marker.setIcon(createMarkerIcon(isHovered));
      marker.setZIndex(isHovered ? google.maps.Marker.MAX_ZINDEX + 1 : null);
    });
  }, [hoveredNoteId, markers]);

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
            {filteredNotes.map((note, index) => {
              const isNoteHovered = hoveredNoteId === note.id;
              return (
                <MarkerF
                  key={note.id}
                  position={{
                    lat: parseFloat(note.latitude),
                    lng: parseFloat(note.longitude),
                  }}
                  onClick={() => {
                    setActiveNote(note);
                    scrollToNoteTile(note.id);
                  }}
                  icon={createMarkerIcon(isNoteHovered)}
                  zIndex={isNoteHovered ? 1 : 0}
                  onLoad={(marker) => {
                    setMarkers((prev) => new Map(prev).set(note.id, marker));
                  }}
                />
              );
            })}

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
      {isLoading ? (
          <div>Loading...</div> // Placeholder for loading state
        ) : (
        filteredNotes.map((note) => (
          <div
          ref={(el) => (noteRefs.current[note.id] = el)}

            className="transition-transform duration-300 ease-in-out hover:scale-105 hover:shadow-lg hover:shadow-[color] cursor-pointer"
            onMouseEnter={() => setHoveredNoteId(note.id)}
            onMouseLeave={() => setHoveredNoteId(null)}
            key={note.id}
          >
            <ClickableNote note={note} />
          </div>
        )))}
      </div>
    </div>
  );
};

export default Page;
