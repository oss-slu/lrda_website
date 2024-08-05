import { Note } from "@/app/types";
import { JSONContent } from "@tiptap/core";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress"
import { useState } from "react";
import ApiService from "./api_service";

const RERUM_PREFIX = process.env.NEXT_PUBLIC_RERUM_PREFIX;

// creator: "https://devstore.rerum.io/v1/id/5f284ecfe4b00e5e099907c1", // Test User Account


export async function getTestNote(): Promise<any> {
  const url = `${RERUM_PREFIX}query`;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "message",
      }),
    });
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching schema:", error);
    throw error;
  }
}

export async function getEveryNote(): Promise<any> {
  const url = `${RERUM_PREFIX}query`;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "message",
      }),
    });
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching schema:", error);
    throw error;
  }
}

export const handleLogin = async (username: string, password: string) => {
  try {
    const response = await fetch(`${RERUM_PREFIX}login`, {
      method: "POST",
      mode: "cors",
      cache: "no-cache",
      headers: {
        "Content-Type": "application/json;charset=utf-8",
      },
      body: JSON.stringify({
        username: username,
        password: password,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return data;
    } else {
      const errorText = await response.text();
      throw new Error(`Login failed: ${response.status} ${errorText}`);
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const handleAddParameter = async (parameterName: string, parameterType: string, setProgress: (value: number) => void) => {
  const allNotes = await getEveryNote();
  toast("Request Is being run. Please Wait. This can take a while.", {
    description: `${parameterName} is being added to ${(allNotes).length} notes. Please Wait.`,
    duration: 2000,
  });

  let counter = 0;
  const totalNotes = allNotes.length;

  const updatePromises = allNotes.map(async (note: any, index: number) => {
    if (parameterType === "string") {
      note[parameterName] = "";
    } else if (parameterType === "array") {
      note[parameterName] = [];
    } else if (parameterType === "float") {
      note[parameterName] = 0.0;
    } else if (parameterType === "boolean") {
      note[parameterName] = false;
    }

    try {
      const val = await fetch(`${RERUM_PREFIX}overwrite`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(note),
      });
      counter++;
      setProgress((counter / totalNotes) * 100);
      console.log((counter / totalNotes) * 100);
    } catch (error) {
      console.error(`Failed to update note ${note["@id"]}:`, error);
    }
  });

  await Promise.all(updatePromises);
  toast(`Request is complete.`, {
    description: `${parameterName} has been added to all Notes.`,
    duration: 2000,
  });
  return "no errors"
};


export const handleRemoveParameter = async (parameterName: string, setProgress: (value: number) => void) => {
  const allNotes = await getEveryNote();
  toast("Request Is being run. Please Wait. This can take a while.", {
    description: `${parameterName} is being removed from ${(allNotes).length} notes. Please Wait.`,
    duration: 2000,
  });

  let counter = 0;
  const totalNotes = allNotes.length;

  const updatePromises = allNotes.map(async (note: any, index: number) => {
    delete note[parameterName];

    try {
      const val = await fetch(`${RERUM_PREFIX}overwrite`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(note),
      });
      counter++;
      setProgress((counter / totalNotes) * 100); 
    } catch (error) {
      console.error(`Failed to update note ${note["@id"]}:`, error);
    }
  });
  
  await Promise.all(updatePromises);
  toast(`Request is complete.`, {
    description: `${parameterName} has been removed from all Notes.`,
    duration: 2000,
  });
  return "no errors"
};


export const handleAddUid = async (oldRerumId: string, newFirebaseId: string) => {
  try {
    const response = await fetch(oldRerumId);
    const oldData = await response.json();

    const updatedUser = {
      ...oldData,
      "wr:uid": newFirebaseId,
    };

    const overwriteResponse = await fetch(`${RERUM_PREFIX}overwrite`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedUser),
    });

    return overwriteResponse;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};


export const handleUpdateCreatorUid = async (oldRerumId: string, newFirebaseId: string) => {
  try {
    const notes = await ApiService.fetchMessages(false, false, oldRerumId);
    
    const updatePromises = notes.map(async (note: any) => {
      note.creator = newFirebaseId;

      try {
        const overwriteResponse = await fetch(`${RERUM_PREFIX}overwrite`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(note),
        });
        
        return {
          noteId: note["@id"],
          status: overwriteResponse.ok ? "success" : "failure",
          statusText: overwriteResponse.statusText,
        };
      } catch (error) {
        console.error(`Failed to update note ${note["@id"]}:`, error);
        return {
          noteId: note["@id"],
          status: "error",
          error: error,
        };
      }
    });

    const results = await Promise.all(updatePromises);
    return results;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};
