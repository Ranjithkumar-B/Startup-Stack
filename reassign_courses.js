import mongoose from 'mongoose';
const MONGODB_URI = 'mongodb+srv://ranjith81518_db_user:aehobjNTWGsByNMb@cluster0.drceqjj.mongodb.net/?appName=Cluster0';

async function run() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;

  // Reassign courses
  await db.collection('courses').updateMany(
    { facultyId: { $ne: 1 } },
    { $set: { facultyId: 1 } }
  );
  
  // Reassign faculty students
  await db.collection('facultystudents').updateMany(
    { facultyId: { $ne: 1 } },
    { $set: { facultyId: 1 } }
  );

  console.log('Data reassigned to ID 1 (tamil@gmail.com)');
  process.exit(0);
}
run();
