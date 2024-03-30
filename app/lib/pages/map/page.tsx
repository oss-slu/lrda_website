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
import { log } from "console";

const mapAPIKey = process.env.NEXT_PUBLIC_MAP_KEY || "";

interface Location {
  lat: number;
  lng: number;
}

interface Refs {
  [key: string]: HTMLElement | undefined;
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
  const [mapBounds, setMapBounds] = useState<google.maps.LatLngBounds | null>(
    null
  );
  const mapRef = useRef<google.maps.Map>();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notePixelPosition, setNotePixelPosition] = useState({ x: 0, y: 0 });
  const noteRefs = useRef<Refs>({});

  const user = User.getInstance();

  const onMapLoad = (map: any) => {
    mapRef.current = map;
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
        lat >= sw.lat() && lat <= ne.lat() && lng >= sw.lng() && lng <= ne.lng()
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
        personalNotes =
          DataConversion.convertMediaTypes(personalNotes).reverse();
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

  const handleMarkerClick = (note: Note) => {
    setActiveNote(note);
    scrollToNoteTile(note.id);
  
    const map = mapRef.current;
  
    if (map && mapContainerRef.current) {
      const overlay = new google.maps.OverlayView();
      overlay.draw = function() {}; // Empty function to satisfy the API
      overlay.setMap(map);
  
      // Wait for the overlay to be added to the map
      setTimeout(() => {
        const projection = overlay.getProjection();
  
        if (projection) {
          const latLng = new google.maps.LatLng(
            parseFloat(note.latitude),
            parseFloat(note.longitude)
          );
          const pixelPosition = projection.fromLatLngToDivPixel(latLng);
  
          if (pixelPosition) {
            const mapContainerRect = mapContainerRef.current.getBoundingClientRect();
            const xLength = mapContainerRect.right - mapContainerRect.left;
            const yLength = mapContainerRect.bottom - mapContainerRect.top;
  
            // Adding mapContainerRect.left to adjust 'left' position
            const left = pixelPosition.x ;
            const top = pixelPosition.y;
            console.log('xLength: ', xLength);
            console.log('yLength: ', yLength);
            setNotePixelPosition({ x: left + 290, y: top });
          }
        }
      }, 0);
    }
  };
  
  
  
  
  

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


  const toggleFilter = () => {
    setGlobal(!global);
    const notesToUse = !global ? globalNotes : personalNotes;
    setNotes(notesToUse);
    setFilteredNotes(notesToUse);
  };

  const scrollToNoteTile = (noteId: string) => {
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
      <div ref={mapContainerRef} className="flex-grow">
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
                  onClick={() => handleMarkerClick(note)}
                  icon={createMarkerIcon(isNoteHovered)}
                  zIndex={isNoteHovered ? 1 : 0}
                  onLoad={(marker) => {
                    setMarkers((prev) => new Map(prev).set(note.id, marker));
                  }}
                />
              );
            })}


{activeNote && (
  <div
    className="absolute"
    style={{
      left: `${notePixelPosition.x}px`,
      top: `${notePixelPosition.y}px`,
      pointerEvents: 'auto', 
    }}
  >
    <ClickableNote note={activeNote} onClose={() => setActiveNote(null)} />
  </div>
)}


          </GoogleMap>
        )}
      </div>
      <div className="h-full overflow-y-auto bg-white grid grid-cols-1 lg:grid-cols-2 gap-2 p-2">
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          filteredNotes.map((note) => (
            <div ref={(el: HTMLElement | null) => {
              if (el) {
                noteRefs.current[note.id] = el;
              }
            }}
              // within here I need to change the hover;scale-105 to a different class
              className={`transition-transform duration-300 ease-in-out cursor-pointer ${
                note.id === activeNote?.id
                  ? "active-note"
                  : "hover:scale-105 hover:shadow-lg hover:bg-gray-200"
              }`}
              onMouseEnter={() => setHoveredNoteId(note.id)}
              onMouseLeave={() => setHoveredNoteId(null)}
              key={note.id}
            >
              <ClickableNote note={note} />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Page;