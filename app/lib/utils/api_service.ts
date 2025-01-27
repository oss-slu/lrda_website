import { Note } from "@/app/types";
import { UserData } from "../../types";
import type { NextApiRequest, NextApiResponse } from 'next';
import { addDoc, collection, doc, getDoc, getFirestore } from "firebase/firestore";
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
      { role: "system", content: "You are a professional ethnographer suggesting the best, most specific and descriptive web ontology tags for notes." },
      { role: "user", content: `Suggest 20 one-word tags for the following notes:\n${noteContent}\nTags as an ethnographer. Keep the responses to one-word tags as a comma-separated list. Use specific web ontology such as Library of Congress Subject Headings, Classification, AFS Ethnographic Thesaurus, Subject Schemas, Classification Schemes, and include the city where this note exists in the tags.` }
    ];

    try {
      const response = await fetch(OPENAI_API_URL!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: messages,
          max_tokens: 1000,
          n: 1,
        }),
      });

      const data = await response.json();
      console.log('Response from OpenAI:', data);

      const tags = data.choices[0].message.content.trim().split(',').map((tag: string) => tag.trim());
      return tags;
    } catch (error) {
      console.error('Error generating tags:', error);
      throw new Error('Failed to generate tags');
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

// New method to request approval
static async requestApproval(noteData: any): Promise<void> {
  try {
    const { instructorId, ...noteDetails } = noteData;

    // Save the approval request in the instructor's Firestore document
    const instructorRef = doc(db, "users", instructorId);
    const approvalsRef = collection(instructorRef, "approvalRequests");

    await addDoc(approvalsRef, {
      ...noteDetails,
      status: "pending", // Track approval status
      submittedAt: new Date(),
    });

    console.log(`Approval request sent to instructor: ${instructorId}`);
  } catch (error) {
    console.error("Error requesting approval:", error);
    throw new Error("Failed to request approval.");
  }
}


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
      creator: {
        $in: studentUids, // Filter notes by the provided list of student UIDs
      },
      $or: [
        { isArchived: { $exists: false } }, // Include notes where isArchived does not exist
        { isArchived: false }, // Include notes where isArchived is explicitly false
      ],
    };

    // Fetch notes from the API using the getPagedQuery method
    const notes = await this.getPagedQuery(150, 0, queryObj);

    console.log(`Fetched ${notes.length} notes for students:`, studentUids);
    return notes;
  } catch (error) {
    console.error("Error fetching notes by students:", error);
    throw new Error("Failed to fetch notes by students.");
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
        "Content-Type": "application/json; charset=utf-8"
      },
      body: JSON.stringify(queryObj)
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

/**
 * Implements a paged query to fetch messages based on type and creator in chunks.
 * @param {number} lim - The limit of messages per page.
 * @param {number} it - The iterator to skip messages for pagination.
 * @param {string} creatorId - The UID of the creator to filter messages.
 * @param {Array} allResults - The accumulated results.
 * @returns {Promise<any[]>} The array of all messages fetched.
 */
static async getPagedQueryWithParams(
  lim: number,
  it = 0,
  creatorId: string,
  allResults: any[] = []
): Promise<any[]> {
  try {
    const queryObj = {
      type: "message",
      creator: creatorId,
    };

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
      return this.getPagedQueryWithParams(lim, it + results.length, creatorId, allResults);
    }
    return allResults;
  } catch (err) {
    console.warn("Could not process a result in paged query with params", err);
    throw err;
  }
}


/**
 * Fetches all messages for a specific user.
 * @param {string} userId - The ID of the user whose messages are to be fetched.
 * @param {number} limit - The limit of messages per page.
 * @param {number} skip - The number of messages to skip for pagination.
 * @returns {Promise<any[]>} - The array of messages fetched from the API.
 */
static async fetchUserMessages(userId: string, limit: number = 150, skip: number = 0): Promise<any[]> {
  const queryObj = {
    type: "message",
    creator: userId,
  };
  return await this.getPagedQuery(limit, skip, queryObj);
}

/**
 * Fetches all Published Notes.
 * @param {number} limit - The limit of messages per page.
 * @param {number} skip - The number of messages to skip for pagination.
 * @returns {Promise<any[]>} - The array of messages fetched from the API.
 */
static async fetchPublishedNotes(limit: number = 150, skip: number = 0): Promise<any[]> {
  const queryObj = {
    type: "message",
    published: true,
  };
  return await this.getPagedQuery(limit, skip, queryObj);
}

// New method in ApiService
/**
 * Fetches all Published Notes.
 * @param {number} limit - The limit of messages per page.
 * @param {number} skip - The number of messages to skip for pagination.
 * @param {number} neLat - The latitude of the NE corner of the bounding box.
 * @param {number} neLng - The longitude of the NE corner of the bounding box.
 * @param {number} swLat - The latitude of the SW corner of the bounding box.
 * @param {number} swLng - The longitude of the SW corner of the bounding box.
 * @returns {Promise<any[]>} - The array of messages fetched from the API.
 * 
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
    "latitude[gte]": swLat, // Greater than or equal to SW latitude
    "latitude[lte]": neLat, // Less than or equal to NE latitude
    "longitude[gte]": swLng, // Greater than or equal to SW longitude
    "longitude[lte]": neLng, // Less than or equal to NE longitude
  };
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
        const firestoreData = userDoc.data() as UserData;
        console.log("User data retrieved from Firestore:", firestoreData);
        return firestoreData; // Return data from Firestore as UserData
      } else {
        console.log("No user data found in Firestore, using API fallback.");
      }
      
      const url = RERUM_PREFIX + "query";
      const headers = {
        "Content-Type": "application/json",
      };
      const body = {
        "$or": [
          { "@type": "Agent", "uid": uid },
          { "@type": "foaf:Agent", "uid": uid }
        ]
      };

      console.log(`Querying for user data with UID: ${uid}`);

      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      const data = await response.json();
      console.log(`User Data:`, data);
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
      const token = localStorage.getItem('authToken');
  
      // Include the token in the headers
      const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}` 
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
        approvalRequested: note.approvalRequested,
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
        approvalRequested: note.approvalRequested,
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
        if (
          message.title &&
          message.title.toLowerCase().includes(lowerCaseQuery)
        ) {
          return true;
        }

        // Check if any tags contain the query string
        if (
          message.tags &&
          message.tags.some((tag: string) =>
            tag.toLowerCase().includes(lowerCaseQuery)
          )
        ) {
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

 /**
 * Fetches the name of the creator by querying the API with the given creatorId.
 * If the API does not return a valid name, it will fetch the creator's name from Firestore.
 * @param {string} creatorId - The UID of the creator.
 * @returns {Promise<string>} The name of the creator.
 */
static async fetchCreatorName(creatorId: string): Promise<string> {
  try {
    const url = RERUM_PREFIX + "query";
    const headers = {
      "Content-Type": "application/json",
    };
    const body = {
      "$or": [
        { "@type": "Agent", "uid": creatorId },
        { "@type": "foaf:Agent", "uid": creatorId }
      ]
    };

    console.log(`Querying API with UID: ${creatorId}`);

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.json();
    console.log(`API Response Data:`, data);

    if (data.length && data[0].name) {
      return data[0].name;
    } else {
      console.warn(`No name found in API for UID: ${creatorId}. Querying Firestore.`);
      
      // If the API doesn't return the name, fetch it from Firestore
      return await this.fetchCreatorNameFromFirestore(creatorId);
    }
  } catch (error) {
    console.error(`Error fetching creator name from API:`, error, creatorId);
    console.warn(`Attempting to fetch creator name from Firestore...`);
    
    // Fallback to Firestore in case of error
    return await this.fetchCreatorNameFromFirestore(creatorId);
  }
}

/**
 * Fetches the name of a user from Firestore using their UID.
 * @param {string} userId - The UID of the user.
 * @returns {Promise<string>} - The name of the user.
 */
static async fetchCreatorNameFromFirestore(userId: string): Promise<string> {
  try {
    console.log("Fetching user name from Firestore for UID:", userId);

    // Initialize Firestore
    const db = getFirestore();

    // Reference the user's document
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log("User document data:", data);

      // Check if the name field is available
      if (data.name) {
        return data.name;
      } else {
        console.warn(`No 'name' field found for UID: ${userId}`);
        return "Unknown User";
      }
    } else {
      console.warn(`No user found with UID: ${userId}`);
      return "Unknown User";
    }
  } catch (error) {
    console.error("Error fetching user name from Firestore:", error);

    // Handle insufficient permissions
    if (error instanceof Error && error.message.includes("Missing or insufficient permissions")) {
      console.warn("Insufficient permissions. Returning fallback name.");
      return "Unknown User";
    }

    throw error; // Re-throw other errors
  }
}


/**
 * Fetches the list of users (students) associated with a given instructor from Firestore.
 * @param {string} instructorId - The UID of the instructor.
 * @returns {Promise<{ uid: string; name: string; email: string }[]>} A list of student objects under the instructor.
 */
static async fetchUsersByInstructor(instructorId: string): Promise<{ uid: string; name: string; email: string }[]> {
  try {
    const firestore = await import("firebase/firestore"); // Lazy load Firestore if not already imported
    const db = firestore.getFirestore(); // Initialize Firestore instance

    // Query Firestore to get all users where `parentInstructorId` matches the instructorId
    const usersQuery = firestore.query(
      firestore.collection(db, "users"),
      firestore.where("parentInstructorId", "==", instructorId),
      firestore.where("isInstructor", "==", false) // Exclude instructors
    );

    const querySnapshot = await firestore.getDocs(usersQuery);
    const users: { uid: string; name: string; email: string }[] = [];

    // Extract data from query snapshot
    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      if (userData?.uid && userData?.name && userData?.email) {
        users.push({
          uid: userData.uid,
          name: userData.name,
          email: userData.email,
        });
      } else {
        console.warn(`User document with ID ${doc.id} is missing required fields.`);
      }
    });

    console.log(`Fetched students under instructor ${instructorId}:`, users);

    if (users.length === 0) {
      console.warn(`No students found for instructor with ID: ${instructorId}`);
    }

    return users;
  } catch (error) {
    console.error(`Error fetching students for instructor with ID ${instructorId}:`, error);
    throw new Error(`Unable to fetch students for instructor with ID: ${instructorId}`);
  }
}




  static async handler(req: NextApiRequest, res: NextApiResponse) {
    console.log('Received request:', req.method, req.body);

    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    const { notes } = req.body;

    if (!notes || !Array.isArray(notes)) {
      return res.status(400).json({ message: 'Invalid request body' });
    }

    const noteContents = notes.map(note => note.content).join('\n');
    console.log('Note contents for tag generation:', noteContents);

    try {
      const tags = await ApiService.generateTags(noteContents);
      res.status(200).json({ tags });
    } catch (error) {
      console.error('Error generating tags:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}

export function getVideoThumbnail(file: File, seekTo = 0.0) {
  console.log("getting video cover for file: ", file);
  return new Promise((resolve, reject) => {
      const videoPlayer = document.createElement('video');
      videoPlayer.setAttribute('src', URL.createObjectURL(file));
      videoPlayer.load();
      videoPlayer.addEventListener('error', (ex) => {
          reject(new Error(`Error when loading video file: ${ex.message || ex.toString()}`));
      });
      videoPlayer.addEventListener('loadedmetadata', () => {
          if (videoPlayer.duration < seekTo) {
              reject(new Error("Video is too short."));
              return;
          }
          setTimeout(() => {
            videoPlayer.currentTime = seekTo;
          }, 200);
          videoPlayer.addEventListener('seeked', () => {
              console.log('video is now paused at %ss.', seekTo);
              const canvas = document.createElement("canvas");
              canvas.width = videoPlayer.videoWidth;
              canvas.height = videoPlayer.videoHeight;
              const ctx = canvas.getContext("2d");
              if (ctx){
                ctx.drawImage(videoPlayer, 0, 0, canvas.width, canvas.height);
                ctx.canvas.toBlob(
                    blob => {
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
      const video = document.createElement('video');
      video.preload = 'metadata';

      video.onloadedmetadata = function() {
          window.URL.revokeObjectURL(video.src);
          const durationInSeconds = video.duration;
          const formattedDuration = formatDuration(durationInSeconds);
          resolve(formattedDuration);
      };

      video.onerror = function() {
          reject("Failed to load video metadata");
      };

      video.src = URL.createObjectURL(file);
  });
}

export function uploadMedia(uploadMedia: any) {
    throw new Error('Function not implemented.');
}
