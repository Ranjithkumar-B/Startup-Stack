import mongoose from 'mongoose';
const MONGODB_URI = 'mongodb+srv://ranjith81518_db_user:aehobjNTWGsByNMb@cluster0.drceqjj.mongodb.net/?appName=Cluster0';
const UserSchema = new mongoose.Schema({ role: String });

async function run() {
  try {
    await mongoose.connect(MONGODB_URI);
    const res = await mongoose.model('User', UserSchema).updateMany({ role: 'instructor' }, { role: 'faculty' });
    console.log('Users updated:', res.modifiedCount);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
