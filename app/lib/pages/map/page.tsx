"use client";
import React, { useEffect, useState, useRef } from "react";
import { GoogleMap, useJsApiLoader, MarkerF } from "@react-google-maps/api";
import SearchBar from "../../components/search_bar";
import { Note } from "@/app/types";
import ApiService from "../../utils/api_service";
import DataConversion from "../../utils/data_conversion";
import { User } from "../../models/user_class";
import ClickableNote from "../../components/click_note_card";
import { Switch } from "@/components/ui/switch";
import { GlobeIcon, UserIcon } from "lucide-react";
import { createRoot } from "react-dom/client";

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
  const [currentPopup, setCurrentPopup] = useState<any | null>(null);

  const user = User.getInstance();

  useEffect(() => {
    const map = mapRef.current;

    if (map) {
      const mapClickListener = map.addListener("click", () => {
        setActiveNote(null);
      });

      const mapDragListener = map.addListener("dragstart", () => {
        setActiveNote(null);
      });

      return () => {
        google.maps.event.removeListener(mapClickListener);
        google.maps.event.removeListener(mapDragListener);
      };
    }
  }, []);

  useEffect(() => {
    const currentNotes = global ? globalNotes : personalNotes;
    updateFilteredNotes(mapCenter, mapBounds, currentNotes);
  }, [mapCenter, mapZoom, mapBounds, globalNotes, personalNotes, global]);

  useEffect(() => {
    const map = mapRef.current;
    if (map) {
      const mapClickListener = map.addListener("click", handleMapClick);
      return () => google.maps.event.removeListener(mapClickListener);
    }
  }, []);

  useEffect(() => {
    markers.forEach((marker, noteId) => {
      const isHovered = hoveredNoteId === noteId;
      marker.setIcon(createMarkerIcon(isHovered));
      marker.setZIndex(isHovered ? google.maps.Marker.MAX_ZINDEX + 1 : null);
    });
  }, [hoveredNoteId, markers]);

  useEffect(() => {
    fetchNotes().then(({ personalNotes, globalNotes }) => {
      setPersonalNotes(personalNotes);
      setGlobalNotes(globalNotes);

      const initialNotes = global ? globalNotes : personalNotes;
      setNotes(initialNotes);
      setFilteredNotes(initialNotes);
    });
  }, [global]);

  const handleMapClick = () => {
    if (currentPopup) {
      currentPopup.setMap(null);
      setCurrentPopup(null);
    }
    setActiveNote(null);
  };

  const onMapLoad = React.useCallback((map: any) => {
    console.log("Map loaded:", map);
    mapRef.current = map;
  }, []);

  // const onMapLoad = React.useCallback((map: any) => {
  //   mapRef.current = map;
  //   const updateBounds = () => {
  //     const newCenter: Location = {
  //       lat: map.getCenter().lat(),
  //       lng: map.getCenter().lng(),
  //     };
  //     const newBounds = map.getBounds();

  //     setMapCenter(newCenter);
  //     setMapBounds(newBounds);
  //     updateFilteredNotes(newCenter, newBounds, notes);
  //   };

  //   map.addListener("dragend", updateBounds);
  //   map.addListener("zoom_changed", updateBounds);
  //   const mapClickListener = map.addListener("click", () => {
  //     setActiveNote(null); // This will hide the ClickableNote
  //   });

  //   const mapDragListener = map.addListener("dragstart", () => {
  //     setActiveNote(null); // This will hide the ClickableNote
  //   });

  //   setTimeout(() => {
  //     updateBounds();
  //   }, 100);
  //   return () => {
  //     google.maps.event.removeListener(mapClickListener);
  //     google.maps.event.removeListener(mapDragListener);
  //   };
  // }, []);

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

  const handleMarkerClick = (note: Note) => {
    handleMapClick();
    setActiveNote(note);
    scrollToNoteTile(note.id);

    const map = mapRef.current;

    console.log("inside handleMarkerClick funciton", map);

    class Popup extends google.maps.OverlayView {
      position: google.maps.LatLng;
      containerDiv: HTMLDivElement;

      constructor(position: google.maps.LatLng, content: HTMLElement) {
        super();
        this.position = position;

        content.classList.add("popup-bubble");

        // This zero-height div is positioned at the bottom of the bubble.
        const bubbleAnchor = document.createElement("div");

        bubbleAnchor.classList.add("popup-bubble-anchor");
        bubbleAnchor.appendChild(content);

        // This zero-height div is positioned at the bottom of the tip.
        this.containerDiv = document.createElement("div");
        this.containerDiv.classList.add("popup-container");
        this.containerDiv.appendChild(bubbleAnchor);

        // Optionally stop clicks, etc., from bubbling up to the map.
        Popup.preventMapHitsAndGesturesFrom(this.containerDiv);
      }

      /** Called when the popup is added to the map. */
      onAdd() {
        console.log(this, " BEING ADDED");
        this.getPanes()!.floatPane.appendChild(this.containerDiv);
      }

      /** Called when the popup is removed from the map. */
      onRemove() {
        console.log(this, " BEING Removed");
        if (this.containerDiv.parentElement) {
          this.containerDiv.parentElement.removeChild(this.containerDiv);
        }
      }

      /** Called each frame when the popup needs to draw itself. */
      draw() {
        console.log(this, " BEING drawed");
        const divPosition = this.getProjection().fromLatLngToDivPixel(
          this.position
        )!;

        // Hide the popup when it is far out of view.
        const display =
          Math.abs(divPosition.x) < 4000 && Math.abs(divPosition.y) < 4000
            ? "block"
            : "none";

        if (display === "block") {
          this.containerDiv.style.left = divPosition.x + "px";
          this.containerDiv.style.top = divPosition.y + "px";
        }

        if (this.containerDiv.style.display !== display) {
          this.containerDiv.style.display = display;
        }
      }
    }

    if (map) {
      console.log("BURUV");

      const popupContent = document.createElement("div");
      // Use createRoot to render the component into popupContent
      const root = createRoot(popupContent); // Create a root.
      root.render(<ClickableNote note={note} />); // Use the root to render.

      console.log("popupContent", popupContent);

      let popup = new Popup(
        new google.maps.LatLng(
          parseFloat(note.latitude),
          parseFloat(note.longitude)
        ),
        popupContent
      );
      if (currentPopup) {
        currentPopup.setMap(null);
        setCurrentPopup(null);
      }
      setCurrentPopup(popup);
      popup.setMap(map);
    }
  };

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
      return {
        url: "/markerG.png",
        scaledSize: new window.google.maps.Size(48, 48), // 20% larger than the default size (40, 40)
      };
    } else {
      return {
        url: "/markerR.png",
        scaledSize: new window.google.maps.Size(40, 40),
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
      noteTile.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
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
      <div ref={mapContainerRef} className="flex-grow">
        {isLoaded && (
          <GoogleMap
            mapContainerStyle={{ width: "100%", height: "100%" }}
            center={mapCenter}
            zoom={mapZoom}
            onLoad={onMapLoad}
            onClick={handleMapClick}
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
          </GoogleMap>
        )}
      </div>
      <div className="h-full overflow-y-auto bg-white grid grid-cols-1 lg:grid-cols-2 gap-2 p-2">
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          filteredNotes.map((note) => (
            <div
              ref={(el: HTMLElement | null) => {
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
