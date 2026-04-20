import mongoose from 'mongoose';

const MONGODB_URI = "mongodb+srv://ranjith81518_db_user:aehobjNTWGsByNMb@cluster0.drceqjj.mongodb.net/?appName=Cluster0";

export async function connectDB() {
  try {
    console.log("Attempting to connect to MongoDB...");
    await mongoose.connect(MONGODB_URI, { 
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000 
    });
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
}
