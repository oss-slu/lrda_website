"use server";

const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
const OPENAI_API_URL = process.env.NEXT_PUBLIC_OPENAI_API_URL;

/**
 * Generates one-word tags for ethnographic notes.
 * @param {string} noteContent - The content of the ethnographic note.
 * @returns {Promise<string[]>} A promise that resolves to an array of tags.
 * @throws Will throw an error if the tags could not be generated.
 */
export async function generateTags(noteContent: string): Promise<string[]> {
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
