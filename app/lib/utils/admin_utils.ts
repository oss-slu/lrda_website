import { Note } from "@/app/types";

const RERUM_PREFIX = process.env.NEXT_PUBLIC_RERUM_PREFIX;

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
          creator: "https://devstore.rerum.io/v1/id/5f284ecfe4b00e5e099907c1",
        }),
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
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
  
export const handleAddParameter = async () => {
    // fetch all notes
    // add parameter to all notes
    // save
}
export const handleRemoveParameter = async () => {
    // fetch all notes
    // remove parameter from all notes
    // save
}