import { Note } from "@/app/types";

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

export const handleAddParameter = async (parameterName: string, parameterType: string) => {
  const allNotes = await getEveryNote();

  const updatePromises = allNotes.map(async (note: any) => {
    if (parameterType === "string") {
      note[parameterName] = "";
    } else if (parameterType === "array") {
      note[parameterName] = [];
    } else if (parameterType === "float") {
      note[parameterName] = 0.0;
    } else if (parameterType === "boolean") {
      note[parameterName] = false;
    }

    console.log("updated note ",note);

    try {
      const val = await fetch(`${RERUM_PREFIX}overwrite`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(note),
      });
      console.log('return val ',val);
    } catch (error) {
      console.error(`Failed to update note ${note["@id"]}:`, error);
    }
  });
  await Promise.all(updatePromises);
  return "no errors"
};


export const handleRemoveParameter = async (parameterName: string) => {
  const allNotes = await getEveryNote();

  const updatePromises = allNotes.map(async (note: any) => {
    delete note[parameterName];
    console.log("new note object with deleted parameter");

    try {
      const val = await fetch(`${RERUM_PREFIX}overwrite`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(note),
      });
      console.log('return val ',val);
    } catch (error) {
      console.error(`Failed to update note ${note["@id"]}:`, error);
    }
  });
  await Promise.all(updatePromises);
  return "no errors"
};


