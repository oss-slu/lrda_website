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
import { Switch } from "@/components/ui/switch";
import { GlobeIcon, UserIcon } from "lucide-react";

const mapAPIKey = process.env.NEXT_PUBLIC_MAP_KEY || "";

interface Location {
  lat: number;
  lng: number;
}

interface Refs {
  [key: string]: HTMLElement | undefined;
}

const useExternalScript = (scriptUrl:string) => {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = scriptUrl;
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [scriptUrl]);
};

const useExternalCSS = (cssUrl:string) => {
  useEffect(() => {
    const link = document.createElement('link');
    link.href = cssUrl;
    link.rel = 'stylesheet';
    link.type = 'text/css';
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, [cssUrl]);
};


const Page = () => {
  // Load the Intro.js script
  useExternalScript('https://cdnjs.cloudflare.com/ajax/libs/intro.js/7.2.0/intro.min.js');

  // Load the Intro.js CSS
  useExternalCSS('https://cdnjs.cloudflare.com/ajax/libs/intro.js/7.2.0/introjs.min.css');
  
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
  const [isLoading, setIsLoading] = useState(false);
  const noteRefs = useRef<Refs>({});

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

  const getRandomNoteInBounds = (notes: any[], mapBounds: { contains: (arg0: google.maps.LatLng) => any; }) => {
    // Assuming mapBounds is a google.maps.LatLngBounds object
    if (!mapBounds) return null;
  
    const notesInBounds = notes.filter((note: { latitude: string; longitude: string; }) => {
      const lat = parseFloat(note.latitude);
      const lng = parseFloat(note.longitude);
      return mapBounds.contains(new google.maps.LatLng(lat, lng));
    });
  
    if (notesInBounds.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * notesInBounds.length);
    return notesInBounds[randomIndex];
  };
  
  const focusOnNote = (note: { latitude: string; longitude: string; }, setMapCenter: (arg0: { lat: number; lng: number; }) => void, setMapZoom: (arg0: number) => void) => {
    if (!note) return;
  
    const newCenter = { lat: parseFloat(note.latitude), lng: parseFloat(note.longitude) };
    setMapCenter(newCenter);
    setMapZoom(10); // Adjust zoom level as needed
  };

  const startTour = () => {
    setTimeout(() => {
      if (window.introJs) {
        const tour = window.introJs();
        
        let currentlyHighlightedNoteId: null = null; // To keep track of the currently animated marker
  
        tour.onbeforechange(function(this: any) {
          // This checks if the current step is the one intended to focus on the map marker.
          if (this._currentStep === 1) { // Adjust the step index as needed
            if (mapBounds) {
              // Retrieve a random note within the current map bounds
              const randomNote = getRandomNoteInBounds(notes, mapBounds);
              
              if (randomNote && markers.has(randomNote.id)) {
                const marker = markers.get(randomNote.id);
        
                // Start the bounce animation for the marker associated with the random note
                marker.setAnimation(google.maps.Animation.BOUNCE);
        
                // Adjust the map center and possibly zoom level to ensure the marker is in view
                // Comment out or adjust the zoom functionality as per your requirements
                setMapCenter({ lat: parseFloat(randomNote.latitude), lng: parseFloat(randomNote.longitude) });
                // setMapZoom(15); // Optional: Adjust or remove depending on whether zooming is desired
        
                // Dynamically update the tour text to guide users' attention to the bouncing marker
                this._introItems[this._currentStep].intro = `Notice the bouncing pin on the map. This represents the note titled "${randomNote.title}".`;
        
                // Track the ID of the currently highlighted note to manage the animation
                currentlyHighlightedNoteId = randomNote.id;
              }
            }
          } else if (currentlyHighlightedNoteId) {
            // This branch ensures the marker stops bouncing when the user moves to the next step
            const marker = markers.get(currentlyHighlightedNoteId);
            if (marker) {
              marker.setAnimation(null); // Stop the bounce animation
            }
            currentlyHighlightedNoteId = null; // Reset the tracker
          }
        });
  
        tour.onexit(() => {
          // Ensure animation is stopped if the tour is exited prematurely
          if (currentlyHighlightedNoteId) {
            const marker = markers.get(currentlyHighlightedNoteId);
            if (marker) {
              marker.setAnimation(null);
            }
          }
        });
  
        tour.setOptions({
          steps: [
            {
              element: '#noteSearchInput',
              intro: 'Use this search bar to quickly find notes by keywords.'
            },
            {
              // This step will be dynamically focused on a random note
              intro: "We'll now focus on a random note on the map.",
            },
            {
              element: '#noteVisibilityToggle',
              intro: 'Here you can switch between viewing all notes and your personal notes.',
              position: 'right'
            },
            {
              element: '#globeIcon',
              intro: 'Switching to this will render all user notes in the vicinity.',
              position: 'right'
            },
            {
              element: '#userIcon',
              intro: 'Switching to this will display only your personal notes.',
              position: 'right'
            },
            {
              element: '#notes-list',
              intro: 'Here are your notes. Click on one to see more details or to edit.',
              position: 'left'
            }
            // Add more steps as needed
          ]
        });
  
        tour.start();
      }
    }, 2000); // Delay of 2000 milliseconds (2 seconds)
  };

  return (
    <div className="flex flex-row w-screen h-[90vh] min-w-[600px]">
      <div className="flex flex-row absolute top-30 w-[30vw] left-0 z-10 m-5 align-center items-center">
        <div className="min-w-[80px] mr-3">
          <SearchBar id="noteSearchInput" onSearch={handleSearch} />
        </div>
        <button onClick={startTour} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
        Start Tour
        </button>
        {isLoggedIn ? (
        <div id="noteVisibilityToggle" className="flex flex-row justify-evenly items-center">
        <GlobeIcon id="globeIcon" className="text-primary" />
        <Switch onClick={toggleFilter} />
        <UserIcon id="userIcon" className="text-primary" />
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
                 <div
                    className="transition-transform duration-300 ease-in-out hover:scale-105 hover:shadow-lg"
                    onMouseLeave={() => setActiveNote(null)} // This handles mouse leave event
                >
                    <ClickableNote note={activeNote} />
                </div>
              </InfoWindow>
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