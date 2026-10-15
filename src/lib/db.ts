import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectToDatabase(): Promise<typeof mongoose | null> {
  if (!MONGODB_URI || MONGODB_URI.trim() === "" || MONGODB_URI.includes("sample.mongodb.net")) {
    return null;
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      console.log("Connected to MongoDB Atlas");
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.warn("MongoDB connection fallback to in-memory:", (e as Error).message);
    return null;
  }

  return cached.conn;
}

// In-Memory store fallback
export interface InMemoryStore {
  questions: Map<string, any>; // key: `${modul}_${number}`
  submissions: any[];
  modules: Map<number, string>; // key: modul (1..5)
}

declare global {
  var __localMemoryStore: InMemoryStore | undefined;
}

if (!global.__localMemoryStore) {
  global.__localMemoryStore = {
    questions: new Map(),
    submissions: [],
    modules: new Map([
      [1, "GPIO & Register"],
      [2, "Timer & Counter"],
      [3, "Interupsi & ADC"],
      [4, "Komunikasi Serial"],
      [5, "PWM & Kontrol Motor"],
    ]),
  };
}

export const localStore = global.__localMemoryStore;
