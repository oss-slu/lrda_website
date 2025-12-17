"use client";

import React, { useState, useMemo } from "react";
import { Note } from "@/app/types";
import { useAuthStore } from "../../stores/authStore";
import { useShallow } from "zustand/react/shallow";
import { useQuery } from "@tanstack/react-query";
import ApiService from "../../utils/api_service";
import InstructorEnhancedNoteCard from "../../components/InstructorStoriesCard";
import { Skeleton } from "@/components/ui/skeleton";

const StudentDashboardPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");

  // Use auth store for user data
  const { user: authUser } = useAuthStore(
    useShallow((state) => ({
      user: state.user,
    }))
  );

  // Fetch notes with pending feedback
  const { data: notes = [], isLoading } = useQuery({
    queryKey: ["student-feedback", authUser?.uid],
    queryFn: async () => {
      if (!authUser?.uid) return [];

      // Fetch notes created by this student, still unpublished, with at least one comment
      const queryObj = {
        type: "message",
        published: false,
        creator: authUser.uid,
        approvalRequested: true,
        $or: [{ isArchived: { $exists: false } }, { isArchived: false }],
      };
      const fetched = await ApiService.getPagedQuery(150, 0, queryObj);
      return (fetched as Note[]).filter((note) => (note.comments || []).length > 0);
    },
    enabled: !!authUser?.uid,
  });

  // Filter notes by search query
  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return notes;

    const lower = searchQuery.toLowerCase();
    return notes.filter(
      (note) => note.title.toLowerCase().includes(lower) || (note.comments || []).some((c) => c.text.toLowerCase().includes(lower))
    );
  }, [notes, searchQuery]);

  return (
    <div className="flex flex-col w-screen h-[90vh] min-w-[600px] bg-gray-50 p-6">
      <h1 className="text-2xl font-bold mb-4">Feedback Pending Approval</h1>

      {/* Search Box */}
      <div className="mb-6 flex justify-center">
        <input
          type="text"
          placeholder="Search feedback..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-md p-2 border rounded-lg shadow-sm"
        />
      </div>

      <div className="flex justify-center">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-screen-lg">
          {isLoading ? (
            [...Array(6)].map((_, idx) => (
              <Skeleton key={`skeleton-${idx}`} className="w-full h-[400px] rounded-sm border border-gray-300" />
            ))
          ) : filteredNotes.length > 0 ? (
            filteredNotes.map((note) => {
              const noteId = (note as any).id || (note as any)._id || (note as any)["@id"] || note.title;
              const latestComments = (note.comments || []).slice(-2);

              return (
                <div key={noteId} className="flex flex-col bg-white rounded-lg shadow-sm">
                  {/* Note Card Preview */}
                  <InstructorEnhancedNoteCard note={note} />

                  {/* Inline Feedback Preview */}
                  <div className="p-4 border-t bg-gray-50">
                    <h4 className="text-sm font-semibold mb-2">Recent Feedback:</h4>
                    {latestComments.map((c) => (
                      <div key={c.id} className="text-xs text-gray-700 mb-1">
                        <span className="font-medium">{c.author}:</span> {c.text.length > 100 ? c.text.slice(0, 100) + "..." : c.text}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center text-gray-600">No feedback to review at the moment.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboardPage;
