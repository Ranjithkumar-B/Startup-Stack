import mongoose from 'mongoose';
const MONGODB_URI = 'mongodb+srv://ranjith81518_db_user:aehobjNTWGsByNMb@cluster0.drceqjj.mongodb.net/?appName=Cluster0';

async function run() {
  try {
    await mongoose.connect(MONGODB_URI);
    const db = mongoose.connection.db;

    // 1. Rename collection 'instructorstudents' to 'facultystudents' if it exists.
    const collections = await db.listCollections().toArray();
    const hasOld = collections.find(c => c.name === 'instructorstudents');
    const hasNew = collections.find(c => c.name === 'facultystudents');

    if (hasOld) {
      if (hasNew) {
        // Merge or just copy documents
        console.log('Merging instructorstudents into facultystudents...');
        const oldCol = db.collection('instructorstudents');
        const docs = await oldCol.find().toArray();
        if (docs.length > 0) {
          await db.collection('facultystudents').insertMany(docs);
        }
        await oldCol.drop();
      } else {
        console.log('Renaming instructorstudents to facultystudents...');
        await db.collection('instructorstudents').rename('facultystudents');
      }
    }

    // 2. Map instructorId to facultyId in ALL collections where it could exist
    const collectionsToFix = ['facultystudents', 'courses'];
    for (const colName of collectionsToFix) {
      const col = db.collection(colName);
      if (col) {
        const res = await col.updateMany(
          { instructorId: { $exists: true } },
          { $rename: { instructorId: 'facultyId' } }
        );
        console.log(`Updated ${colName} (instructorId -> facultyId):`, res.modifiedCount);
      }
    }

    console.log('Database terminal migration successful!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
