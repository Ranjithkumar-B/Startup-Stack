import mongoose from 'mongoose';
const MONGODB_URI = 'mongodb+srv://ranjith81518_db_user:aehobjNTWGsByNMb@cluster0.drceqjj.mongodb.net/?appName=Cluster0';

async function run() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;

  await db.collection('courses').updateMany(
    { facultyId: 1 },
    { $set: { facultyId: 2 } }
  );
  console.log('Courses moved to ID 2');

  await db.collection('facultystudents').updateMany(
    { facultyId: 1 },
    { $set: { facultyId: 2 } }
  );
  console.log('Faculty students moved to ID 2');
  const delRes = await db.collection('users').deleteOne({ _id: 1 });
  console.log('Deleted user ID 1:', delRes.deletedCount);

  process.exit(0);
}
run();
