"use client";

import React, { useEffect, useState } from "react";
import { Note, Comment } from "@/app/types";
import ApiService from "../utils/api_service";
import DOMPurify from "dompurify";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CalendarDays, Clock3, UserCircle, ImageIcon, MessageSquare } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { User } from "../models/user_class";

// Utility functions
const formatDate = (date: string | number | Date) =>
  new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const formatTime = (date: string | number | Date) => {
  const d = new Date(date);
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  const ampm = h < 12 ? "AM" : "PM";
  return `${h % 12 || 12}:${m} ${ampm}`;
};

const InstructorEnhancedNoteCard: React.FC<{ note: Note }> = ({ note }) => {
  const [creatorName, setCreatorName] = useState("Loading...");
  const [location, setLocation] = useState("Fetching...");
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<Comment[]>(note.comments || []);
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState<string>("");
  const [isStudent, setIsStudent] = useState(false);
  const [isInstructor, setIsInstructor] = useState(false);

  // Determine real ID and body text fields
  const noteId =(note as any).id || (note as any)._id || (note as any)["@id"] || "";
    const bodyHtml = (note as any).BodyText || note.text || "";

  // Debug logs
  useEffect(() => {
    console.log("🃏 [EnhancedNoteCard] noteId:", noteId);
    console.log("🃏 [EnhancedNoteCard] bodyHtml:", bodyHtml);
  }, [noteId, bodyHtml]);

  useEffect(() => {
    (async () => {
      const roles = await User.getInstance().getRoles();
      setIsStudent(!!roles?.contributor && !roles?.administrator);
      setIsInstructor(!!roles?.administrator);
      const name = await User.getInstance().getName();
      setUserName(name ?? "");   // coalesce null → empty string
    })();
  }, []);
  

  // Fetch creator name and location
  useEffect(() => {
    ApiService.fetchCreatorName(note.creator)
      .then(setCreatorName)
      .catch(() => setCreatorName("Unknown"));

    const MAPS_API_KEY = process.env.NEXT_PUBLIC_MAP_KEY;
    if (note.latitude && note.longitude && MAPS_API_KEY) {
      fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${note.latitude},${note.longitude}&key=${MAPS_API_KEY}`
      )
        .then((res) => res.json())
        .then((data) => {
          const loc = data.results?.[0]?.formatted_address;
          setLocation(loc || "Unknown Location");
        })
        .catch(() => setLocation("Unknown Location"));
    } else {
      setLocation(note.latitude && note.longitude ? "Unknown Location" : "");
    }
  }, [note.creator, note.latitude, note.longitude]);

  // Comment submission
  const handleSubmitComment = async () => {
    if (!commentText.trim()) return toast.error("Comment cannot be empty");

    setLoading(true);
    try {
      const userId = await User.getInstance().getId();
      
      const newComment: Comment = {
        id: uuidv4(),
        text: commentText.trim(),
        author: userName,
        authorId: userId || "",
        role: isStudent ? "student" : "instructor",
        createdAt: new Date().toISOString(),
        authorName: undefined,
        noteId: "",
        uid: ""
      };

      const updatedComments = [...comments, newComment];
      const updatedNote: Note = {
        ...note,
        id: noteId,
        comments: updatedComments,
      };

      const response = await ApiService.overwriteNote(updatedNote);
      if (!response.ok) throw new Error("Failed to save comment");

      setComments(updatedComments);
      setCommentText("");
      toast.success("Comment added!");
    } catch (err) {
      console.error("Comment submission failed:", err);
      toast.error("Failed to submit comment.");
    } finally {
      setLoading(false);
    }
  };

  // Approve (publish): shown to any non‐student when approvalRequested && not yet published
  const handleApprove = async () => {
    setLoading(true);
    try {
      await ApiService.overwriteNote({
        ...note,
        id: noteId,
        published: true,
        approvalRequested: false,
      });
      toast.success("Note approved and published!");
    } catch (err) {
      console.error("Approval failed:", err);
      toast.error("Failed to approve note.");
    } finally {
      setLoading(false);
    }
  };

  // HTML preview
  const previewText = (html: string) => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    return tempDiv.innerText.slice(0, 100) + "...";
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="cursor-pointer border rounded-lg shadow-md bg-white hover:shadow-lg transition max-w-sm">
          <div className="p-4">
            <div className="font-bold text-lg mb-2">{note.title}</div>
            <div className="text-sm text-gray-500 mb-2 flex items-center">
              <UserCircle size={16} className="mr-1" /> {creatorName}
            </div>
            <div className="text-sm text-gray-500 mb-2 flex items-center">
              <CalendarDays size={16} className="mr-1" />{" "}
              {formatDate(note.time)}
            </div>
            <div className="text-sm text-gray-500 mb-2 flex items-center">
              <Clock3 size={16} className="mr-1" /> {formatTime(note.time)}
            </div>
            {location && (
              <div className="text-sm text-gray-500 mb-2 flex items-center">
                <ImageIcon size={16} className="mr-1" /> {location}
              </div>
            )}

            {/* ← Here we render the actual HTML snippet, limited in height */}
            <div
              className="text-sm text-gray-700 overflow-hidden max-h-[80px]"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(bodyHtml) }}
            />
          </div>
        </div>
      </DialogTrigger>

      <DialogContent className="max-w-[90%] max-h-[90vh] overflow-y-auto">
        <DialogTitle className="text-2xl font-bold mb-4">{note.title}</DialogTitle>

        {/* show Approve to any non‑student when approvalRequested && not published */}
        {!isStudent && note.approvalRequested && !note.published && (
          <div className="flex justify-end mb-4">
            <Button onClick={handleApprove} disabled={loading}>
              {loading ? "Approving…" : "Approve"}
            </Button>
          </div>
        )}

        <ScrollArea className="border p-4 mb-4 max-h-[300px] bg-white">
        <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(bodyHtml) }} />
        </ScrollArea>

        <div className="border-t pt-4">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <MessageSquare size={20} /> Comments
          </h3>
          <div className="space-y-4 mb-4">
            {comments.length ? (
              comments.map((c) => (
                <div key={c.id} className="border p-2 rounded bg-gray-100">
                  <div className="font-semibold">{c.author}</div>
                  <div>{c.text}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(c.createdAt).toLocaleString()}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No comments yet.</p>
            )}
          </div>

          <div className="space-y-2">
            <Textarea
              placeholder="Leave feedback…"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              disabled={loading}
              rows={3}
            />
            <Button
              onClick={handleSubmitComment}
              disabled={loading || !commentText.trim()}
            >
              {loading ? "Submitting…" : "Submit Comment"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InstructorEnhancedNoteCard;
