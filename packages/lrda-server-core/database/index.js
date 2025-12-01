import { MongoClient, ObjectId } from "mongodb";
import { getConfig } from "../config.js";

let client;
let db;

function currentSettings() {
  const cfg = getConfig();
  const mongoUri = cfg.mongoUri;
  const dbName = cfg.mongodbName;
  const collName = cfg.mongodbCollection;
  return { mongoUri, dbName, collName };
}

async function ensureConnected() {
  if (db && client) return;
  const { mongoUri, dbName, collName } = currentSettings();
  if (!mongoUri) throw new Error("mongoUri is not configured (set MONGO_CONNECTION_STRING or pass options to createCoreRouter)");
  client = new MongoClient(mongoUri);
  await client.connect();
  db = client.db(dbName)?.collection(collName);
}

const newID = () => new ObjectId().toHexString();
const isValidID = (id) => ObjectId.isValid(id);
const connected = async function () {
  await ensureConnected();
  await client
    .db("admin")
    .command({ ping: 1 })
    .catch((err) => err);
  return true;
};

// Backward compatible named export used by controllers
// This provides a minimal facade that forwards calls to the live collection
const dbFacade = new Proxy(
  {},
  {
    get: function (_target, prop) {
      return async function (...args) {
        await ensureConnected();
        const fn = db[prop].bind(db);
        return fn(...args);
      };
    },
  }
);

export { newID, isValidID, connected, db };
