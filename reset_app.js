import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

const MONGODB_URI = 'mongodb+srv://ranjith81518_db_user:aehobjNTWGsByNMb@cluster0.drceqjj.mongodb.net/?appName=Cluster0';

async function run() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    const db = mongoose.connection.db;

    const collections = await db.listCollections().toArray();
    console.log('Dropping collections...');
    for (const col of collections) {
      await db.collection(col.name).drop();
      console.log(`Dropped collection: ${col.name}`);
    }

    // Delete uploads
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (fs.existsSync(uploadDir)) {
      console.log('Clearing uploads directory...');
      const files = fs.readdirSync(uploadDir);
      for (const file of files) {
          const filePath = path.join(uploadDir, file);
          if (fs.statSync(filePath).isFile()) {
              fs.unlinkSync(filePath);
          }
      }
      console.log('Uploads cleared.');
    }

    console.log('App reset successfully! Fresh start ready.');
    process.exit(0);
  } catch (err) {
    console.error('Failed to reset app:', err);
    process.exit(1);
  }
}

run();
