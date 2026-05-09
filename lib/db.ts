import mongoose from "mongoose";

// Import all models to ensure they are registered with Mongoose
import "@/models/User";
import "@/models/Contact";
import "@/models/ContactGroup";
import "@/models/Template";
import "@/models/Campaign";
import "@/models/CampaignLog";
import "@/models/SmtpAccount";

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable inside .env.local");
}

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = {
    conn: null,
    promise: null,
  };
}

async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
    });
  }

  try {
    cached.conn = await cached.promise;
    console.log("✅ MongoDB Connected");
  } catch (error) {
    cached.promise = null;
    console.error("❌ MongoDB Error:", error);
    throw error;
  }

  return cached.conn;
}

export default connectToDatabase;