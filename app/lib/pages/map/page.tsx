"use client";
import React, { useEffect, useState, useRef } from "react";
import { GoogleMap } from "@react-google-maps/api";
import SearchBarMap from "../../components/search_bar_map";
import { Note, newNote } from "@/app/types";
import ApiService from "../../utils/api_service";
import DataConversion from "../../utils/data_conversion";
import { User } from "../../models/user_class";
import ClickableNote from "../../components/click_note_card";
import { Skeleton } from "@/components/ui/skeleton";
// intro.js will be loaded dynamically to avoid SSR issues

import { UserIcon, Plus, Minus, Users } from "lucide-react";
import * as ReactDOM from "react-dom/client";
import { useInfiniteNotes, NOTES_PAGE_SIZE } from "../../hooks/useInfiniteNotes";
import { toast } from "sonner";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import { getItem, setItem } from "../../utils/local_storage";
import { useGoogleMaps } from "../../utils/GoogleMapsContext";
import NoteCard from "../../components/note_card";
import { Dialog } from "@/components/ui/dialog";

interface Location {
  lat: number;
  lng: number;
}

interface Refs {
  [key: string]: HTMLElement | undefined;
}

const Page = () => {
  // Infinite notes manages visible count
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [personalNotes, setPersonalNotes] = useState<Note[]>([]);
  const [isNoteSelectedFromSearch, setIsNoteSelectedFromSearch] = useState(false);
  const [globalNotes, setGlobalNotes] = useState<Note[]>([]);
  const [global, setGlobal] = useState(true);
  const [mapCenter, setMapCenter] = useState<Location>({
    lat: 38.005984,
    lng: -24.334449,
  });
  const [mapZoom, setMapZoom] = useState(2);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoaded] = useState(true);
  const [locationFound, setLocationFound] = useState(false);
  const [hoveredNoteId, setHoveredNoteId] = useState<string | null>(null);
  const [mapBounds, setMapBounds] = useState<google.maps.LatLngBounds | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerClustererRef = useRef<MarkerClusterer | null>(null);

  const noteRefs = useRef<Refs>({});
  const currentPopupRef = React.useRef<any | null>(null);
  const hoverTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const markerHoveredRef = React.useRef(false);
  const popupHoveredRef = React.useRef(false);
  const [markers, setMarkers] = useState(new Map());
  const [modalNote, setModalNote] = useState<Note | null>(null);
  const infinite = useInfiniteNotes<Note>({
    items: filteredNotes,
    pageSize: NOTES_PAGE_SIZE,
  });

  const [isPanelOpen, setIsPanelOpen] = useState(true); // Default to open

  const [lastGlobalDate, setLastGlobalDate] = useState<string | undefined>(undefined);
  const [lastPersonalDate, setLastPersonalDate] = useState<string | undefined>(undefined);

  const user = User.getInstance();
  const { isMapsApiLoaded } = useGoogleMaps();

  const startPopupCloseTimer = () => {
    // Clear any timer that's already running
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
    }

    // Start a new timer
    hoverTimerRef.current = setTimeout(() => {
      // After 200ms, check if the mouse is NOT on the marker AND NOT on the popup
      if (!markerHoveredRef.current && !popupHoveredRef.current && currentPopupRef.current) {
        // If it's safe to close, close the popup
        currentPopupRef.current.setMap(null);
        currentPopupRef.current = null;
        setHoveredNoteId(null);
        setActiveNote(null);
      }
    }, 200); // 200ms delay
  };

  const searchBarRef = useRef<HTMLDivElement | null>(null);
  const notesListRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (typeof window === 'undefined') return; // Skip SSR
    const observer = new MutationObserver(async () => {
      const navbarCreateNoteButton = document.getElementById("navbar-create-note");
      const navbarLogoutButton = document.getElementById("navbar-logout");

      if (searchBarRef.current && navbarCreateNoteButton && noteRefs && notesListRef.current) {
        // Check if the intro has been shown before (from cookies)
        const introShown = document.cookie
          .split("; ")
          .find((row) => row.startsWith("introShown="))
          ?.split("=")[1];

        if (!introShown) {
          // Dynamically import intro.js only on client side
          const introJs = (await import("intro.js")).default;
          const intro = introJs.tour();

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

  useEffect(() => {
    let isSubscribed = true;
    const fetchLastLocation = async () => {
      try {
        const lastLocationString = await getItem("LastLocation");
        const lastLocation = lastLocationString ? JSON.parse(lastLocationString) : null;
        if (isSubscribed) {
          if (lastLocation && typeof lastLocation.lat === "number" && typeof lastLocation.lng === "number") {
            setMapCenter(lastLocation);
            setMapZoom(10);
            setLocationFound(true);
          } else {
            throw new Error("Invalid or missing last location in storage.");
          }
        }
      } catch (error) {
        const defaultLocation = { lat: 38.637334, lng: -90.286021 };
        setMapCenter(defaultLocation as Location);
        setMapZoom(10);
        setLocationFound(true);
        console.error("Failed to fetch the last location", error);
      }
    };
    fetchLastLocation();
    return () => {
      isSubscribed = false;
    };
  }, []);

  useEffect(() => {
    let isComponentMounted = true;

    const fetchCurrentLocationAndUpdate = async () => {
      try {
        const currentLocation = (await getLocation()) as Location;

        if (currentLocation && typeof currentLocation.lat === "number" && typeof currentLocation.lng === "number") {
          if (!locationFound && isComponentMounted) {
            setMapCenter(currentLocation);
            setMapZoom(10);
          }
          await setItem("LastLocation", JSON.stringify(currentLocation));
        } else {
          throw new Error("Failed to get valid coordinates from getLocation()");
        }
      } catch (error) {
        if (isComponentMounted) {
          const defaultLocation = { lat: 38.637334, lng: -90.286021 };
          setMapCenter(defaultLocation);
          setMapZoom(10);
          setLocationFound(true);
          console.log("Using default location due to error:", error);
        }
      }
    };

    fetchCurrentLocationAndUpdate();

    return () => {
      isComponentMounted = false;
    };
  }, [locationFound]);

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
    if (!isNoteSelectedFromSearch) {
      updateFilteredNotes(mapCenter, mapBounds, currentNotes);
    }
    setIsLoaded(false);
  }, [mapCenter, mapZoom, mapBounds, globalNotes, personalNotes, global]);

  useEffect(() => {
    const map = mapRef.current;
    if (map) {
      const mapClickListener = map.addListener("click", handleMapClick);
      return () => google.maps.event.removeListener(mapClickListener);
    }
  }, []);

  useEffect(() => {
    markers.forEach(({ marker, iconNode }, noteId) => {
      const isHovered = hoveredNoteId === noteId;
    });
  }, [hoveredNoteId, markers]);

  useEffect(() => {
    if (locationFound) {
      fetchNotes().then(({ personalNotes, globalNotes }) => {
        setPersonalNotes(personalNotes);
        setGlobalNotes(globalNotes);
        const initialNotes = global ? globalNotes : personalNotes;
        setNotes(initialNotes);
      });
    }
  }, [locationFound, global]);

  useEffect(() => {
    if (isMapsApiLoaded && mapRef.current && filteredNotes.length > 0) {
      const tempMarkers = new Map<string, google.maps.marker.AdvancedMarkerElement>();
      const map = mapRef.current;

      const mapClickListener = map.addListener("click", () => {
        if (currentPopupRef.current) {
          console.log("Removing existing popup (map click)");
          currentPopupRef.current.setMap(null);
          currentPopupRef.current = null;
          setActiveNote(null);
        }
      });

      class Popup extends google.maps.OverlayView {
        position: google.maps.LatLng;
        containerDiv: HTMLDivElement;
        isClickPopup: boolean; // Differentiates click from hover

        constructor(position: google.maps.LatLng, content: HTMLElement, isClickPopup: boolean = false) {
          super();
          this.position = position;
          this.isClickPopup = isClickPopup;
          content.classList.add("popup-bubble");
          const bubbleAnchor = document.createElement("div");
          bubbleAnchor.classList.add("popup-bubble-anchor");
          bubbleAnchor.appendChild(content);
          this.containerDiv = document.createElement("div");
          this.containerDiv.classList.add("popup-container");
          this.containerDiv.appendChild(bubbleAnchor);
          Popup.preventMapHitsAndGesturesFrom(this.containerDiv);

          // Add hover listeners to the popup itself
          this.containerDiv.addEventListener("mouseenter", () => {
            popupHoveredRef.current = true;
            if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
          });
          this.containerDiv.addEventListener("mouseleave", () => {
            popupHoveredRef.current = false;
            // Only auto-close if it was a HOVER popup
            if (!this.isClickPopup) {
              startPopupCloseTimer();
            }
          });
        }
        onAdd() {
          this.getPanes()!.floatPane.appendChild(this.containerDiv);
        }
        onRemove() {
          if (this.containerDiv.parentElement) {
            this.containerDiv.parentElement.removeChild(this.containerDiv);
          }
        }
        draw() {
          const divPosition = this.getProjection().fromLatLngToDivPixel(this.position)!;
          const display = Math.abs(divPosition.x) < 4000 && Math.abs(divPosition.y) < 4000 ? "block" : "none";
          if (display === "block") {
            this.containerDiv.style.left = divPosition.x + "px";
            this.containerDiv.style.top = divPosition.y + "px";
            this.containerDiv.style.transform = "translate(-50%, calc(-100% - 10px))"; // 10px above marker
          }
          if (this.containerDiv.style.display !== display) {
            this.containerDiv.style.display = display;
          }
        }
      }

      // 3. One function to open all popups
      const openPopup = (note: Note, isClick: boolean) => {
        // Close any existing popup first
        if (currentPopupRef.current) {
          currentPopupRef.current.setMap(null);
        }

        if (isClick) {
          setModalNote(note);
          return;
        }

        // Create the preview popup.
        const popupContent = document.createElement("div");
        const root = ReactDOM.createRoot(popupContent);

        // Render only the preview card
        root.render(<NoteCard note={note} />);

        // Create new popup
        const popup = new Popup(
          new google.maps.LatLng(parseFloat(note.latitude), parseFloat(note.longitude)),
          popupContent,
          isClick // This will be 'false'
        );

        // Save and show
        currentPopupRef.current = popup;
        popup.setMap(map);
      };

      const handleMarkerClick = (note: Note) => {
        console.log("handleMarkerClick start", note.id);

        if (currentPopupRef.current) {
          currentPopupRef.current.setMap(null);
          currentPopupRef.current = null;
        }

        setModalNote(note);

        setActiveNote(note);
        if (isPanelOpen) {
          scrollToNoteTile(note.id);
        }
      };

      const attachMarkerEvents = (marker: google.maps.marker.AdvancedMarkerElement, note: Note, iconNode: HTMLElement) => {
        const newIconNode = marker.content as HTMLElement;

        newIconNode.addEventListener("click", (e) => {
          e.stopPropagation();
          handleMarkerClick(note);
        });

        newIconNode.addEventListener("mouseenter", () => {
          // Don't show a hover popup if a click-popup is already open
          if (currentPopupRef.current && currentPopupRef.current.isClickPopup) {
            return;
          }

          if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
          markerHoveredRef.current = true;

          // Only open a new popup if one isn't already open
          if (!currentPopupRef.current) {
            openPopup(note, false); // Open as a "hover" popup
          }

          setHoveredNoteId(note.id);
          if (isPanelOpen) scrollToNoteTile(note.id);
          setActiveNote(note);
        });

        newIconNode.addEventListener("mouseleave", () => {
          markerHoveredRef.current = false;
          startPopupCloseTimer(); // This handles the delay
        });
      };

      // Create new AdvancedMarkerElement instances
      filteredNotes.forEach((note) => {
        const lat = parseFloat(note.latitude);
        const lng = parseFloat(note.longitude);
        if (isNaN(lat) || isNaN(lng)) {
          console.warn(`Skipping note ${note.id}: invalid coordinates`, note);
          return;
        }
        const position = new google.maps.LatLng(lat, lng);
        const iconNode = createMarkerIcon();
        const marker = new google.maps.marker.AdvancedMarkerElement({
          position,
          map,
          content: iconNode,
          title: note.title || "",
        });
        attachMarkerEvents(marker, note, iconNode);
        tempMarkers.set(note.id, marker);
        (marker as any).iconNode = iconNode;
      });

      setMarkers(tempMarkers);

      if (markerClustererRef.current) {
        markerClustererRef.current.clearMarkers();
      }

      markerClustererRef.current = new MarkerClusterer({
        markers: Array.from(tempMarkers.values()),
        map: mapRef.current,
      });

      setIsLoaded(false);

      return () => {
        if (markerClustererRef.current) {
          markerClustererRef.current.clearMarkers();
        }
        google.maps.event.removeListener(mapClickListener);
      };
    }
  }, [isMapsApiLoaded, filteredNotes, mapRef.current]);

  const handleMapClick = () => {
    if (currentPopupRef.current) {
      currentPopupRef.current.setMap(null);
    }
    currentPopupRef.current = null;
    setActiveNote(null);
  };

  const onMapLoad = React.useCallback((map: any) => {
    // console.log('Map loaded:', map);
    mapRef.current = map;

    const updateBounds = () => {
      const lat = map.getCenter()?.lat();
      const lng = map.getCenter()?.lng();

      if (typeof lat === "number" && typeof lng === "number") {
        setMapCenter({ lat, lng });
        setMapBounds(map.getBounds());
      } else {
        // Optional: log an error if you didn't get valid numbers
        console.warn("Map bounds update skipped: invalid center");
      }
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

  const updateFilteredNotes = async (center: Location, bounds: google.maps.LatLngBounds | null, allNotes: Note[]) => {
    const visibleNotes = filterNotesByMapBounds(bounds, allNotes);
    setFilteredNotes(visibleNotes);
    setIsLoaded(false);
  };

  const fetchNotes = async () => {
    try {
      const userId = await user.getId();

      let personalNotes: Note[] = [];
      let globalNotes: Note[] = [];
      if (userId) {
        setIsLoggedIn(true);
        personalNotes = (await ApiService.fetchUserMessages(userId)).filter((note) => !note.isArchived); //filter here?

        // Convert media types and filter out archived notes for personal notes
        personalNotes = DataConversion.convertMediaTypes(personalNotes)
          .reverse()
          .filter((note) => !note.isArchived); // Filter out archived personal notes
      }

      globalNotes = (await ApiService.fetchPublishedNotes()).filter((note) => !note.isArchived);

      // Convert media types and filter out archived notes for global notes
      globalNotes = DataConversion.convertMediaTypes(globalNotes)
        .reverse()
        .filter((note) => !note.isArchived); // Filter out archived global notes

      return { personalNotes, globalNotes };
    } catch (error) {
      console.error("Error fetching messages:", error);
      return { personalNotes: [], globalNotes: [] };
    }
  };

  const fetchNotes1 = async () => {
    try {
      const userId = await user.getId();

      let personalNotes: Note[] = [];
      let globalNotes: Note[] = [];

      if (userId) {
        setIsLoggedIn(true);
        personalNotes = await ApiService.fetchNotesByDate(16, lastPersonalDate, false, userId);
        console.log("Fetched personal notes:", personalNotes);
        // Sort by time ascending
        personalNotes = personalNotes
          .filter((note) => !note.isArchived)
          .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

        personalNotes = DataConversion.convertMediaTypes(personalNotes);

        // Update cursor for next page
        if (personalNotes.length > 0) {
          setLastPersonalDate(personalNotes[personalNotes.length - 1].time.toISOString());
        }
      }

      globalNotes = await ApiService.fetchNotesByDate(16, lastGlobalDate, true);

      console.log("%cFetched global notes:%o", "color: green; font-weight: bold;", globalNotes); // Sort by time ascending
      globalNotes = globalNotes.filter((note) => !note.isArchived).sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

      globalNotes = DataConversion.convertMediaTypes(globalNotes);

      // Update cursor for next page
      if (globalNotes.length > 0) {
        setLastGlobalDate(globalNotes[globalNotes.length - 1].time.toISOString());
      }

      setPersonalNotes((prev) => [...prev, ...personalNotes]);
      setGlobalNotes((prev) => [...prev, ...globalNotes]);

      const initialNotes = global ? globalNotes : personalNotes;
      setNotes(initialNotes);

      return { personalNotes, globalNotes };
    } catch (error) {
      console.error("Error fetching messages:", error);
      return { personalNotes: [], globalNotes: [] };
    }
  };

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
    console.log("Filtered:", filtered);
  };

  function createMarkerIcon(): HTMLElement {
    const div = document.createElement("div");
    div.classList.add("custom-marker");
    div.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="40" height="40" class="marker-svg">
        <path class="marker-body" fill="#4285F4" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
        <circle class="marker-center" fill="white" cx="12" cy="9" r="2.5"/>
      </svg>
    `;
    return div;
  }

  const toggleFilter = () => {
    setGlobal(!global);
    const notesToUse = !global ? globalNotes : personalNotes;
    setNotes(notesToUse);
    setFilteredNotes(notesToUse);
    setIsLoaded(false);
  };

  const scrollToNoteTile = (noteId: string) => {
    const noteTile = noteRefs.current[noteId];
    if (noteTile) {
      noteTile.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };

  function getLocation() {
    toast("Fetching Location", {
      description: "Getting your location. This can take a second.",
      duration: 3000,
    });
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
      const newCenter = (await getLocation()) as Location;

      if (newCenter && typeof newCenter.lat === "number" && typeof newCenter.lng === "number") {
        setMapCenter(newCenter);
        mapRef.current?.panTo(newCenter);
        mapRef.current?.setZoom(13);
      } else {
        throw new Error("Failed to get valid coordinates from getLocation()");
      }
    } catch (error) {
      console.error("Failed to set location:", error);
    }
  }

  return (
    <div className="w-screen h-full min-w-[600px] relative overflow-hidden">
      <div className="w-full h-full">
        {isMapsApiLoaded && (
          <GoogleMap
            mapContainerStyle={{ width: "100%", height: "100%" }}
            center={mapCenter}
            zoom={mapZoom}
            onLoad={onMapLoad}
            onDragStart={handleMapClick}
            onClick={handleMapClick}
            options={{
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: false,
              disableDefaultUI: true,
              mapId: process.env.NEXT_PUBLIC_MAP_ID,
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
                      <Users className="w-4 h-4 md:w-5 md:h-5 xl:w-6 xl:h-6" />
                    ) : (
                      <UserIcon className="w-4 h-4 md:w-5 md:h-5 xl:w-6 xl:h-6" />
                    )}
                  </button>
                ) : null}
              </div>
              <div
                className={`flex flex-row items-center gap-2 transition-all duration-300 ease-in-out mr-4
                              ${isPanelOpen ? "mr-[35rem]" : "mr-4"}`}
              >
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

      {/* NEW: Toggle Button */}
      <button
        onClick={() => setIsPanelOpen(!isPanelOpen)}
        className={`absolute top-1/2 z-20 -translate-y-1/2 bg-white rounded-full
                    shadow-md w-8 h-8 flex items-center justify-center 
                    transition-all duration-300 ease-in-out hover:bg-gray-100`}
        style={{
          // This '34rem' MUST match the 'w-[34rem]' of your panel below
          right: isPanelOpen ? "34rem" : "1rem",
        }}
      >
        {isPanelOpen ? ">" : "<"}
      </button>
      {/* END NEW */}

      {/* NOTES PANEL */}
      <div
        className={`absolute top-0 right-0 h-full overflow-y-auto bg-neutral-100
                    w-[34rem] transition-transform duration-300 ease-in-out z-10
                    ${isPanelOpen ? "translate-x-0" : "translate-x-full"}`}
        ref={notesListRef}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 p-2 content-start">
          {isLoading ? (
            // --- LOADING STATE ---
            [...Array(6)].map((_, index) => (
              <Skeleton key={index} className="w-64 h-[300px] rounded-sm flex flex-col border border-gray-200" />
            ))
          ) : infinite.visibleItems.length > 0 ? (
            // --- NOTES FOUND STATE ---
            infinite.visibleItems.map((note) => (
              <div
                key={note.id}
                ref={(el) => {
                  if (el) noteRefs.current[note.id] = el;
                }}
                className={`transition-transform duration-300 ease-in-out cursor-pointer max-h-[308px] max-w-[265px] ${
                  note.id === activeNote?.id ? "active-note" : "hover:bg-gray-100"
                }`}
                onMouseEnter={() => setHoveredNoteId(note.id)}
                onMouseLeave={() => setHoveredNoteId(null)}
                onClick={() => setModalNote(note)}
              >
                <NoteCard note={note} />
              </div>
            ))
          ) : (
            // --- EMPTY STATE  ---
            <div className="col-span-full flex flex-col items-center justify-center text-center p-4 py-20">
              <h3 className="text-xl font-semibold text-gray-700 mt-4">No Results Found</h3>
              <p className="text-gray-500 mt-2">Sorry, there are no notes in this area. Try zooming out or moving the map.</p>
            </div>
          )}

          {/* --- INFINITE SCROLL LOADER --- */}
          <div className="col-span-full flex justify-center mt-4 min-h-10">
            {infinite.hasMore ? (
              <div ref={infinite.loaderRef as any} className="h-10 flex items-center justify-center w-full">
                {infinite.isLoading && (
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-primary" aria-label="Loading more" />
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
      <Dialog
        open={modalNote !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setModalNote(null);
          }
        }}
      >
        {modalNote && <ClickableNote note={modalNote} />}
      </Dialog>
    </div>
  );
};

export default Page;

{
  /* <div className="flex justify-center w-full mt-4 mb-2">
          <button
            className="mx-2 px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-700 transition-colors"
            onClick={handlePrevious}
            disabled={skip === 0}
          >
            Previous
          </button>
          <button
            className="mx-2 px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-700 transition-colors"
            onClick={handleNext}
          >
            Next
          </button>
        </div> */
}
