import fetch from "node-fetch";
import fs from "fs";

const RERUM_PREFIX = "https://lived-religion-dev.rerum.io/deer-lr/";
const OUTPUT_FILE = "all_notes.json";
const LIMIT = 150; // Adjust as needed

async function fetchAllNotes(limit = LIMIT, skip = 0, allResults = []) {
  const url = `${RERUM_PREFIX}query?limit=${limit}&skip=${skip}`;
  const body = { type: "message" };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    // headers: { "Authorization": "Bearer YOUR_TOKEN", ... } // Uncomment if needed
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  allResults = allResults.concat(data);

  if (data.length === limit) {
    // More results to fetch
    return fetchAllNotes(limit, skip + data.length, allResults);
  }
  return allResults;
}

(async () => {
  try {
    const notes = await fetchAllNotes();
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(notes, null, 2));
    console.log(`Downloaded ${notes.length} notes to ${OUTPUT_FILE}`);
  } catch (err) {
    console.error("Error downloading notes:", err);
  }
})();
