import mongoose from 'mongoose';
const MONGODB_URI = 'mongodb+srv://ranjith81518_db_user:aehobjNTWGsByNMb@cluster0.drceqjj.mongodb.net/?appName=Cluster0';

async function run() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  const u5 = await db.collection('users').findOne({ _id: 5 });
  console.log('ID 5:', u5.name, u5.email);
  const u9 = await db.collection('users').findOne({ _id: 9 });
  console.log('ID 9:', u9?.name, u9?.email);
  process.exit();
}
run();
