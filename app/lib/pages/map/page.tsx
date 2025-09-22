"use client";
import React, { useEffect, useState, useRef } from "react";
import { GoogleMap } from "@react-google-maps/api";
import SearchBarMap from "../../components/search_bar_map";
import { Note, newNote } from "@/app/types";
import ApiService from "../../utils/api_service";
import DataConversion from "../../utils/data_conversion";
import { User } from "../../models/user_class";
import ClickableNote from "../../components/click_note_card";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import introJs from "intro.js";
import "intro.js/introjs.css";
// import "../../../globals.css";

import { CompassIcon, GlobeIcon, LocateIcon, Navigation, UserIcon, Plus, Minus } from "lucide-react";
import * as ReactDOM from "react-dom/client";
import { useInfiniteNotes, NOTES_PAGE_SIZE } from "../../hooks/useInfiniteNotes";
import { toast } from "sonner";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import { getItem, setItem } from "../../utils/async_storage";
import { useGoogleMaps } from "../../utils/GoogleMapsContext";

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
  const mapRef = useRef<google.maps.Map>();
  const markerClustererRef = useRef<MarkerClusterer>();
  const [emptyRegion, setEmptyRegion] = useState(false);
  const noteRefs = useRef<Refs>({});
  const [currentPopup, setCurrentPopup] = useState<any | null>(null);
  const [markers, setMarkers] = useState(new Map());
  const [skip, setSkip] = useState(0);
  const infinite = useInfiniteNotes<Note>({
    items: filteredNotes,
    pageSize: NOTES_PAGE_SIZE,
  });

  const [lastGlobalDate, setLastGlobalDate] = useState<string | undefined>(undefined);
  const [lastPersonalDate, setLastPersonalDate] = useState<string | undefined>(undefined);

  const user = User.getInstance();
  const { isMapsApiLoaded } = useGoogleMaps();

  const handleNoteSelect = (note: Note | newNote, isNewNote: boolean) => {
    if (isNewNote) {
      // Create a new Note from the newNote template, assigning default values for missing fields.
      const newNoteWithDefaults: Note = {
        ...note, // Spread existing newNote fields
        id: "temporary-id", // Assign a temporary ID for new note
        uid: "temporary-uid", // Assign a temporary UID
      };
      console.log("New note created:", newNoteWithDefaults);
    } else {
      console.log("Existing note selected:", note);
    }
  };

  const searchBarRef = useRef<HTMLDivElement | null>(null);
  const notesListRef = useRef<HTMLDivElement | null>(null);
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

  useEffect(() => {
    let isSubscribed = true;
    const fetchLastLocation = async () => {
      try {
        const lastLocationString = await getItem("LastLocation");
        const lastLocation = lastLocationString ? JSON.parse(lastLocationString) : null;
        if (isSubscribed) {
          setMapCenter(lastLocation);
          setMapZoom(10);
          setLocationFound(true);
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
        if (!locationFound && isComponentMounted) {
          setMapCenter(currentLocation);
          setMapZoom(10);
        }
        await setItem("LastLocation", JSON.stringify(currentLocation));
      } catch (error) {
        if (isComponentMounted) {
          const defaultLocation = { lat: 38.637334, lng: -90.286021 };
          setMapCenter(defaultLocation);
          setMapZoom(10);
          setLocationFound(true);
          console.log("Using last known location due to error:", error);
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
    markers.forEach((marker, noteId) => {
      const isHovered = hoveredNoteId === noteId;
      marker.setIcon(createMarkerIcon(isHovered));
      marker.setZIndex(isHovered ? google.maps.Marker.MAX_ZINDEX + 1 : null);
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
      const tempMarkers = new Map();

      const attachMarkerEvents = (marker: google.maps.Marker, note: Note) => {
        google.maps.event.clearListeners(marker, "click");
        google.maps.event.clearListeners(marker, "mouseover");
        google.maps.event.clearListeners(marker, "mouseout");

        marker.addListener("click", () => handleMarkerClick(note));

        marker.addListener("mouseover", () => {
          setHoveredNoteId(note.id);
          scrollToNoteTile(note.id);
          setActiveNote(note);
          marker.setIcon(createMarkerIcon(true));
        });

        marker.addListener("mouseout", () => {
          setHoveredNoteId(null);
          setActiveNote(null);
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

      setIsLoaded(false);

      return () => {
        if (markerClustererRef.current) {
          markerClustererRef.current.clearMarkers();
        }
      };
    }
  }, [isMapsApiLoaded, filteredNotes, mapRef.current]);

  const handleMapClick = () => {
    if (currentPopup) {
      currentPopup.setMap(null);
    }
    setCurrentPopup(null);
    setActiveNote(null);
  };

  const onMapLoad = React.useCallback((map: any) => {
    // console.log('Map loaded:', map);
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

  const handleMarkerClick = (note: Note) => {
    if (currentPopup) {
      currentPopup.setMap(null);
      setCurrentPopup(null);
    }

    setActiveNote(note);
    scrollToNoteTile(note.id);

    const map = mapRef.current;

    if (map) {
      const popupContent = document.createElement("div");
      const root = ReactDOM.createRoot(popupContent);
      root.render(<ClickableNote note={note} />);

      class Popup extends google.maps.OverlayView {
        position: google.maps.LatLng;
        containerDiv: HTMLDivElement;

        constructor(position: google.maps.LatLng, content: HTMLElement) {
          super();
          this.position = position;

          content.classList.add("popup-bubble");

          const bubbleAnchor = document.createElement("div");

          bubbleAnchor.classList.add("popup-bubble-anchor");
          bubbleAnchor.appendChild(content);

          this.containerDiv = document.createElement("div");
          this.containerDiv.classList.add("popup-container");
          this.containerDiv.appendChild(bubbleAnchor);

          Popup.preventMapHitsAndGesturesFrom(this.containerDiv);
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
          }

          if (this.containerDiv.style.display !== display) {
            this.containerDiv.style.display = display;
          }
        }
      }

      let popup = new Popup(new google.maps.LatLng(parseFloat(note.latitude), parseFloat(note.longitude)), popupContent);

      setCurrentPopup(popup);

      popup.setMap(map);
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
            onDragStart={handleMapClick}
            onClick={handleMapClick}
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

      <div className="h-full overflow-y-auto bg-white grid grid-cols-1 lg:grid-cols-2 gap-2 p-2" ref={notesListRef}>
        {isLoading
          ? [...Array(6)].map((_, index) => (
              <Skeleton key={index} className="w-64 h-[300px] rounded-sm flex flex-col border border-gray-200" />
            ))
          : infinite.visibleItems.map((note) => (
              <div
                ref={(el) => {
                  if (el) noteRefs.current[note.id] = el;
                }}
                className={`transition-transform duration-300 ease-in-out cursor-pointer max-h-[308px] max-w-[265px] ${
                  note.id === activeNote?.id ? "active-note" : "hover:scale-105 hover:shadow-lg hover:bg-gray-200"
                }`}
                onMouseEnter={() => setHoveredNoteId(note.id)}
                onMouseLeave={() => setHoveredNoteId(null)}
                key={note.id}
              >
                <ClickableNote note={note} />
              </div>
            ))}
        {/* <div className="flex justify-center w-full mt-4 mb-2">
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
        </div> */}

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
  );
};

export default Page;
