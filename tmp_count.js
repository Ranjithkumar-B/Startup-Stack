import mongoose from 'mongoose';
const MONGODB_URI = 'mongodb+srv://ranjith81518_db_user:aehobjNTWGsByNMb@cluster0.drceqjj.mongodb.net/?appName=Cluster0';

async function run() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  
  const users = await db.collection('users').countDocuments();
  const courses = await db.collection('courses').countDocuments();
  const quizzes = await db.collection('quizzes').countDocuments();
  const tasks = await db.collection('tasks').countDocuments();
  
  console.log('--- DB STATS ---');
  console.log('Users:', users);
  console.log('Courses:', courses);
  console.log('Quizzes:', quizzes);
  console.log('Tasks:', tasks);
  
  process.exit();
}
run();
