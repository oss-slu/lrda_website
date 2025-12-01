"use client";

import React, { useEffect, useState } from "react";
import { Note } from "@/app/types";
import { User } from "../../models/user_class";
import ApiService from "../../utils/api_service";
import InstructorEnhancedNoteCard from "../../components/InstructorStoriesCard"; // NEW
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const InstructorDashboardPage = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [students, setStudents] = useState<{ uid: string; name: string }[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInstructorData = async () => {
      try {
        const userInstance = User.getInstance();
        const userId = await userInstance.getId();
        if (!userId) {
          throw new Error("Not logged in");
        }
        const userData = await ApiService.fetchUserData(userId);

        if (!userData || !userData.isInstructor) {
          throw new Error("Access denied. Instructor only.");
        }


        const studentIds = userData.students || [];
        if (studentIds.length === 0) {
          toast("No students linked to this instructor.");
          setIsLoading(false);
          return;
        }

        const notes = await ApiService.fetchNotesByStudents(studentIds);
        setNotes(notes);
        setFilteredNotes(notes);

        const studentNames = await Promise.all(
          studentIds.map(async (uid: string) => {
            const name = await ApiService.fetchCreatorName(uid);
            return { uid, name };
          })
        );

        setStudents(studentNames);
      } catch (error) {
        console.error("Error loading instructor dashboard:", error);
        toast.error("Failed to load dashboard.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInstructorData();
  }, []);

  const handleStudentChange = (uid: string) => {
    setSelectedStudent(uid);
    if (uid === "") {
      setFilteredNotes(notes);
    } else {
      const filtered = notes.filter((note) => note.creator === uid);
      setFilteredNotes(filtered);
    }
  };

  const handleSearch = (query: string) => {
    const lowerQuery = query.toLowerCase();
    if (!lowerQuery.trim()) {
      setFilteredNotes(notes);
      return;
    }
    const filtered = notes.filter((note) =>
      note.title.toLowerCase().includes(lowerQuery) ||
      note.text.toLowerCase().includes(lowerQuery) ||
      (note.tags && Array.isArray(note.tags) && note.tags.some((tag) =>
        (typeof tag === "string" ? tag : tag.label).toLowerCase().includes(lowerQuery)
      ))
    );
    setFilteredNotes(filtered);
  };

  return (
    <div className="flex flex-col w-screen h-[90vh] min-w-[600px] bg-gray-100 p-6">
      {/* Search + Filter Row */}
      <div className="flex flex-col sm:flex-row justify-center gap-4 mb-6">
        {/* Search Box */}
        <input
          type="text"
          placeholder="Search notes..."
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full max-w-md p-2 border rounded-lg shadow-sm"
        />

        {/* Student Filter Dropdown */}
        <select
          value={selectedStudent}
          onChange={(e) => handleStudentChange(e.target.value)}
          className="p-2 border rounded-lg shadow-sm"
        >
          <option value="">All Students</option>
          {students.map((student) => (
            <option key={student.uid} value={student.uid}>
              {student.name}
            </option>
          ))}
        </select>
      </div>

      {/* Notes Grid */}
      <div className="flex justify-center">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-screen-lg">
          {isLoading ? (
            [...Array(6)].map((_, idx) => (
              <Skeleton
                key={`skeleton-${idx}`}
                className="w-full h-[400px] rounded-sm border border-gray-300"
              />
            ))
          ) : filteredNotes.length > 0 ? (
            filteredNotes.map((note) => (
              <InstructorEnhancedNoteCard key={note.id || note.title} note={note} />
            ))
          ) : (
            <div className="col-span-full text-center text-gray-600">
              No approval requests found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstructorDashboardPage;
