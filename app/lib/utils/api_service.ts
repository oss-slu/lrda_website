import { Note, Comment } from "@/app/types";
import { UserData } from "../../types";
import type { NextApiRequest, NextApiResponse } from "next";
import { doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc } from "firebase/firestore";
import { db } from "../config/firebase";

const RERUM_PREFIX = process.env.NEXT_PUBLIC_RERUM_PREFIX;
const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
const OPENAI_API_URL = process.env.NEXT_PUBLIC_OPENAI_API_URL;

if (!RERUM_PREFIX) {
  throw new Error("RERUM_PREFIX is not defined in the environment variables.");
}

if (!OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is not defined in the environment variables.");
}

if (!OPENAI_API_URL) {
  throw new Error("OPENAI_API_URL is not defined in the environment variables.");
}

interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    text: string;
    index: number;
    logprobs: any;
    finish_reason: string;
  }[];
}

/**
 * Provides methods for interacting with the API to fetch, create, update, and delete notes.
 */
export default class ApiService {
  /**
   * Generates one-word tags for ethnographic notes.
   * @param {string} noteContent - The content of the ethnographic note.
   * @returns {Promise<string[]>} A promise that resolves to an array of tags.
   * @throws Will throw an error if the tags could not be generated.
   */
  static async generateTags(noteContent: string): Promise<string[]> {
    const messages = [
      {
        role: "system",
        content: "You are a professional ethnographer suggesting the best, most specific and descriptive web ontology tags for notes.",
      },
      {
        role: "user",
        content: `Suggest 20 one-word tags for the following notes:\n${noteContent}\nTags as an ethnographer. Keep the responses to one-word tags as a comma-separated list. Use specific web ontology such as Library of Congress Subject Headings, Classification, AFS Ethnographic Thesaurus, Subject Schemas, Classification Schemes, and include the city where this note exists in the tags.`,
      },
    ];

    try {
      const response = await fetch(OPENAI_API_URL!, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: messages,
          max_tokens: 1000,
          n: 1,
        }),
      });

      const data = await response.json();
      console.log("Response from OpenAI:", data);

      const tags = data.choices[0].message.content
        .trim()
        .split(",")
        .map((tag: string) => tag.trim());
      return tags;
    } catch (error) {
      console.error("Error generating tags:", error);
      throw new Error("Failed to generate tags");
    }
  }

  /**
   * Fetches messages from the API, with optional pagination.
   * @param {boolean} global - Indicates whether to fetch global messages or user-specific messages.
   * @param {boolean} published - Indicates whether to fetch only published messages.
   * @param {string} userId - The ID of the user for user-specific messages.
   * @param {number} [limit=150] - The limit of messages per page. Defaults to 150.
   * @param {number} [skip=0] - The iterator to skip messages for pagination.
   * @param {Array} [allResults=[]] - The accumulated results for pagination.
   * @returns {Promise<any[]>} The array of messages fetched from the API.
   */
  static async fetchMessages(
    global: boolean,
    published: boolean,
    userId: string,
    limit = 150,
    skip = 0,
    allResults: any[] = []
  ): Promise<any[]> {
    try {
      const url = `${RERUM_PREFIX}query?limit=${limit}&skip=${skip}`;

      const headers = {
        "Content-Type": "application/json",
      };

      let body: { type: string; published?: boolean; creator?: string } = {
        type: "message",
      };

      if (global) {
        body = { type: "message" };
      } else if (published) {
        body = { type: "message", published: true, creator: userId };
      } else {
        body = { type: "message", creator: userId };
      }

      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.length > 0) {
        allResults = allResults.concat(data);
        return this.fetchMessages(global, published, userId, limit, skip + data.length, allResults);
      }

      return allResults;
    } catch (error) {
      console.error("Error fetching messages:", error);
      throw error;
    }
  }

  /**
   * Implements a paged query to fetch messages in chunks.
   * @param {number} lim - The limit of messages per page.
   * @param {number} it - The iterator to skip messages for pagination.
   * @param {Object} queryObj - The query object.
   * @param {Array} allResults - The accumulated results.
   * @returns {Promise<any[]>} The array of all messages fetched.
   */
  static async getPagedQuery(lim: number, it = 0, queryObj: object, allResults: any[] = []): Promise<any[]> {
    try {
      const response = await fetch(`${RERUM_PREFIX}query?limit=${lim}&skip=${it}`, {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
        body: JSON.stringify(queryObj),
      });
      const results = await response.json();
      if (results.length) {
        allResults = allResults.concat(results);
        return this.getPagedQuery(lim, it + results.length, queryObj, allResults);
      }
      return allResults;
    } catch (err) {
      console.warn("Could not process a result in paged query", err);
      throw err;
    }
  }

  // Convenience wrapper used by Stories page to fetch by creator
  static async getPagedQueryWithParams(limit: number, skip: number, creatorId: string): Promise<any[]> {
    const queryObj = { type: "message", creator: creatorId } as any;
    return await this.getPagedQuery(limit, skip, queryObj);
  }

  static async fetchNotesByDate(limit: number, afterDate?: string, isGlobal = true, userId?: string): Promise<Note[]> {
    const queryObj: any = {
      type: "message",
    };
    if (afterDate) {
      queryObj.time = { $gt: afterDate };
    }
    if (!isGlobal && userId) {
      queryObj.creator = userId;
    }
    const url = `${RERUM_PREFIX}query?limit=${limit}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(queryObj),
    });
    console.log("Fetch Notes by Date Response:", response);
    return await response.json();
  }

  // Fetch notes by a list of student user IDs
  // When used for instructor review, can filter by approvalRequested
  /**
   * Fetches notes created by a list of students, excluding archived notes.
   * @param {string[]} studentUids - An array of student UIDs whose notes need to be fetched.
   * @returns {Promise<any[]>} A promise that resolves to an array of notes created by the specified students.
   */
  static async fetchNotesByStudents(studentUids: string[]): Promise<any[]> {
    try {
      const queryObj = {
        type: "message",
        published: false,
        approvalRequested: true,
        creator: {
          $in: studentUids,
        },
        $or: [
          { isArchived: { $exists: false } },
          { isArchived: false },
        ],
      };

      console.log("🔍 Rerum Query - fetchNotesByStudents:", JSON.stringify(queryObj));

      const notes = await this.getPagedQuery(150, 0, queryObj);

      console.log(`📥 Response (${notes.length} notes) for fetchNotesByStudents:`);
      notes.forEach((note, idx) => {
        console.log(`  Note ${idx + 1}:`, {
          "@id": note.id,
          title: note.title,
          BodyText: note.text,
          type: "message",
          creator: note.creator,
          media: note.media,
          latitude: note.latitude,
          longitude: note.longitude,
          audio: note.audio,
          published: note.published,
          approvalRequested: note.approvalRequested,
          tags: note.tags,
          time: note.time,
          isArchived: note.isArchived,
          comments: note.comments || [], // Ensure comments are included
        });
      });

      return notes;
    } catch (error) {
      console.error("❌ Error in fetchNotesByStudents:", error);
      throw new Error("Failed to fetch notes by students.");
    }
  }

  // Fetch users (students) by instructor ID from Firestore
  static async fetchUsersByInstructor(instructorId: string): Promise<{ uid: string; name: string; email: string }[]> {
    try {
      const usersRef = collection(db, "users");
      const q = query(
        usersRef,
        where("parentInstructorId", "==", instructorId),
        where("isInstructor", "==", false)
      );
      const snap = await getDocs(q);
      const users: { uid: string; name: string; email: string }[] = [];

      snap.forEach((doc) => {
        const userData = doc.data();
        if (userData?.uid && userData?.name && userData?.email) {
          users.push({ uid: userData.uid, name: userData.name, email: userData.email });
        } else {
          console.warn(`User document with ID ${doc.id} is missing required fields.`);
        }
      });

      console.log(`Fetched students under instructor ${instructorId}:`, users);
      if (users.length === 0) {
        console.warn(`No students found for instructor with ID: ${instructorId}`);
      }
      return users;
    } catch (error: any) {
      console.error(`Error fetching students for instructor with ID ${instructorId}:`, error);
      const message = typeof error?.message === "string" ? error.message : "";

      // Fallback: use API user profile to get students list (avoids Firestore permission issues)
      if (message.includes("Missing or insufficient permissions") || message.includes("permission")) {
        console.warn("Falling back to API-based students list due to Firestore permissions.");
        const instructorProfile = await ApiService.fetchUserData(instructorId);
        const studentUids: string[] = instructorProfile?.students || [];

        if (!studentUids.length) {
          return [];
        }

        const resolved = await Promise.all(
          studentUids.map(async (uid) => {
            const name = await ApiService.fetchCreatorName(uid).catch(() => "Unknown User");
            return { uid, name, email: "" };
          })
        );
        return resolved;
      }

      throw new Error(`Unable to fetch students for instructor with ID: ${instructorId}`);
    }
  }

  /**
   * Fetches all messages for a specific user.
   */
  static async fetchUserMessages(userId: string, limit: number = 150, skip: number = 0): Promise<any[]> {
    const queryObj = { type: "message", creator: userId };
    return await this.getPagedQuery(limit, skip, queryObj);
  }

  /**
   * Fetches all Published Notes.
   */
  static async fetchPublishedNotes(limit: number = 150, skip: number = 0): Promise<any[]> {
    const queryObj = { type: "message", published: true };
    return await this.getPagedQuery(limit, skip, queryObj);
  }

  /**
   * Fetches published notes within map bounds.
   */
  static async fetchPublishedNotesByBounds(
    limit: number = 150,
    skip: number = 0,
    neLat: number,
    neLng: number,
    swLat: number,
    swLng: number
  ): Promise<any[]> {
    const queryObj = {
      type: "message",
      published: true,
      "latitude[gte]": swLat,
      "latitude[lte]": neLat,
      "longitude[gte]": swLng,
      "longitude[lte]": neLng,
    } as any;
    return await this.getPagedQuery(limit, skip, queryObj);
  }
  /**
   * Fetches user data from the API based on UID.
   * @param {string} uid - The UID of the user.
   * @returns {Promise<UserData | null>} The user data.
   */
  static async fetchUserData(uid: string): Promise<UserData | null> {
    try {
      const userDocRef = doc(db, "users", uid); // Assume users collection
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const firestoreData = userDoc.data();
        // Removed sensitive data logging for security
        
        // Ensure the data has the required structure
        const userData: UserData = {
          uid: firestoreData.uid || uid,
          name: firestoreData.name || '',
          roles: firestoreData.roles || { administrator: false, contributor: false },
          isInstructor: firestoreData.isInstructor || false,
          students: firestoreData.students || [],
          parentInstructorId: firestoreData.parentInstructorId
        };
        
        // Removed sensitive data logging for security
        return userData;
      } else {
        console.log("No user data found in Firestore, using API fallback.");
      }

      const url = RERUM_PREFIX + "query";
      const headers = {
        "Content-Type": "application/json",
      };
      const body = {
        $or: [
          { "@type": "Agent", uid: uid },
          { "@type": "foaf:Agent", uid: uid },
        ],
      };

      // Removed UID logging for security

      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      const data = await response.json();
      // Removed sensitive data logging for security
      return data.length ? data[0] : null;
    } catch (error) {
      console.error("Error fetching user data:", error);
      return null;
    }
  }

  /**
   * Creates user data in the API.
   * @param {UserData} userData - The user data to be created.
   * @returns {Promise<Response>} The response from the API.
   */
  static async createUserData(userData: UserData) {
    try {
      const response = await fetch(RERUM_PREFIX + "create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          "@type": "Agent",
          ...userData,
        }),
      });
      return response;
    } catch (error) {
      console.error("Error creating user data:", error);
      throw error;
    }
  }

  /**
   * Deletes a note from the API.
   * @param {string} id - The ID of the note to delete.
   * @param {string} userId - The ID of the user who owns the note.
   * @returns {Promise<boolean>} A boolean indicating whether the deletion was successful.
   */
  static async deleteNoteFromAPI(id: string, userId: string): Promise<boolean> {
    try {
      const url = RERUM_PREFIX + "delete";

      // Retrieve the token from local storage
      const token = localStorage.getItem("authToken");

      // Include the token in the headers
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      const body = {
        type: "message",
        creator: userId,
        "@id": id,
      };

      // Log the details before making the request
      console.log("Request URL:", url);
      console.log("Request Headers:", headers);
      console.log("Request Body:", JSON.stringify(body));

      const response = await fetch(url, {
        method: "DELETE",
        headers,
        body: JSON.stringify(body),
      });

      if (response.status === 204) {
        return true;
      } else {
        throw response;
      }
    } catch (error) {
      console.error("Error deleting note:", error);
      return false;
    }
  }

  /**
   * Writes a new note to the API.
   * @param {Note} note - The note object to be written.
   * @returns {Promise<Response>} The response from the API.
   */
  static async writeNewNote(note: Note) {
    return fetch(RERUM_PREFIX + "create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "message",
        title: note.title,
        media: note.media,
        BodyText: note.text,
        creator: note.creator,
        latitude: note.latitude || "",
        longitude: note.longitude || "",
        audio: note.audio,
        published: note.published,
        tags: note.tags,
        time: note.time || new Date(),
      }),
    });
  }

  /**
   * Overwrites an existing note in the API.
   * @param {Note} note - The note object to be updated.
   * @returns {Promise<Response>} The response from the API.
   */
  static async overwriteNote(note: Note) {
    return await fetch(RERUM_PREFIX + "overwrite", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        "@id": note.id,
        title: note.title,
        BodyText: note.text,
        type: "message",
        creator: note.creator,
        media: note.media,
        latitude: note.latitude,
        longitude: note.longitude,
        audio: note.audio,
        published: note.published,
        tags: note.tags,
        time: note.time,
        isArchived: note.isArchived,
      }),
    });
  }

  /**
   * Searches messages by query.
   * @param {string} query - The search query.
   * @returns {Promise<any[]>} The array of messages matching the query.
   */
  static async searchMessages(query: string): Promise<any[]> {
    try {
      const url = RERUM_PREFIX + "query";
      const headers = {
        "Content-Type": "application/json",
      };

      // Request body for retrieving messages of type "message"
      const body = {
        type: "message",
      };

      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      let data = await response.json();

      // Convert the query to lowercase for case-insensitive matching
      const lowerCaseQuery = query.toLowerCase();

      // Filter the messages by title or tags containing the query string
      data = data.filter((message: any) => {
        // Check if title contains the query string
        if (message.title && message.title.toLowerCase().includes(lowerCaseQuery)) {
          return true;
        }

        // Check if any tags contain the query string
        if (message.tags && message.tags.some((tag: string) => tag.toLowerCase().includes(lowerCaseQuery))) {
          return true;
        }

        return false;
      });

      return data;
    } catch (error) {
      console.error("Error searching messages:", error);
      throw error;
    }
  }

  // Comments API – RERUM-backed
  static async fetchCommentsForNote(noteId: string): Promise<Comment[]> {
    try {
      const queryObj = {
        type: "comment",
        noteId: noteId,
      };

      const response = await fetch(`${RERUM_PREFIX}query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(queryObj),
      });

      const data = await response.json();
      return data
        .filter((item: any) => !item.archived)
        .map((item: any) => ({
          id: item["@id"],
          noteId: item.noteId,
          text: item.text,
          authorId: item.authorId,
          authorName: item.authorName,
          createdAt: new Date(item.createdAt).toISOString(),
          position: item.position ? { from: item.position.from, to: item.position.to } : null,
          threadId: item.threadId || null,
          parentId: item.parentId || null,
          resolved: !!item.resolved,
          archived: !!item.archived,
        }));
    } catch (error) {
      console.error("Error fetching comments:", error);
      return [];
    }
  }

  static async createComment(comment: Comment) {
    try {
      // Extract authorName as string if it's a ReactNode
      const authorNameStr = typeof comment.authorName === 'string' 
        ? comment.authorName 
        : (comment.authorName as any)?.toString() || comment.author || '';
      
      const response = await fetch(`${RERUM_PREFIX}create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "comment",   // Special Rerum type
          noteId: comment.noteId, // Associate comment with a Note
          text: comment.text,
          authorId: comment.authorId,
          authorName: authorNameStr,
          createdAt: comment.createdAt,
          position: comment.position || null,
          threadId: comment.threadId || null,
          parentId: comment.parentId || null,
          resolved: !!comment.resolved,
          archived: !!comment.archived,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create comment.");
      }

      return await response.json(); // Return the Rerum object metadata
    } catch (error) {
      console.error("Error creating comment:", error);
      throw error;
    }
  }

  static async resolveThread(threadId: string) {
    try {
      // First, fetch all comments in this thread
      const queryObj = {
        type: "comment",
        threadId: threadId,
      };

      const queryResponse = await fetch(`${RERUM_PREFIX}query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(queryObj),
      });

      const comments = await queryResponse.json();
      
      if (!comments || comments.length === 0) {
        throw new Error("No comments found for this thread");
      }

      // Update each comment in the thread to mark it as resolved
      const updatePromises = comments.map((comment: any) => {
        return fetch(`${RERUM_PREFIX}overwrite`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...comment,
            resolved: true,
            resolvedAt: new Date().toISOString(),
          }),
        });
      });

      const responses = await Promise.all(updatePromises);
      const failed = responses.filter(r => !r.ok);
      
      if (failed.length > 0) {
        throw new Error(`Failed to resolve ${failed.length} comment(s) in thread`);
      }

      return { success: true, updatedCount: comments.length };
    } catch (error) {
      console.error("Error resolving thread:", error);
      throw error;
    }
  }

  static async archiveComment(commentId: string) {
    try {
      const response = await fetch(`${RERUM_PREFIX}overwrite`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "comment",
          "@id": commentId,
          archived: true,
          archivedAt: new Date().toISOString(),
        }),
      });
      if (!response.ok) throw new Error("Failed to archive comment");
      return true;
    } catch (error) {
      console.error("Error archiving comment:", error);
      throw error;
    }
  }

  // Request approval for a note from an instructor
  static async requestApproval(noteData: any): Promise<void> {
    try {
      const { instructorId, ...noteDetails } = noteData;

      const instructorRef = doc(db, "users", instructorId);
      const approvalsRef = collection(instructorRef, "approvalRequests");

      await addDoc(approvalsRef, {
        ...noteDetails,
        status: "pending",
        submittedAt: new Date(),
      });

      console.log(`Approval request sent to instructor: ${instructorId}`);
    } catch (error) {
      console.error("Error requesting approval:", error);
      throw new Error("Failed to request approval.");
    }
  }


  /**
   * Fetches the name of the creator by first checking Firestore, then falling back to RERUM API.
   * Checks multiple fields (name, displayName, email) and handles various ID formats.
   * @param {string} creatorId - The UID of the creator (can be a direct UID or a RERUM URL).
   * @returns {Promise<string>} The name of the creator.
   */
  static async fetchCreatorName(creatorId: string): Promise<string> {
    try {
      // Normalize creatorId - extract UID from RERUM URLs if needed
      let normalizedId = creatorId;
      if (creatorId && (creatorId.startsWith("https://devstore.rerum.io/") || creatorId.startsWith("http://devstore.rerum.io/"))) {
        // Extract the UID from the URL (assuming format like https://devstore.rerum.io/v1/id/{uid})
        const parts = creatorId.split("/");
        normalizedId = parts[parts.length - 1];
      }

      // First, try to fetch from Firestore
      try {
        const userDocRef = doc(db, "users", normalizedId);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const firestoreData = userDoc.data();
          // Check multiple name fields in order of preference
          if (firestoreData.name && firestoreData.name.trim()) {
            return firestoreData.name.trim();
          }
          if (firestoreData.displayName && firestoreData.displayName.trim()) {
            return firestoreData.displayName.trim();
          }
          if (firestoreData.email && firestoreData.email.trim()) {
            // Use email as last resort fallback
            return firestoreData.email.trim();
          }
        }
      } catch (firestoreError) {
        // If Firestore lookup fails, continue to RERUM fallback
        console.log("Firestore lookup failed, falling back to RERUM:", firestoreError);
      }

      // Fallback to RERUM API query - try both normalized ID and original creatorId
      const url = RERUM_PREFIX + "query";
      const headers = {
        "Content-Type": "application/json",
      };
      
      // Try with normalized ID first
      let body = {
        $or: [
          { "@type": "Agent", uid: normalizedId },
          { "@type": "foaf:Agent", uid: normalizedId },
        ],
      };

      let response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      let data = await response.json();
      
      // If no result with normalized ID and it's different from original, try original
      if ((!data.length || !data[0].name) && normalizedId !== creatorId) {
        body = {
          $or: [
            { "@type": "Agent", uid: creatorId },
            { "@type": "foaf:Agent", uid: creatorId },
            // Also try matching by @id field for RERUM URLs
            { "@id": creatorId } as any,
          ],
        };
        
        response = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify(body),
        });
        
        data = await response.json();
      }

      if (data.length && data[0]) {
        const result = data[0];
        // Check multiple name fields in RERUM response
        if (result.name && result.name.trim()) {
          return result.name.trim();
        }
        if (result.displayName && result.displayName.trim()) {
          return result.displayName.trim();
        }
        if (result.email && result.email.trim()) {
          return result.email.trim();
        }
      }
      
      throw new Error("Creator not found or no name attribute.");
    } catch (error) {
      console.error(`Error fetching creator name for ${creatorId}:`, error);
      throw error;
    }
  }

  static async handler(req: NextApiRequest, res: NextApiResponse) {
    console.log("Received request:", req.method, req.body);

    if (req.method !== "POST") {
      return res.status(405).json({ message: "Method not allowed" });
    }

    const { notes } = req.body;

    if (!notes || !Array.isArray(notes)) {
      return res.status(400).json({ message: "Invalid request body" });
    }

    const noteContents = notes.map((note) => note.content).join("\n");
    console.log("Note contents for tag generation:", noteContents);

    try {
      const tags = await ApiService.generateTags(noteContents);
      res.status(200).json({ tags });
    } catch (error) {
      console.error("Error generating tags:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
}

export function getVideoThumbnail(file: File, seekTo = 0.0) {
  console.log("getting video cover for file: ", file);
  return new Promise((resolve, reject) => {
    const videoPlayer = document.createElement("video");
    videoPlayer.setAttribute("src", URL.createObjectURL(file));
    videoPlayer.load();
    videoPlayer.addEventListener("error", (ex) => {
      reject(new Error(`Error when loading video file: ${ex.message || ex.toString()}`));
    });
    videoPlayer.addEventListener("loadedmetadata", () => {
      if (videoPlayer.duration < seekTo) {
        reject(new Error("Video is too short."));
        return;
      }
      setTimeout(() => {
        videoPlayer.currentTime = seekTo;
      }, 200);
      videoPlayer.addEventListener("seeked", () => {
        console.log("video is now paused at %ss.", seekTo);
        const canvas = document.createElement("canvas");
        canvas.width = videoPlayer.videoWidth;
        canvas.height = videoPlayer.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(videoPlayer, 0, 0, canvas.width, canvas.height);
          ctx.canvas.toBlob(
            (blob) => {
              resolve(blob);
            },
            "image/jpeg",
            0.75 // quality
          );
        }
      });
    });
  });
}

function formatDuration(duration: number) {
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  const seconds = Math.floor(duration % 60);

  const parts = [];
  if (hours > 0) parts.push(hours);
  parts.push(minutes < 10 && hours > 0 ? `0${minutes}` : minutes);
  parts.push(seconds < 10 ? `0${seconds}` : seconds);

  return parts.join(":");
}

export function getVideoDuration(file: File) {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";

    video.onloadedmetadata = function () {
      window.URL.revokeObjectURL(video.src);
      const durationInSeconds = video.duration;
      const formattedDuration = formatDuration(durationInSeconds);
      resolve(formattedDuration);
    };

    video.onerror = function () {
      reject("Failed to load video metadata");
    };

    video.src = URL.createObjectURL(file);
  });
}

export function uploadMedia(uploadMedia: any) {
  throw new Error("Function not implemented.");
}
