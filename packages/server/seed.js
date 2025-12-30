import { MongoClient } from "mongodb";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

const MONGO_URI = process.env.MONGO_CONNECTION_STRING;
const DB_NAME = process.env.MONGO_DB;
const COLLECTION = process.env.MONGO_COLLECTION;
const INPUT_FILE = "all_notes.json";

async function seed() {
  const client = new MongoClient(MONGO_URI);
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION);

    const notes = JSON.parse(fs.readFileSync(INPUT_FILE, "utf-8"));

    // Clear the collection first:
    await collection.deleteMany({});

    // Insert notes (skip if empty)
    if (notes.length) {
      const result = await collection.insertMany(notes);
      console.log(`Inserted ${result.insertedCount} notes into ${COLLECTION}`);
    } else {
      console.log("No notes to insert.");
    }
  } catch (err) {
    console.error("Error seeding database:", err);
  } finally {
    await client.close();
  }
}

seed();
