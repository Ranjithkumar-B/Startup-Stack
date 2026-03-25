import mongoose from 'mongoose';
const MONGODB_URI = "mongodb+srv://ranjith81518_db_user:aehobjNTWGsByNMb@cluster0.drceqjj.mongodb.net/?appName=Cluster0";
const UserSchema = new mongoose.Schema({ _id: Number, name: String, role: String, email: String });
const User = mongoose.models.User || mongoose.model('User', UserSchema);
async function clean() {
  await mongoose.connect(MONGODB_URI);
  const result = await User.deleteMany({ _id: { $in: [5, 7] } });
  console.log(`Deleted ${result.deletedCount} duplicate accounts.`);
  await mongoose.disconnect();
}
clean();
