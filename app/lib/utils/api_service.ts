import { Note } from "@/app/types";
import { UserData } from "../../types";
import type { NextApiRequest, NextApiResponse } from 'next';

const RERUM_PREFIX = process.env.NEXT_PUBLIC_RERUM_PREFIX;
const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
const OPENAI_API_URL = process.env.NEXT_PUBLIC_OPENAI_API_URL;


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
      { role: "system", content: "You are a professional ethnographer suggesting the best web ontology tags for notes." },
      { role: "user", content: `Suggest 20 one-word tags for the following notes:\n${noteContent}\nTags as an ethnographer. Keep the responses to one-word tags as a comma-separated list. Use specific web ontology such as Library of Congress Subject Headings, Classification, AFS Ethnographic Thesaurus, Subject Schemas, Classification Schemes, and include the city in the tags.` }
    ];

    try {
      const response = await fetch(OPENAI_API_URL, {
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

      const tags = data.choices[0].message.content.trim().split(',').map(tag => tag.trim());
      return tags;
    } catch (error) {
      console.error('Error generating tags:', error);
      throw new Error('Failed to generate tags');
    }
  }


    /**
   * Fetches messages from the API.
   * @param {boolean} global - Indicates whether to fetch global messages or user-specific messages.
   * @param {string} userId - The ID of the user for user-specific messages.
   * @param {string} noteContent - The content of the note.
   * @returns {Promise<any[]>} The array of messages fetched from the API.
   */
  static async fetchMessages(
    global: boolean,
    published: boolean,
    userId: string
  ): Promise<any[]> {
    try {
      const url = RERUM_PREFIX + "query";

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
      return data;
    } catch (error) {
      console.error("Error fetching messages:", error);
      throw error;
    }
  }


   /**
   * Fetches user data from the API based on UID.
   * @param {string} uid - The UID of the user.
   * @returns {Promise<UserData | null>} The user data.
   */
   static async fetchUserData(uid: string): Promise<UserData | null> {
    try {
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

      const headers = {
        "Content-Type": "text/plain; charset=utf-8",
      };
      const body = {
        type: "message",
        creator: userId,
        "@id": id,
      };

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
    return fetch(RERUM_PREFIX + "creating", {
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
      }),
    });
  }

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
   * Fetches all messages for a specific user.
   * @param {string} userId - The ID of the user whose messages are to be fetched.
   * @returns {Promise<any[]>} - The array of messages fetched from the API.
   */

  static async fetchUserMessages(userId: string): Promise<any[]> {
    try {
      const url = RERUM_PREFIX + "query";
      const headers = {
        "Content-Type": "application/json",
      };

      // Body for the request: fetch messages of type 'message' created by the specified user
      const body = {
        type: "message",
        creator: userId,
      };
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching user messages:", error);
      throw error;
    }
  }

  /**
   * Fetches all Published Notes.
   * @returns {Promise<any[]>} - The array of messages fetched from the API.
   */
  static async fetchPublishedNotes(): Promise<any[]> {
    try {
      const url = RERUM_PREFIX + "query";
      const headers = {
        "Content-Type": "application/json",
      };

      // Body for the request: fetch messages of type 'message' created by the specified user
      const body = {
        type: "message",
        published: true,
      };

      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching user messages:", error);
      throw error;
    }
  }

 /**
   * Fetches the name of the creator by querying the API with the given creatorId.
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

    console.log(`Querying with UID: ${creatorId}`);

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.json();
    console.log(`Data:`, data);
    if (data.length && data[0].name) {
      return data[0].name;
    } else {
      throw new Error("Creator not found or no name attribute.");
    }
  } catch (error) {
    console.error(`Error fetching creator name:`, error, creatorId);
    throw error;
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
          // Adjust this line to include only one argument for reject
          reject(new Error(`Error when loading video file: ${ex.message || ex.toString()}`));
      });
      videoPlayer.addEventListener('loadedmetadata', () => {
          if (videoPlayer.duration < seekTo) {
              // Adjust this line as well
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




