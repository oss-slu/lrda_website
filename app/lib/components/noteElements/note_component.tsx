import React, { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Note, Tag } from "@/app/types";
import TimePicker from "./time_picker";
import { LinkBubbleMenu, RichTextEditor, type RichTextEditorRef } from "mui-tiptap";
import TagManager from "./tag_manager";
import LocationPicker from "./location_component";
import AudioPicker from "./audio_component";
import EditorMenuControls from "../editor_menu_controls";
import NoteToolbar from "./note_toolbar";
import useExtensions from "../../utils/use_extensions";
import { User } from "../../models/user_class";
import { Document, Packer, Paragraph } from "docx"; // For DOCX
import jsPDF from "jspdf"; // For PDF
import ApiService from "../../utils/api_service";
import { FileX2, SaveIcon, Calendar, MapPin, Music, MessageSquare, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import useNoteState from "./note_state";
import { toast } from "sonner";
import {
  handleTitleChange,
  handleDeleteNote,
  handleEditorChange,
  handleLocationChange,
  handleTagsChange, // Imported from note_handler
  handleTimeChange,
  handlePublishChange   as publishHandler,
  handleApprovalRequestChange as approvalRequestHandler,
} from "./note_handler";
import { PhotoType, VideoType, AudioType } from "../../models/media_class";
import { v4 as uuidv4 } from "uuid";
import { newNote } from "@/app/types";
import PublishToggle from "./publish_toggle";
import VideoComponent from "./videoComponent";
import { ScrollArea } from "@/components/ui/scroll-area";
import CommentSidebar from "../comments/CommentSidebar";
// intro.js will be loaded dynamically to avoid SSR issues
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import "intro.js/minified/introjs.min.css";

const user = User.getInstance();

type NoteEditorProps = {
  note?: Note | newNote;
  isNewNote: boolean;
};

export default function NoteEditor({ note: initialNote, isNewNote }: NoteEditorProps) {
  const { noteState, noteHandlers } = useNoteState(initialNote as Note);
  const rteRef = useRef<RichTextEditorRef>(null);
  const extensions = useExtensions({
    placeholder: "Add your own content here...",
  });

  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [loadingTags, setLoadingTags] = useState<boolean>(false);
  const [notes, setNotes] = useState<Note[]>([]); // Add this to define state for notes




  const titleRef = useRef<HTMLInputElement | null>(null);

  const saveRef = useRef<HTMLDivElement | null>(null);
  const dateRef = useRef<HTMLDivElement | null>(null);
  const deleteRef = useRef<HTMLDivElement | null>(null);
  const locationRef = useRef<HTMLDivElement | null>(null);

  const resolveMediaType = (media: any): string | undefined => {
    if (!media) return undefined;
    if (typeof media.getType === "function") {
      try {
        const type = media.getType();
        if (type === "photo") return "image";
        return type;
      } catch {
        return undefined;
      }
    }
    if (typeof media.type === "string") {
      const type = media.type.toLowerCase();
      if (type === "photo") return "image";
      return type;
    }
    return undefined;
  };

  const toPhotoType = (media: any): PhotoType | null => {
    if (!media) return null;
    if (media instanceof PhotoType) return media;
    const uri =
      media.uri ??
      (typeof media.getUri === "function" ? media.getUri() : undefined);
    if (!uri) return null;
    return new PhotoType({
      uuid: media.uuid ?? media.id ?? uuidv4(),
      uri,
      type: "image",
    });
  };

  const toVideoType = (media: any): VideoType | null => {
    if (!media) return null;
    if (media instanceof VideoType) return media;
    const uri =
      media.uri ??
      (typeof media.getUri === "function" ? media.getUri() : undefined);
    if (!uri) return null;
    return new VideoType({
      uuid: media.uuid ?? media.id ?? uuidv4(),
      uri,
      thumbnail: media.thumbnail ?? "",
      duration: media.duration ?? "",
      type: "video",
    });
  };

  const toAudioType = (media: any): AudioType | null => {
    if (!media) return null;
    if (media instanceof AudioType) return media;
    const uri =
      media.uri ??
      (typeof media.getUri === "function" ? media.getUri() : undefined);
    if (!uri) return null;
    return new AudioType({
      uuid: media.uuid ?? media.id ?? uuidv4(),
      uri,
      duration: media.duration ?? "0:00",
      name: media.name ?? "Audio Note",
      isPlaying: typeof media.isPlaying === "boolean" ? media.isPlaying : false,
      type: "audio",
    });
  };

  const normalizeImageMedia = (mediaList: any[] = []): PhotoType[] =>
    mediaList
      .filter((item) => resolveMediaType(item) === "image")
      .map(toPhotoType)
      .filter((item): item is PhotoType => Boolean(item));

  const normalizeVideoMedia = (mediaList: any[] = []): VideoType[] =>
    mediaList
      .filter((item) => resolveMediaType(item) === "video")
      .map(toVideoType)
      .filter((item): item is VideoType => Boolean(item));

  const normalizeAudioMedia = (mediaList: any[] = []): AudioType[] =>
    mediaList.map(toAudioType).filter((item): item is AudioType => Boolean(item));

  const escapeRegExp = (value: string) =>
    value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // Function to process content and convert image URLs to proper img tags
  const processContentForImages = (
    content: string,
    images: PhotoType[]
  ): string => {
    if (!content || !images || images.length === 0) return content;

    let processedContent = content;

    images.forEach((image) => {
      const uri = image?.uri;
      if (!uri) {
        return;
      }

      if (
        processedContent.includes(`src="${uri}"`) ||
        processedContent.includes(`src='${uri}'`)
      ) {
        return;
      }

      const imageUrlRegex = new RegExp(escapeRegExp(uri), "g");

      processedContent = processedContent.replace(
        imageUrlRegex,
        (match, offset, original) => {
          const preceding = original
            .slice(Math.max(0, offset - 5), offset)
            .toLowerCase();

          if (preceding.endsWith('src="') || preceding.endsWith("src='")) {
            return match;
          }

          return `<img src="${uri}" alt="Image" loading="lazy" style="max-width:100%;height:auto;" />`;
        }
      );
    });

    return processedContent;
  };

  const getCookie = (name: string) => {
    const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
    return match ? match[2] : null;
  };

  // Helper function to set a cookie
  const setCookie = (name: string, value: string, days: number) => {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value}; path=/; expires=${date.toUTCString()}`;
  };

  const [selectedFileType, setSelectedFileType] = useState<"pdf" | "docx">("pdf");
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const addNote = document.getElementById("add-note-button");
      const title = titleRef.current;
      const save = saveRef.current;
      const deleteButton = deleteRef.current;
      const date = dateRef.current;
      const location = locationRef.current;

      console.log("Observer triggered");

      // Check if all elements are present
      if (addNote && title && save && deleteButton && date && location && typeof window !== 'undefined') {
        Promise.all([
          import("intro.js"),
          import("intro.js/minified/introjs.min.css"),
        ])
          .then(([introJsModule]) => {
            const introFactory =
              (introJsModule as any).introJs ||
              (introJsModule as any).default ||
              introJsModule;
            if (typeof introFactory !== "function") {
              console.error("intro.js failed to load correctly");
              return;
            }
            const intro = introFactory();
            const hasAddNoteIntroBeenShown = getCookie("addNoteIntroShown");

            if (!hasAddNoteIntroBeenShown) {
              intro.setOptions({
              steps: [
                {
                  element: addNote,
                  intro: "Click this button to add a note",
                },
                {
                  element: title,
                  intro: "You can name your note here!",
                },
                {
                  element: save,
                  intro: "Make sure you save your note.",
                },
                {
                  element: deleteButton,
                  intro: "If you don't like your note, you can delete it here.",
                },
                {
                  element: date,
                  intro: "We will automatically date and time your entry!",
                },
                {
                  element: location,
                  intro: "Make sure you specify the location of your note.",
                },
              ],
              scrollToElement: false,
              skipLabel: "Skip",
            });

            intro.oncomplete(() => {
              // After the intro is completed, set the cookie
              setCookie("addNoteIntroShown", "true", 365);
            });

            intro.onexit(() => {
              // Set the cookie if the user exits the intro
              setCookie("addNoteIntroShown", "true", 365);
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
            observer.disconnect(); // Stop observing once the elements are found and the intro is set up
          })
          .catch((error) => {
            console.error("Failed to lazy load intro.js", error);
          });
      }
    });

    // Start observing the body for changes to detect when the elements appear
    observer.observe(document.body, { childList: true, subtree: true });

    // Cleanup the observer when the component unmounts
    return () => observer.disconnect();
  }, []);  // Empty dependency array ensures this effect runs only once

  // …at the top of your function component, after the refs and state hooks:

// Log the raw incoming note so you can inspect all its flags
useEffect(() => {
  if (initialNote) {
    console.log("🚀 initialNote payload:", initialNote);
    console.log(
      "🛎 approvalRequested on initialNote:",
      initialNote.approvalRequested
    );
  }
}, [initialNote]);

useEffect(() => {
  console.log("💡 noteState.note after init:", noteState.note);
}, [noteState.counter]);

  
  useEffect(() => {
    const editor = rteRef.current?.editor;
    if (noteState.videos.length > 0 && editor) {
      const newVideo = noteState.videos[noteState.videos.length - 1];
      const videoIndex = noteState.videos.length;
      const videoLink = `Video ${videoIndex}`;
      const videoUri = newVideo.uri;

      editor
        .chain()
        .focus()
        .command(({ tr, dispatch }) => {
          if (dispatch) {
            const endPos = tr.doc.content.size;
            const paragraphNodeForNewLine = editor.schema.node("paragraph");
            const textNode = editor.schema.text(videoLink, [editor.schema.marks.link.create({ href: videoUri })]);
            const paragraphNodeForLink = editor.schema.node("paragraph", null, [textNode]);

            const transaction = tr.insert(endPos, paragraphNodeForNewLine).insert(endPos + 1, paragraphNodeForLink);
            dispatch(transaction);
          }
          return true;
        })
        .run();
    }
  }, [noteState.videos]);

  // Normalize initialNote into noteState
  useEffect(() => {
    if (!initialNote) return;

    const normalizedInitialNote = {
      ...initialNote,
      approvalRequested: initialNote.approvalRequested ?? false,
      isArchived: initialNote.isArchived ?? false,
      published: initialNote.published ?? false,
      media: initialNote.media ?? [],
      audio: initialNote.audio ?? [],
      tags: initialNote.tags ?? [],
    };

    // Set note object
    noteHandlers.setNote(normalizedInitialNote as Note);

    // BodyText fallback for HTML content
    const initialHtml =
      (normalizedInitialNote as any).text ||
      (normalizedInitialNote as any).BodyText ||
      "";
    
    // Process content to convert image URLs to proper img tags
    const processedHtml = processContentForImages(
      initialHtml,
      normalizeImageMedia(normalizedInitialNote.media as any[])
    );
    
    noteHandlers.setEditorContent(processedHtml);

    // Other fields
    noteHandlers.setTitle(normalizedInitialNote.title || "");
    noteHandlers.setTime(
      normalizedInitialNote.time ?? new Date(normalizedInitialNote.time!)
    );
    noteHandlers.setLongitude(normalizedInitialNote.longitude || "");
    noteHandlers.setLatitude(normalizedInitialNote.latitude || "");
    noteHandlers.setApprovalRequested(
      normalizedInitialNote.approvalRequested
    );
    noteHandlers.setImages(normalizeImageMedia(normalizedInitialNote.media as any[]));
    noteHandlers.setVideos(normalizeVideoMedia(normalizedInitialNote.media as any[]));
    noteHandlers.setAudio(normalizeAudioMedia(normalizedInitialNote.audio as any[]));
    noteHandlers.setTags(
      normalizedInitialNote.tags.map((t) =>
        typeof t === "string" ? { label: t, origin: "user" } : t
      )
    );
    noteHandlers.setIsPublished(normalizedInitialNote.published);

    // Trigger a re-render
    noteHandlers.setCounter((c) => c + 1);
  }, [initialNote]);
  
  
  


  
  const [userId, setUserId] = useState<string | null>(null);
  const [instructorId, setInstructorId] = useState<string | null>(null);
  const [isStudent, setIsStudent] = useState<boolean>(false);
  const [isInstructorUser, setIsInstructorUser] = useState<boolean>(false);
  const [canComment, setCanComment] = useState<boolean>(false);
  const [canEdit, setCanEdit] = useState<boolean>(true);
  const [commentRanges, setCommentRanges] = useState<Array<{ from: number; to: number }>>([]);

  useEffect(() => {
    const fetchUserDetails = async () => {
      const roles = await User.getInstance().getRoles();
      const fetchedUserId = await User.getInstance().getId();
      const fetchedInstructorId = await User.getInstance().getInstructorId();
      const isInstructorFlag = await User.getInstance().isInstructor();
      const isStudentRole = !!roles?.contributor && !roles?.administrator;
      
      // Check if student is part of teacher-student relationship
      let isStudentInTeacherStudentModel = false;
      if (isStudentRole && fetchedUserId) {
        try {
          const userData = await ApiService.fetchUserData(fetchedUserId);
          // Student must have parentInstructorId to be part of teacher-student model
          isStudentInTeacherStudentModel = !!userData?.parentInstructorId;
        } catch (error) {
          console.error("Error checking student relationship:", error);
        }
      }
      
      setIsStudent(isStudentInTeacherStudentModel);
      setUserId(fetchedUserId);
      setInstructorId(fetchedInstructorId);
      setIsInstructorUser(!!isInstructorFlag);
      
      // Allow commenting only for instructors or students in teacher-student model
      setCanComment(!!fetchedUserId && (isInstructorFlag || isStudentInTeacherStudentModel));
    };
    fetchUserDetails();
  }, []);

  // Determine editability: if instructor reviewing a student's note (not the creator), lock editing
  useEffect(() => {
    const ownerId = (noteState.note as any)?.creator;
    if (isInstructorUser && userId && ownerId && userId !== ownerId) {
      setCanEdit(false);
    } else {
      setCanEdit(true);
    }
  }, [isInstructorUser, userId, noteState.note]);

  // Keep Tiptap editor's editable state in sync at runtime
  useEffect(() => {
    const editor = (rteRef.current as any)?.editor;
    if (editor && typeof editor.setEditable === "function") {
      editor.setEditable(canEdit);
    }
  }, [canEdit]);

  // Listen for comment-added events to update decorations
  useEffect(() => {
    const handler = (e: any) => {
      const pos = e?.detail?.position;
      if (pos && typeof pos.from === "number" && typeof pos.to === "number") {
        setCommentRanges((prev) => [...prev, pos]);
      }
    };
    if (typeof window !== "undefined") {
      window.addEventListener("note:comment-added", handler);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("note:comment-added", handler);
      }
    };
  }, []);

  // Load existing comment ranges when note loads
  useEffect(() => {
    const loadComments = async () => {
      if (!noteState.note?.id) return;
      try {
        const comments = await ApiService.fetchCommentsForNote(noteState.note.id as string);
        const ranges = comments
          .map((c: any) => c.position)
          .filter((p: any) => p && typeof p.from === "number" && typeof p.to === "number");
        setCommentRanges(ranges);
      } catch (err) {
        // ignore
      }
    };
    loadComments();
  }, [noteState.note?.id]);

  // Apply inline highlight marks to visualize comment ranges
  useEffect(() => {
    const editor = rteRef.current?.editor as any;
    if (!editor) return;

    try {
      const docSize = editor.state.doc.content.size;
      // Clear existing highlights to prevent duplicates
      editor.chain().setTextSelection({ from: 1, to: docSize }).unsetHighlight().run();

      // Re-apply highlights for each comment range
      commentRanges.forEach(({ from, to }) => {
        if (typeof from === "number" && typeof to === "number" && from < to && to <= docSize) {
          try {
            editor.chain().setTextSelection({ from, to }).setHighlight({ color: '#FFF3BF' }).run();
          } catch {}
        }
      });
    } catch {}
  }, [commentRanges]);

  useEffect(() => {
    if (initialNote) {
      noteHandlers.setNote(initialNote as Note);
      
      // Process content to convert image URLs to proper img tags
      const processedContent = processContentForImages(
        initialNote.text || "",
        normalizeImageMedia(initialNote.media as any[])
      );
      
      noteHandlers.setEditorContent(processedContent);
      noteHandlers.setTitle(initialNote.title || "");

      noteHandlers.setImages(normalizeImageMedia(initialNote.media as any[]));
      noteHandlers.setTime(initialNote.time || new Date());
      noteHandlers.setLongitude(initialNote.longitude || "");
      noteHandlers.setLatitude(initialNote.latitude || "");

      noteHandlers.setTags(
        (initialNote.tags || []).map((tag) =>
          typeof tag === "string" ? { label: tag, origin: "user" } : tag
        )
      );

      noteHandlers.setAudio(normalizeAudioMedia(initialNote.audio as any[]));
      noteHandlers.setIsPublished(initialNote.published || false);

      // Set approvalRequested if present in initialNote
      noteHandlers.setApprovalRequested(
        initialNote.approvalRequested ?? false
      );

      noteHandlers.setVideos(normalizeVideoMedia(initialNote.media as any[]));
    }
  }, [initialNote]);

  const onSave = async () => {
    const updatedNote: any = {
      ...noteState.note,
      text: noteState.editorContent,
      title: noteState.title,
      media: [...noteState.images, ...noteState.videos],
      published: noteState.isPublished,
      approvalRequested: noteState.approvalRequested,
      time: noteState.time,
      longitude: noteState.longitude,
      latitude: noteState.latitude,
      tags: noteState.tags,
      audio: noteState.audio,
      id: noteState.note?.id || "",
      creator: noteState.note?.creator || user.getId(), // Ensure the creator is set
    };

    try {
      const roles = await user.getRoles(); // Fetch user roles
      const userId = await user.getId(); // Fetch user ID
      if (!userId) {
        throw new Error("User ID is null or undefined.");
      }
  
      if (roles?.contributor && !roles?.administrator) {
        // If the user is a student (part of teacher-student model)
        updatedNote.approvalRequested = true; // Set approvalRequested field
        updatedNote.instructorId = await user.getInstructorId(); // Set instructorId field
      }
  
      if (isNewNote) {
        await ApiService.writeNewNote(updatedNote); // Create a new note
        toast("Note Created", {
          description: "Your new note has been successfully created.",
          duration: 2000,
        });
      } else {
        await ApiService.overwriteNote(updatedNote); // Overwrite existing note
        toast("Note Saved", {
          description: "Your note has been successfully saved.",
          duration: 2000,
        });
      }
  
      noteHandlers.setCounter((prevCounter) => prevCounter + 1); // Force re-render
    } catch (error) {
      console.error("Error saving note:", error);
      toast("Error", {
        description: "Failed to save note. Try again later.",
        duration: 4000,
      });
    }
  };
  


  const handlePublishChange = async () => {
    const updatedNote: any = {
      ...noteState.note,
      text: noteState.editorContent,
      title: noteState.title,
      media: [...noteState.images, ...noteState.videos],
      time: noteState.time,
      longitude: noteState.longitude,
      latitude: noteState.latitude,
      tags: noteState.tags,
      audio: noteState.audio,
      id: noteState.note?.id || "",
      creator: noteState.note?.creator || user.getId(),
    };

    try {
      if (isStudent) {
        // Toggle approvalRequested for students
        updatedNote.approvalRequested = !noteState.approvalRequested;
        updatedNote.published = false; // Notes are not published until approval
        updatedNote.instructorId = instructorId;
  
        await ApiService.overwriteNote(updatedNote);
  
        noteHandlers.setApprovalRequested(!noteState.approvalRequested);
  
        toast(
          updatedNote.approvalRequested
            ? "Approval Requested"
            : "Approval Request Canceled",
          {
            description: updatedNote.approvalRequested
              ? "Your note has been submitted for instructor approval."
              : "Your approval request has been canceled.",
            duration: 4000,
          }
        );
      } else {
        // Toggle published for instructors/admins
        updatedNote.published = !noteState.isPublished;
        updatedNote.approvalRequested = false; // Admin/instructors don't need approval
  
        await ApiService.overwriteNote(updatedNote);
  
        noteHandlers.setIsPublished(!noteState.isPublished);
  
        toast(
          updatedNote.published ? "Note Published" : "Note Unpublished",
          {
            description: updatedNote.published
              ? "Your note has been published successfully."
              : "Your note has been unpublished successfully.",
            duration: 4000,
          }
        );
      }
  
      noteHandlers.setCounter((prevCounter) => prevCounter + 1); // Trigger re-render
    } catch (error) {
      console.error("Error updating note state:", error);
      toast("Error", {
        description: "Failed to update note state. Please try again later.",
        duration: 4000,
      });
    }
  };

  const handleRequestApprovalClick = async () => {
    try {
      const updatedApprovalStatus = !noteState.approvalRequested;
  
      const updatedNote: any = {
        ...noteState.note,
        text: noteState.editorContent,
        title: noteState.title,
        media: [...noteState.images, ...noteState.videos],
        time: noteState.time,
        longitude: noteState.longitude,
        latitude: noteState.latitude,
        tags: noteState.tags,
        audio: noteState.audio,
        id: noteState.note?.id || "",
        creator: noteState.note?.creator || user.getId(),
        approvalRequested: updatedApprovalStatus,
        instructorId: instructorId || null,
        published: false, // Student notes are never published directly
      };
  
      // 1. First update the main note
      const response = await ApiService.overwriteNote(updatedNote);
  
      if (response.ok) {
        if (updatedApprovalStatus && instructorId) {
          // 2. Also send approval request to instructor's Firestore document
          await ApiService.requestApproval({
            instructorId: instructorId,
            title: updatedNote.title || "",
            text: updatedNote.text || "",
            creator: updatedNote.creator || "",
            noteId: updatedNote.id || "",
            time: updatedNote.time || new Date(),
            latitude: updatedNote.latitude || "",
            longitude: updatedNote.longitude || "",
            tags: updatedNote.tags || [],
            approvalRequested: true,
          });
        }
  
        // 3. Update local frontend state
        noteHandlers.setApprovalRequested(updatedApprovalStatus);
  
        toast(
          updatedApprovalStatus
            ? "Approval Requested"
            : "Approval Request Canceled",
          {
            description: updatedApprovalStatus
              ? "Your note has been submitted for instructor approval."
              : "Your approval request has been canceled.",
            duration: 4000,
          }
        );
      } else {
        throw new Error("Failed to update approval status in backend.");
      }
    } catch (error) {
      console.error("Error requesting approval:", error);
      toast("Error", {
        description: "Failed to request approval. Please try again later.",
      });
    }
  };
  
  
  

  const handleDownload = async () => {
    if (!selectedFileType) {
      alert("Please select a file type.");
      return;
    }

    // Extract plain text from HTML content
    const plainTextContent = new DOMParser().parseFromString(noteState.editorContent, "text/html").body.innerText;

    const noteContent = `
      Title: ${noteState.title}
      Content: ${plainTextContent}
      Tags: ${noteState.tags.map((tag) => tag.label).join(", ")}
      Location: ${noteState.latitude}, ${noteState.longitude}
      Time: ${noteState.time}
    `;

    if (selectedFileType === "pdf") {
      // Generate PDF using jsPDF
      const pdf = new jsPDF();
      pdf.text(noteContent, 10, 10); // Add text to the PDF
      pdf.save(`${noteState.title || "note"}.pdf`); // Save the PDF file
    } else if (selectedFileType === "docx") {
      // Generate Word document using docx
      const doc = new Document({
        sections: [
          {
            children: [
              new Paragraph({
                text: `Title: ${noteState.title}`,
              }),
              new Paragraph(`Content: ${plainTextContent}`),
              new Paragraph(`Tags: ${noteState.tags.map((tag) => tag.label).join(", ")}`),
              new Paragraph(`Location: ${noteState.latitude}, ${noteState.longitude}`),
              new Paragraph(`Time: ${noteState.time}`),
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(doc); // Generate DOCX file as Blob
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${noteState.title || "note"}.docx`; // Set the filename
      link.click();
      URL.revokeObjectURL(url);
    }

    toast(`Your note has been downloaded as ${selectedFileType.toUpperCase()}`);
  };


  const addImageToNote = (imageUrl: string) => {
    console.log("Before updating images", noteState.images);
    const newImage = {
      type: "image",
      attrs: {
        src: imageUrl,
        alt: "Image description",
        loading: "lazy",
      },
    };

    const editor = rteRef.current?.editor;
    if (editor) {
      editor
        .chain()
        .focus()
        .setImage(newImage.attrs)
        .run();
    }

    noteHandlers.setImages((prevImages) => {
      const newImages = [
        ...prevImages,
        new PhotoType({
          uuid: uuidv4(),
          uri: imageUrl,
          type: "image",
        }),
      ];
      console.log("After updating images", newImages);
      return newImages;
    });
  };

  const [isAudioModalOpen, setIsAudioModalOpen] = React.useState(false);

  const fetchSuggestedTags = async () => {
    setLoadingTags(true);
    try {
      const editor = rteRef.current?.editor;
      if (editor) {
        const noteContent = editor.getHTML();
        console.log("Fetching suggested tags for content:", noteContent);

        const tags = await ApiService.generateTags(noteContent);
        console.log("Suggested tags received:", tags);
        setSuggestedTags(tags);
      } else {
        console.error("Editor instance is not available");
      }
    } catch (error) {
      console.error("Error generating tags:", error);
    } finally {
      setLoadingTags(false);
    }
  };

  const [isCommentSidebarOpen, setIsCommentSidebarOpen] = useState(false);

  return (
    <ScrollArea className="flex flex-col w-full h-[90vh] bg-cover bg-center flex-grow">
      <div
        key={noteState.counter}
        style={{
          backgroundImage: `url('/splash.png')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          height: "100%",
        }}
      >
        <div aria-label="Top Bar" className="w-full flex flex-col mx-4">
          <Input
            id="note-title-input"
            value={noteState.title}
            onChange={(e) => handleTitleChange(noteHandlers.setTitle, e)}
            placeholder="Title"
            className="p-4 font-bold text-2xl max-w-md bg-white mt-4"
            ref = {titleRef} />
          <div className="flex flex-col sm:flex-row bg-popup shadow-sm my-2 sm:my-4 rounded-md border border-border bg-white justify-center sm:justify-evenly mr-0 sm:mr-8 items-center gap-2 sm:gap-0 py-2 sm:py-0">
          <div className="w-full sm:w-auto flex-shrink-0">
            <PublishToggle
              id="publish-toggle-button"
              noteId={noteState.note?.id || ""}
              userId={userId || ""}
              instructorId={instructorId || undefined}
              isPublished={noteState.isPublished}
              isApprovalRequested={noteState.approvalRequested}
              isInstructorReview={isInstructorUser && userId !== (noteState.note as any)?.creator}
              onPublishClick={() =>
                publishHandler(noteState, noteHandlers)
              }
              onRequestApprovalClick={() =>
                approvalRequestHandler(noteState, noteHandlers)
              }
            />
          </div>


            <div className="w-1 h-9 bg-border" />
            <button id="save-note-button" className="hover:text-green-500 flex justify-center items-center w-full" onClick={onSave}>
              <SaveIcon className="text-current" />
              <div className="ml-2" ref={saveRef}>
                Save
              </div>
            </button>
            <div className="w-1  h-9 bg-border" />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="hover:text-red-500 flex justify-center items-center w-full">
                  <FileX2 className="text-current" />
                  <div className="ml-2" ref={deleteRef}>
                    Archive
                  </div>
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>This action cannot be undone. This will permanently archive this note.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDeleteNote(noteState.note, user, noteHandlers.setNote)}>
                    Continue
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <div className="w-1 h-7 bg-border" />
            <div className="flex-grow" ref={dateRef}>
              <TimePicker
                initialDate={noteState.time || new Date()}
                onTimeChange={(newDate) => handleTimeChange(noteHandlers.setTime, newDate)}
              />
            </div>
            <div className="w-2 h-9 bg-border" />
            <div className="bg-white p-2 rounded" ref={locationRef}>
              <LocationPicker
                long={noteState.longitude}
                lat={noteState.latitude}
                onLocationChange={(newLong, newLat) =>
                  handleLocationChange(noteHandlers.setLongitude, noteHandlers.setLatitude, newLong, newLat)
                }
              />
            </div>
            <div className="w-2 h-9 bg-border" />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button id="download-note-button" className="hover:text-blue-500 flex justify-center items-center w-full">
                  <SaveIcon className="text-current" />
                  <div className="ml-2">Download</div>
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent
                onChange={(isOpen) => {
                  if (!isOpen) {
                    // Close the popup and go back to the note
                  }
                }}
              >
                <AlertDialogHeader>
                  <AlertDialogTitle>Select File Type</AlertDialogTitle>
                  <AlertDialogDescription>Choose a file format for downloading your note.</AlertDialogDescription>
                </AlertDialogHeader>
                <div className="flex flex-col items-start px-6 mt-2 space-y-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="fileType"
                      value="pdf"
                      checked={selectedFileType === "pdf"}
                      onChange={() => setSelectedFileType("pdf")}
                    />
                    <span>PDF</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="fileType"
                      value="docx"
                      checked={selectedFileType === "docx"}
                      onChange={() => setSelectedFileType("docx")}
                    />
                    <span>DOCX</span>
                  </label>
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-gray-300 text-black hover:bg-gray-400 px-4 py-2 rounded">Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDownload} className="bg-blue-500 text-white hover:bg-blue-600 px-4 py-2 rounded">
                    Download
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          <TagManager
            inputTags={noteState.tags}
            suggestedTags={suggestedTags}
            onTagsChange={
              (newTags) => handleTagsChange(noteHandlers.setTags, newTags) // Ensure it uses the updated function
            }
            fetchSuggestedTags={fetchSuggestedTags}
          />

          {loadingTags && <p>Loading suggested tags...</p>}
        </div>
        <div className="flex-grow w-full p-2 sm:p-4 flex flex-col">
          <ResizablePanelGroup direction="horizontal" className="w-full bg-white rounded min-h-[60vh] md:min-h-[70vh] lg:min-h-[75vh]">
            <ResizablePanel
              defaultSize={canComment && isCommentSidebarOpen ? 70 : 100}
              minSize={45}
              maxSize={85}
              className="flex flex-col min-w-[420px] transition-[flex-basis] duration-200 ease-out"
            >
              <RichTextEditor
                ref={rteRef}
                className="flex-1 overflow-auto"
                editable={canEdit}
                extensions={extensions}
                content={noteState.editorContent}
                immediatelyRender={false}
                onUpdate={({ editor }) => {
                  if (!canEdit) return;
                  handleEditorChange(noteHandlers.setEditorContent, editor.getHTML());
                }}
                renderControls={() => (
                  <EditorMenuControls
                    onMediaUpload={(media) => {
                      if (!canEdit) return;
                      if (media.type === "image") {
                        const newImage = {
                          type: "image",
                          attrs: {
                            src: media.uri,
                            alt: "Image description",
                            loading: "lazy",
                          },
                        };
                        const editor = rteRef.current?.editor;
                        if (editor) {
                          editor.chain().focus().setImage(newImage.attrs).run();
                        }
                        noteHandlers.setImages((prevImages) => [
                          ...prevImages,
                          new PhotoType({
                            uuid: uuidv4(),
                            uri: media.uri,
                            type: "image",
                          }),
                        ]);
                      } else if (media.type === "video") {
                        const newVideo = new VideoType({
                          uuid: uuidv4(),
                          uri: media.uri,
                          type: "video",
                          thumbnail: "",
                          duration: "0:00",
                        });
                        noteHandlers.setVideos((prevVideos) => [...prevVideos, newVideo]);
                        const editor = rteRef.current?.editor;
                        if (editor) {
                          const videoLink = `Video ${noteState.videos.length + 1}`;
                          editor
                            .chain()
                            .focus()
                            .command(({ tr, dispatch }) => {
                              if (dispatch) {
                                const endPos = tr.doc.content.size;
                                const paragraphNodeForNewLine = editor.schema.node("paragraph");
                                const textNode = editor.schema.text(videoLink, [
                                  editor.schema.marks.link.create({ href: media.uri }),
                                ]);
                                const paragraphNodeForLink = editor.schema.node("paragraph", null, [
                                  textNode,
                                ]);
                                const transaction = tr
                                  .insert(endPos, paragraphNodeForNewLine)
                                  .insert(endPos + 1, paragraphNodeForLink);
                                dispatch(transaction);
                              }
                              return true;
                            })
                            .run();
                        }
                      } else if (media.type === "audio") {
                        const newAudio = new AudioType({
                          uuid: uuidv4(),
                          uri: media.uri,
                          type: "audio",
                          duration: "0:00",
                          name: `Audio Note ${noteState.audio.length + 1}`,
                          isPlaying: false,
                        });
                        noteHandlers.setAudio((prevAudio) => [...prevAudio, newAudio]);
                      }
                    }}
                  />
                )}
                children={(editor) => {
                  if (!editor) return null;
                  return <LinkBubbleMenu />;
                }}
              />
            </ResizablePanel>
            {!!noteState.note?.id && canComment && isCommentSidebarOpen && (
              <>
                <ResizableHandle withHandle className="bg-gray-200 hover:bg-gray-300 cursor-col-resize w-[6px]" />
                <ResizablePanel
                  defaultSize={30}
                  minSize={20}
                  maxSize={40}
                  className="md:border-l min-w-[280px] md:min-w-[300px] lg:min-w-[340px] transition-[flex-basis] duration-200 ease-out"
                >
                  <CommentSidebar
                    noteId={noteState.note.id as string}
                    getCurrentSelection={() => {
                      const editor = (rteRef.current as any)?.editor;
                      if (!editor) return null;
                      const { from, to } = editor.state.selection;
                      if (from === to) return null; // require a non-empty selection
                      return { from, to };
                    }}
                  />
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>
        </div>
      </div>
      {/* Sticky Comment Button - Moved to top right to avoid blocking Add Comment button */}
      {!!noteState.note?.id && canComment && (
        <button
          onClick={() => setIsCommentSidebarOpen(!isCommentSidebarOpen)}
          className="fixed top-20 right-4 z-50 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-3 shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
          aria-label={isCommentSidebarOpen ? "Close comments" : "Open comments"}
        >
          {isCommentSidebarOpen ? (
            <>
              <X className="w-4 h-4" />
              <span className="hidden sm:inline text-sm">Close</span>
            </>
          ) : (
            <>
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline text-sm">Comments</span>
            </>
          )}
        </button>
      )}
    </ScrollArea>
  );
}