import mongoose from 'mongoose';
const MONGODB_URI = 'mongodb+srv://ranjith81518_db_user:aehobjNTWGsByNMb@cluster0.drceqjj.mongodb.net/?appName=Cluster0';

async function run() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  const delRes = await db.collection('users').deleteOne({ _id: 8 });
  console.log('Deleted user ID 8:', delRes.deletedCount);
  process.exit();
}
run();
