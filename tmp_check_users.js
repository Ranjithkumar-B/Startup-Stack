import mongoose from 'mongoose';
const MONGODB_URI = "mongodb+srv://ranjith81518_db_user:aehobjNTWGsByNMb@cluster0.drceqjj.mongodb.net/?appName=Cluster0";
const UserSchema = new mongoose.Schema({ _id: Number, name: String, email: String, role: String });
const User = mongoose.models.User || mongoose.model('User', UserSchema);
async function check() {
  await mongoose.connect(MONGODB_URI);
  const users = await User.find({}).sort({ role: 1, name: 1 });
  console.log('--- ALL USERS ---');
  users.forEach(u => {
    console.log(`ID: ${u._id} | Name: ${u.name} | Role: ${u.role} | Email: ${u.email}`);
  });
  await mongoose.disconnect();
}
check();
