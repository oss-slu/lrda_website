import React, { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Note, Tag } from "@/app/types";
import TimePicker from "./time_picker";
import {
  LinkBubbleMenu,
  RichTextEditor,
  type RichTextEditorRef,
} from "mui-tiptap";
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
import { FileX2, SaveIcon, Calendar, MapPin, Music } from "lucide-react";
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
  handlePublishChange,
} from "./note_handler";
import { PhotoType, VideoType, AudioType } from "../../models/media_class";
import { v4 as uuidv4 } from "uuid";
import { newNote } from "@/app/types";
import PublishToggle from "./publish_toggle";
import VideoComponent from "./videoComponent";
import { ScrollArea } from "@/components/ui/scroll-area";
import introJs from "intro.js"
import "intro.js/introjs.css"

const user = User.getInstance(); 

type NoteEditorProps = {
  note?: Note | newNote;
  isNewNote: boolean;
};

export default function NoteEditor({
  note: initialNote,
  isNewNote,
}: NoteEditorProps) {
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
  
      console.log('Observer triggered');
  
     // Check if all elements are present
      if (addNote && title && save && deleteButton && date && location) {
        const intro = introJs();
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
            const skipButton = document.querySelector('.introjs-skipbutton') as HTMLElement;
            if (skipButton) {
              skipButton.style.position = 'absolute';
              skipButton.style.top = '2px'; // Move it up by decreasing the top value
              skipButton.style.right = '20px'; // Adjust positioning as needed
              skipButton.style.fontSize = '18px'; // Adjust font size as needed
              skipButton.style.padding = '4px 10px'; // Adjust padding as needed
            }
          }, 100); // 100ms delay to wait for rendering
  
          observer.disconnect(); // Stop observing once the elements are found and the intro is set up
        }
      }
    });
  
    // Start observing the body for changes to detect when the elements appear
    observer.observe(document.body, { childList: true, subtree: true });
  
    // Cleanup the observer when the component unmounts
    return () => observer.disconnect();
  }, []);  // Empty dependency array ensures this effect runs only once
  
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
            const textNode = editor.schema.text(videoLink, [
              editor.schema.marks.link.create({ href: videoUri }),
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
  }, [noteState.videos]);

  useEffect(() => {
    if (initialNote) {
      noteHandlers.setNote(initialNote as Note);
      noteHandlers.setEditorContent(initialNote.text || "");
      noteHandlers.setTitle(initialNote.title || "");

      noteHandlers.setImages(
        (initialNote.media.filter(
          (item) => item.getType() === "image"
        ) as PhotoType[]) || []
      );
      noteHandlers.setTime(initialNote.time || new Date());
      noteHandlers.setLongitude(initialNote.longitude || "");
      noteHandlers.setLatitude(initialNote.latitude || "");

      noteHandlers.setTags(
        (initialNote.tags || []).map((tag) =>
          typeof tag === "string" ? { label: tag, origin: "user" } : tag
        )
      );

      noteHandlers.setAudio(initialNote.audio || []);
      noteHandlers.setIsPublished(initialNote.published || false);
      noteHandlers.setCounter((prevCounter) => prevCounter + 1);
      noteHandlers.setVideos(
        (initialNote.media.filter(
          (item) => item.getType() === "video"
        ) as VideoType[]) || []
      );
    }
  }, [initialNote]);

  console.log("initial Note", initialNote);

  useEffect(() => {
    if (initialNote) {
      noteHandlers.setNote(initialNote as Note);
    }
  }, [initialNote]);

  const onSave = async () => {
    const updatedNote: any = {
      ...noteState.note,
      text: noteState.editorContent,
      title: noteState.title,
      media: [...noteState.images, ...noteState.videos],
      published: noteState.isPublished,
      time: noteState.time,
      longitude: noteState.longitude,
      latitude: noteState.latitude,
      tags: noteState.tags,
      audio: noteState.audio,
      id: noteState.note?.id || "",
      creator: noteState.note?.creator || "",
    };
  
    try {
      if (isNewNote) {
        await ApiService.writeNewNote(updatedNote);
        toast("Note Created", {
          description: "Your new note has been successfully created.",
          duration: 2000,
        });
      } else {
        await ApiService.overwriteNote(updatedNote);
        toast("Note Saved", {
          description: "Your note has been successfully saved.",
          duration: 2000,
        });
      }
  
      // Trigger mini-refresh: Fetch updated notes and clear input fields
      const userId = await user.getId(); // Await the user ID
      if (userId) {
        const updatedNotes = await ApiService.fetchUserMessages(userId); // Fetch updated notes
        noteHandlers.setNote(undefined); // Clear current note state
        noteHandlers.setEditorContent(""); // Clear text editor
        noteHandlers.setTitle(""); // Clear title field
        noteHandlers.setTags([]); // Clear tags
        noteHandlers.setImages([]); // Clear images
        noteHandlers.setVideos([]); // Clear videos
        noteHandlers.setAudio([]); // Clear audio
        noteHandlers.setTime(new Date()); // Reset time
        noteHandlers.setLatitude("");
        noteHandlers.setLongitude("");
        setNotes(updatedNotes); // Update the note list
  
        noteHandlers.setCounter((prevCounter) => prevCounter + 1); // Force re-render
      } else {
        throw new Error("User ID is null or undefined.");
      }
    } catch (error) {
      console.error("Error saving note:", error);
      toast("Error", {
        description: "Failed to save note. Try again later.",
        duration: 4000,
      });
    }
  };
  
  
  const handleDownload = async () => {
    if (!selectedFileType) {
      alert("Please select a file type.");
      return;
    }
  
    // Extract plain text from HTML content
    const plainTextContent = new DOMParser()
      .parseFromString(noteState.editorContent, "text/html")
      .body.innerText;
  
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
          <div className="flex flex-row bg-popup shadow-sm my-4 rounded-md border border-border bg-white justify-evenly mr-8 items-center">
          <PublishToggle
              id="publish-toggle-button"
              isPublished={Boolean(noteState.isPublished)}
              onPublishClick={() => handlePublishChange(noteHandlers.setIsPublished, !noteState.isPublished)}
            />

            <div className="w-1 h-9 bg-border" />
            <button
              id="save-note-button"
              className="hover:text-green-500 flex justify-center items-center w-full"
              onClick={onSave}
            >
              <SaveIcon className="text-current"/>
              <div className="ml-2"  ref = {saveRef}>Save</div>
            </button>
            <div className="w-1  h-9 bg-border" />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="hover:text-red-500 flex justify-center items-center w-full">
                  <FileX2 className="text-current"/>
                  <div className="ml-2" ref = {deleteRef}>Archive</div>
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently archive
                    this note.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() =>
                      handleDeleteNote(
                        noteState.note,
                        user,
                        noteHandlers.setNote
                      )
                    }
                  >
                    Continue
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <div className="w-1 h-7 bg-border" />
            <div className="flex-grow"
            ref = {dateRef} >
              <TimePicker
                initialDate={noteState.time || new Date()}
                onTimeChange={(newDate) =>
                  handleTimeChange(noteHandlers.setTime, newDate)
                }
              />
            </div>
            <div className="w-2 h-9 bg-border" />
            <div className="bg-white p-2 rounded"
            ref = {locationRef} >
              <LocationPicker
                long={noteState.longitude}
                lat={noteState.latitude}
                onLocationChange={(newLong, newLat) =>
                  handleLocationChange(
                    noteHandlers.setLongitude,
                    noteHandlers.setLatitude,
                    newLong,
                    newLat
                  )
                }
              />
            </div>
            <div className="w-2 h-9 bg-border" />
            {/* <AlertDialog>
  <AlertDialogTrigger asChild>
    <button
      id="download-note-button"
      className="hover:text-blue-500 flex justify-center items-center w-full"
    >
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
      <AlertDialogDescription>
        Choose a file format for downloading your note.
      </AlertDialogDescription>
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
      <AlertDialogCancel
        className="bg-gray-300 text-black hover:bg-gray-400 px-4 py-2 rounded"
      >
        Cancel
      </AlertDialogCancel>
      <AlertDialogAction
        onClick={handleDownload}
        className="bg-blue-500 text-white hover:bg-blue-600 px-4 py-2 rounded"
      >
        Download
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog> */}

          </div>
          <TagManager
  inputTags={noteState.tags}
  suggestedTags={suggestedTags}
  onTagsChange={(newTags) =>
    handleTagsChange(noteHandlers.setTags, newTags) // Ensure it uses the updated function
  }
  fetchSuggestedTags={fetchSuggestedTags}
/>

          {loadingTags && <p>Loading suggested tags...</p>}
        </div>
        <div className="flex-grow w-full p-4 flex flex-col">
          <div className=" flex-grow flex flex-col bg-white w-full rounded">
          <RichTextEditor
              ref={rteRef}
              className="min-h-[712px]"
              extensions={extensions}
              content={noteState.editorContent}
              onUpdate={({ editor }) =>
                handleEditorChange(noteHandlers.setEditorContent, editor.getHTML())
              }
              renderControls={() => (
                <EditorMenuControls
                  onMediaUpload={(media) => {
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
                        type: "audio", // Explicitly set the type
                        duration: "0:00", // Default duration
                        name: `Audio Note ${noteState.audio.length + 1}`,
                        isPlaying: false, // Default play status
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
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
