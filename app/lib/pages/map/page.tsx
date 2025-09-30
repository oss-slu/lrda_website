"use client";
import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { GoogleMap } from "@react-google-maps/api";
import SearchBarMap from "../../components/search_bar_map";
import { Note } from "@/app/types";
import ApiService from "../../utils/api_service";
import DataConversion from "../../utils/data_conversion";
import { User } from "../../models/user_class";
import ClickableNote from "../../components/click_note_card";
import introJs from "intro.js";
import "intro.js/introjs.css";
import MapSidebar from "./map_sidebar";

import { GlobeIcon, UserIcon, Plus, Minus } from "lucide-react";
import { toast } from "sonner";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import { getItem, setItem } from "../../utils/async_storage";
import { useGoogleMaps } from "../../utils/GoogleMapsContext";
import { useNotes } from "../../utils/NotesContext";

interface Location {
  lat: number;
  lng: number;
}

interface Refs {
  [key: string]: HTMLElement | undefined;
}

const Page = () => {
  const [personalOrGlobal, setPersonalOrGlobal] = useState<"personal" | "global">("global");
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [isNoteSelectedFromSearch, setIsNoteSelectedFromSearch] = useState(false);
  const [global, setGlobal] = useState(true);
  const [mapCenter, setMapCenter] = useState<Location>({
    lat: 38.005984,
    lng: -24.334449,
  });
  const [mapZoom, setMapZoom] = useState(2);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hoveredNoteId, setHoveredNoteId] = useState<string | null>(null);
  const [mapBounds, setMapBounds] = useState<google.maps.LatLngBounds | null>(null);
  const mapRef = useRef<google.maps.Map>();
  const markerClustererRef = useRef<MarkerClusterer>();
  const noteRefs = useRef<Refs>({});
  const [markers, setMarkers] = useState(new Map());
  const [userId, setUserId] = useState<string | null>(null);

  const user = User.getInstance();

  const { fetchPublishedNotes, fetchUserNotes, notes, isLoadingNotes } = useNotes();
  const personalNotes = useMemo(() => notes.filter((note) => note.creator === userId), [notes, userId]);
  const globalNotes = useMemo(() => notes.filter((note) => note.published), [notes, userId]);

  const [popupNote, setPopupNote] = useState<Note | null>(null);

  const { isMapsApiLoaded } = useGoogleMaps();

  const searchBarRef = useRef<HTMLDivElement | null>(null);
  const notesListRef = useRef<HTMLDivElement | null>(null);

  // Get user ID on mount
  useEffect(() => {
    let mounted = true;
    user.getId().then((id) => {
      if (mounted) setUserId(id);
      setIsLoggedIn(!!id);
    });
    return () => {
      mounted = false;
    };
  }, [user]);

  // Intro.js for first time users
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const navbarCreateNoteButton = document.getElementById("navbar-create-note");
      const navbarLogoutButton = document.getElementById("navbar-logout");

      if (searchBarRef.current && navbarCreateNoteButton && noteRefs && notesListRef.current) {
        // Check if the intro has been shown before (from cookies)
        const introShown = document.cookie
          .split("; ")
          .find((row) => row.startsWith("introShown="))
          ?.split("=")[1];

        if (!introShown) {
          const intro = introJs();

          intro.setOptions({
            steps: [
              {
                element: noteRefs.current?.current,
                intro: "Welcome! Let's explore the website together.",
              },
              {
                element: searchBarRef.current,
                intro: "First, here's the search bar. You can use it to help you find locations on the map.",
              },
              {
                element: notesListRef.current,
                intro: "Now, this is the notes list. You can use it to explore other people's notes!",
              },
              {
                element: navbarCreateNoteButton,
                intro: "Click here to create your own note!",
              },
              {
                element: navbarLogoutButton,
                intro: "Done for the day? Make sure to logout!",
              },
            ],
            scrollToElement: true,
            skipLabel: "Skip", // Change the look of this button
          });

          // When the user skips or completes the intro
          intro.oncomplete(() => {
            document.cookie = "introShown=true; path=/; max-age=31536000"; // 1 year expiry
          });

          intro.onexit(() => {
            document.cookie = "introShown=true; path=/; max-age=31536000"; // 1 year expiry
          });

          intro.start();

          // Apply inline styling to the skip button after a short delay to ensure it has rendered
          setTimeout(() => {
            const skipButton = document.querySelector(".introjs-skipbutton") as HTMLElement;
            if (skipButton) {
              skipButton.style.position = "absolute";
              skipButton.style.top = "2px"; // Move it up by decreasing the top value
              skipButton.style.right = "20px"; // Adjust positioning as needed
              skipButton.style.fontSize = "18px"; // Adjust font size as needed
              skipButton.style.padding = "4px 10px"; // Adjust padding as needed
            }
          }, 100); // 100ms delay to wait for rendering
        }

        observer.disconnect(); // Stop observing once the elements are found
      }
    });

    // Start observing the body for changes
    observer.observe(document.body, { childList: true, subtree: true });

    // Cleanup the observer when the component unmounts
    return () => {
      observer.disconnect();
    };
  }, [searchBarRef, noteRefs, notesListRef]);

  // Initialize map center and try to get user location
  useEffect(() => {
    let isMounted = true;

    async function initializeLocation() {
      // Try to load last location from storage
      let location = null;
      const lastLocationString = getItem("LastLocation");
      location = lastLocationString ? JSON.parse(lastLocationString) : null;

      // fetch location in background if we already have one stored (no toast)
      let showToast = false;

      // If no last location, use default
      if (!location) {
        location = { lat: 38.637334, lng: -90.286021 };
        showToast = true;
      }

      // Try to get current location from browser
      try {
        const currentLocation = await getLocation(showToast);
        location = currentLocation;
        setItem("LastLocation", JSON.stringify(currentLocation));
      } catch {
        // If browser location fails, keep previous location
      }

      // Set state if still mounted
      if (isMounted) {
        setMapCenter(location);
        setMapZoom(10);
      }
    }

    initializeLocation();

    return () => {
      isMounted = false;
    };
  }, []);

  // Update filtered notes when map center, zoom, bounds, or notes change
  useEffect(() => {
    const currentNotes = global ? globalNotes : personalNotes;
    if (!isNoteSelectedFromSearch) {
      updateFilteredNotes(mapBounds, currentNotes);
    }
  }, [mapCenter, mapZoom, mapBounds, globalNotes, personalNotes, global]);

  // Update marker icons based on hover state
  useEffect(() => {
    markers.forEach((marker, noteId) => {
      const isHovered = hoveredNoteId === noteId;
      marker.setIcon(createMarkerIcon(isHovered));
      marker.setZIndex(isHovered ? google.maps.Marker.MAX_ZINDEX + 1 : null);
    });
  }, [hoveredNoteId, markers]);

  // Update markers when filtered notes change
  useEffect(() => {
    if (isMapsApiLoaded && mapRef.current && filteredNotes.length > 0) {
      const tempMarkers = new Map();

      const attachMarkerEvents = (marker: google.maps.Marker, note: Note) => {
        google.maps.event.clearListeners(marker, "click");
        google.maps.event.clearListeners(marker, "mouseover");
        google.maps.event.clearListeners(marker, "mouseout");

        marker.addListener("click", () => handleMarkerClick(note));

        marker.addListener("mouseover", () => {
          setHoveredNoteId(note.id);
          scrollToNoteTile(note.id);
          marker.setIcon(createMarkerIcon(true));
        });

        marker.addListener("mouseout", () => {
          setHoveredNoteId(null);
          marker.setIcon(createMarkerIcon(false));
        });
      };

      filteredNotes.forEach((note) => {
        const marker = new google.maps.Marker({
          position: new google.maps.LatLng(parseFloat(note.latitude), parseFloat(note.longitude)),
          icon: createMarkerIcon(false),
        });

        attachMarkerEvents(marker, note);
        tempMarkers.set(note.id, marker);
      });

      setMarkers(tempMarkers);

      if (markerClustererRef.current) {
        markerClustererRef.current.clearMarkers();
      }

      markerClustererRef.current = new MarkerClusterer({
        markers: Array.from(tempMarkers.values()),
        map: mapRef.current,
      });

      return () => {
        if (markerClustererRef.current) {
          markerClustererRef.current.clearMarkers();
        }
      };
    }
  }, [isMapsApiLoaded, filteredNotes, mapRef.current]);

  const onMapLoad = useCallback((map: any) => {
    mapRef.current = map;

    const updateBounds = () => {
      const newCenter: Location = {
        lat: map.getCenter()?.lat() || "",
        lng: map.getCenter()?.lng() || "",
      };
      const newBounds = map.getBounds();
      setMapCenter(newCenter);
      setMapBounds(newBounds);
    };

    map.addListener("dragend", updateBounds);
    map.addListener("zoom_changed", () => {
      updateBounds();
    });

    setTimeout(() => {
      updateBounds();
    }, 100);
  }, []);

  const filterNotesByMapBounds = (bounds: google.maps.LatLngBounds | null, notes: Note[]): Note[] => {
    if (!bounds) return notes;

    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();

    const returnVal = notes.filter((note) => {
      const lat = parseFloat(note.latitude);
      const lng = parseFloat(note.longitude);
      return lat >= sw.lat() && lat <= ne.lat() && lng >= sw.lng() && lng <= ne.lng();
    });
    return returnVal;
  };

  const updateFilteredNotes = async (bounds: google.maps.LatLngBounds | null, allNotes: Note[]) => {
    const visibleNotes = filterNotesByMapBounds(bounds, allNotes);
    setFilteredNotes(visibleNotes);
  };

  const handleMarkerClick = (note: Note) => {
    setPopupNote(note);
    scrollToNoteTile(note.id);
  };

  // Handles both address searches and note title searches
  const handleSearch = (address: string, lat?: number, lng?: number, isNoteClick?: boolean) => {
    if (isNoteClick) {
      setIsNoteSelectedFromSearch(true);
    } else {
      setIsNoteSelectedFromSearch(false);
      const query = address.trim().toLowerCase();
      const filtered = query
        ? notes.filter((note) => {
            const titleMatch = note.title && typeof note.title === "string" ? note.title.toLowerCase().includes(query) : false;

            const textMatch = note.text && typeof note.text === "string" ? note.text.toLowerCase().includes(query) : false;

            const tagsMatch =
              Array.isArray(note.tags) &&
              note.tags.some((tag) => tag.label && typeof tag.label === "string" && tag.label.toLowerCase().includes(query));

            return titleMatch || textMatch || tagsMatch;
          })
        : [...notes];

      setFilteredNotes(filtered);
    }

    if (lat !== undefined && lng !== undefined) {
      const newCenter = { lat, lng };
      mapRef.current?.panTo(newCenter);
      mapRef.current?.setZoom(10);
    }
  };

  // Handles searching within notes based on title or tags
  const handleNotesSearch = (searchText: string) => {
    const query = searchText.toLowerCase();
    const filtered = notes.filter((note) => {
      const titleMatch = note.title && typeof note.title === "string" ? note.title.toLowerCase().includes(query) : false;

      const tagsMatch =
        Array.isArray(note.tags) &&
        note.tags.some((tag) => tag.label && typeof tag.label === "string" && tag.label.toLowerCase().includes(query));

      return titleMatch || tagsMatch;
    });

    setFilteredNotes(filtered);
  };

  function createMarkerIcon(isHighlighted: boolean) {
    if (isHighlighted) {
      return {
        url: "/markerG.png",
        scaledSize: new window.google.maps.Size(48, 48),
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
    setFilteredNotes(notesToUse);
    setPersonalOrGlobal(!global ? "global" : "personal");
  };

  const scrollToNoteTile = (noteId: string) => {
    const noteTile = noteRefs.current[noteId];
    if (noteTile) {
      noteTile.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };

  function getLocation(showToast: boolean = true): Promise<Location> {
    if (showToast) {
      toast("Fetching Location", {
        description: "Getting your location. This can take a second.",
        duration: 3000,
      });
    }
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newCenter = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          resolve(newCenter);
        },
        (error) => {
          console.error("Error fetching location", error);
          reject(error);
        }
      );
    });
  }

  async function handleSetLocation() {
    try {
      const newCenter = await getLocation();
      setMapCenter(newCenter as Location);
      mapRef.current?.panTo(newCenter as Location);
      mapRef.current?.setZoom(13);
    } catch (error) {
      console.error("Failed to set location", error);
    }
  }

  return (
    <div className="flex flex-row w-screen h-full min-w-[600px]">
      <div className="flex-grow">
        {isMapsApiLoaded && (
          <GoogleMap
            mapContainerStyle={{ width: "100%", height: "100%" }}
            center={mapCenter}
            zoom={mapZoom}
            onLoad={onMapLoad}
            options={{
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: false,
              disableDefaultUI: true,
            }}
          >
            <div className="absolute flex flex-row mt-4 w-full h-10 justify-between z-10">
              <div className="flex flex-row w-[30vw] left-0 z-10 m-5 align-center items-center">
                <div className="min-w-[80px] mr-3" ref={searchBarRef}>
                  <SearchBarMap
                    onSearch={handleSearch}
                    onNotesSearch={handleNotesSearch}
                    isLoaded={isMapsApiLoaded}
                    filteredNotes={filteredNotes}
                  />
                </div>
                {isLoggedIn ? (
                  <button
                    aria-label={global ? "Show personal posts" : "Show global posts"}
                    onClick={toggleFilter}
                    type="button"
                    className={`rounded-full bg-white shadow hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors p-2 md:p-3 xl:p-3.5 mx-2 ${
                      global ? "text-blue-600" : "text-green-600"
                    }`}
                  >
                    {global ? (
                      <GlobeIcon className="w-4 h-4 md:w-5 md:h-5 xl:w-6 xl:h-6" />
                    ) : (
                      <UserIcon className="w-4 h-4 md:w-5 md:h-5 xl:w-6 xl:h-6" />
                    )}
                  </button>
                ) : null}
              </div>
              <div className="flex flex-row items-center gap-2 mr-4">
                {/* Zoom Out Button */}
                <button
                  aria-label="Zoom out"
                  className="rounded-full bg-white shadow hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 p-2 md:p-3 xl:p-3.5"
                  onClick={() => setMapZoom((z) => Math.max(z - 1, 1))}
                  type="button"
                >
                  <Minus className="text-gray-700 w-4 h-4 md:w-5 md:h-5 xl:w-6 xl:h-6" />
                </button>
                {/* Zoom In Button */}
                <button
                  aria-label="Zoom in"
                  className="rounded-full bg-white shadow hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 p-2 md:p-3 xl:p-3.5"
                  onClick={() => setMapZoom((z) => Math.min(z + 1, 21))}
                  type="button"
                >
                  <Plus className="text-gray-700 w-4 h-4 md:w-5 md:h-5 xl:w-6 xl:h-6" />
                </button>
                {/* Locate Button */}
                <button
                  aria-label="Find my location"
                  className="rounded-full bg-white shadow hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 ml-4 p-2 md:p-3 xl:p-3 flex items-center justify-center"
                  onClick={handleSetLocation}
                  type="button"
                >
                  <svg
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4 md:w-5 md:h-5 xl:w-7 xl:h-7 text-gray-600"
                  >
                    <path d="M11.087 20.914c-.353 0-1.219-.146-1.668-1.496L8.21 15.791l-3.628-1.209c-1.244-.415-1.469-1.172-1.493-1.587s.114-1.193 1.302-1.747l11.375-5.309c1.031-.479 1.922-.309 2.348.362.224.351.396.97-.053 1.933l-5.309 11.375c-.529 1.135-1.272 1.305-1.665 1.305zm-5.39-8.068 4.094 1.363 1.365 4.093 4.775-10.233-10.234 4.777z"></path>
                  </svg>
                </button>
              </div>
            </div>
          </GoogleMap>
        )}
      </div>
      <MapSidebar personalOrGlobal={personalOrGlobal} />
      {popupNote &&
        createPortal(
          <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center z-[9999]" onClick={() => setPopupNote(null)}>
            <div onClick={(e) => e.stopPropagation()}>
              <ClickableNote
                note={popupNote}
                open={true}
                onOpenChange={(open) => {
                  if (!open) setPopupNote(null);
                }}
              />
            </div>
          </div>,
          document.getElementById("popup-root")!
        )}
    </div>
  );
};

export default Page;
