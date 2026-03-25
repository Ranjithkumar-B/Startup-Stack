import mongoose from 'mongoose';
const MONGODB_URI = 'mongodb+srv://ranjith81518_db_user:aehobjNTWGsByNMb@cluster0.drceqjj.mongodb.net/?appName=Cluster0';

async function run() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Dropping the entire MongoDB database...');
    await mongoose.connection.db.dropDatabase();
    console.log('Database dropped.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
