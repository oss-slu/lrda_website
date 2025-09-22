// "use client";
// import React, { useEffect, useState, useRef } from "react";
// import { Note } from "@/app/types";
// import ApiService from "../../utils/api_service";
// import DataConversion from "../../utils/data_conversion";
// import { User } from "../../models/user_class";
// import ClickableNote from "../../components/click_note_card";
// import { Skeleton } from "@/components/ui/skeleton";
// import introJs from "intro.js";
// import "intro.js/introjs.css";

// import { CompassIcon, GlobeIcon, LocateIcon, Navigation, UserIcon, Plus, Minus } from "lucide-react";
// import * as ReactDOM from "react-dom/client";
// import { useInfiniteNotes, NOTES_PAGE_SIZE } from "../../hooks/useInfiniteNotes";
// import { toast } from "sonner";
// import { getItem, setItem } from "../../utils/async_storage";

// export default function MapSidebar() {
//   const [notes, setNotes] = useState<Note[]>([]);
//   const [isLoading, setIsLoading] = useState<boolean>(true);
//   const [activeNote, setActiveNote] = useState<Note | null>(null);
//   const notesListRef = useRef<HTMLDivElement>(null);
//   const noteRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

//   const fetchNotes1 = async () => {
//     try {
//       const userId = await user.getId();

//       let personalNotes: Note[] = [];
//       let globalNotes: Note[] = [];

//       if (userId) {
//         setIsLoggedIn(true);
//         personalNotes = await ApiService.fetchNotesByDate(16, lastPersonalDate, false, userId);
//         console.log("Fetched personal notes:", personalNotes);
//         // Sort by time ascending
//         personalNotes = personalNotes
//           .filter((note) => !note.isArchived)
//           .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

//         personalNotes = DataConversion.convertMediaTypes(personalNotes);

//         // Update cursor for next page
//         if (personalNotes.length > 0) {
//           setLastPersonalDate(personalNotes[personalNotes.length - 1].time.toISOString());
//         }
//       }

//       globalNotes = await ApiService.fetchNotesByDate(16, lastGlobalDate, true);

//       console.log("%cFetched global notes:%o", "color: green; font-weight: bold;", globalNotes); // Sort by time ascending
//       globalNotes = globalNotes.filter((note) => !note.isArchived).sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

//       globalNotes = DataConversion.convertMediaTypes(globalNotes);

//       // Update cursor for next page
//       if (globalNotes.length > 0) {
//         setLastGlobalDate(globalNotes[globalNotes.length - 1].time.toISOString());
//       }

//       setPersonalNotes((prev) => [...prev, ...personalNotes]);
//       setGlobalNotes((prev) => [...prev, ...globalNotes]);

//       const initialNotes = global ? globalNotes : personalNotes;
//       setNotes(initialNotes);

//       return { personalNotes, globalNotes };
//     } catch (error) {
//       console.error("Error fetching messages:", error);
//       return { personalNotes: [], globalNotes: [] };
//     }
//   };

//   return (
//     <div className="h-full overflow-y-auto bg-white grid grid-cols-1 lg:grid-cols-2 gap-2 p-2" ref={notesListRef}>
//       {isLoading
//         ? [...Array(6)].map((_, index) => (
//             <Skeleton key={index} className="w-64 h-[300px] rounded-sm flex flex-col border border-gray-200" />
//           ))
//         : infinite.visibleItems.map((note) => (
//             <div
//               ref={(el) => {
//                 if (el) noteRefs.current[note.id] = el;
//               }}
//               className={`transition-transform duration-300 ease-in-out cursor-pointer max-h-[308px] max-w-[265px] ${
//                 note.id === activeNote?.id ? "active-note" : "hover:scale-105 hover:shadow-lg hover:bg-gray-200"
//               }`}
//               onMouseEnter={() => setHoveredNoteId(note.id)}
//               onMouseLeave={() => setHoveredNoteId(null)}
//               key={note.id}
//             >
//               {/* Todo pull fetching out of this component */}
//               <ClickableNote note={note} />
//             </div>
//           ))}

//       <div className="col-span-full flex justify-center mt-4 min-h-10">
//         {infinite.hasMore ? (
//           <div ref={infinite.loaderRef as any} className="h-10 flex items-center justify-center w-full">
//             {infinite.isLoading && (
//               <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-primary" aria-label="Loading more" />
//             )}
//           </div>
//         ) : null}
//       </div>
//     </div>
//   );
// }
