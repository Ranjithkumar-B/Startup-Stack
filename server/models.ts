import mongoose from 'mongoose';

const CounterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 }
});
// Need to prevent OverwriteModelError in watch mode
const Counter = mongoose.models.Counter || mongoose.model('Counter', CounterSchema);

async function getNextSeq(name: string) {
  const result = await Counter.findByIdAndUpdate(name, { $inc: { seq: 1 } }, { new: true, upsert: true });
  return result?.seq || 1;
}

function autoIncrement(schema: mongoose.Schema, modelName: string) {
  schema.pre('save', async function() {
    if (this.isNew && !this._id) {
      this._id = await getNextSeq(modelName);
    }
  });
}

const UserSchema = new mongoose.Schema({
  _id: Number,
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
autoIncrement(UserSchema, 'user');
export const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);

const CourseSchema = new mongoose.Schema({
  _id: Number,
  title: { type: String, required: true },
  description: { type: String, required: true },
  videoUrl: String,
  duration: { type: Number, default: 0 },
  facultyId: { type: Number, required: true }
});
autoIncrement(CourseSchema, 'course');
export const CourseModel = mongoose.models.Course || mongoose.model('Course', CourseSchema);

const EnrollmentSchema = new mongoose.Schema({
  _id: Number,
  studentId: { type: Number, required: true },
  courseId: { type: Number, required: true },
  progress: { type: Number, default: 0 }
});
autoIncrement(EnrollmentSchema, 'enrollment');
export const EnrollmentModel = mongoose.models.Enrollment || mongoose.model('Enrollment', EnrollmentSchema);

const EngagementEventSchema = new mongoose.Schema({
  _id: Number,
  studentId: { type: Number, required: true },
  courseId: { type: Number, required: true },
  eventType: { type: String, required: true },
  duration: { type: Number, default: 0 },
  timestamp: { type: Date, default: Date.now }
});
autoIncrement(EngagementEventSchema, 'engagement_event');
export const EngagementEventModel = mongoose.models.EngagementEvent || mongoose.model('EngagementEvent', EngagementEventSchema);

const FacultyStudentSchema = new mongoose.Schema({
  _id: Number,
  facultyId: { type: Number, required: true },
  studentId: { type: Number, required: true }
});
autoIncrement(FacultyStudentSchema, 'faculty_student');
export const FacultyStudentModel = mongoose.models.FacultyStudent || mongoose.model('FacultyStudent', FacultyStudentSchema);

const QuizSchema = new mongoose.Schema({
  _id: Number,
  courseId: { type: Number, required: true },
  title: { type: String, required: true },
  description: String
});
autoIncrement(QuizSchema, 'quiz');
export const QuizModel = mongoose.models.Quiz || mongoose.model('Quiz', QuizSchema);

const QuizQuestionSchema = new mongoose.Schema({
  _id: Number,
  quizId: { type: Number, required: true },
  questionText: { type: String, required: true },
  options: { type: String, required: true },
  correctOptionIndex: { type: Number, required: true }
});
autoIncrement(QuizQuestionSchema, 'quiz_question');
export const QuizQuestionModel = mongoose.models.QuizQuestion || mongoose.model('QuizQuestion', QuizQuestionSchema);

const QuizSubmissionSchema = new mongoose.Schema({
  _id: Number,
  quizId: { type: Number, required: true },
  studentId: { type: Number, required: true },
  score: { type: Number, required: true },
  submittedAt: { type: Date, default: Date.now }
});
autoIncrement(QuizSubmissionSchema, 'quiz_submission');
export const QuizSubmissionModel = mongoose.models.QuizSubmission || mongoose.model('QuizSubmission', QuizSubmissionSchema);

const TaskSchema = new mongoose.Schema({
  _id: Number,
  courseId: { type: Number, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  dueDate: Date
});
autoIncrement(TaskSchema, 'task');
export const TaskModel = mongoose.models.Task || mongoose.model('Task', TaskSchema);

const TaskSubmissionSchema = new mongoose.Schema({
  _id: Number,
  taskId: { type: Number, required: true },
  studentId: { type: Number, required: true },
  pdfUrl: { type: String, required: true },
  grade: Number,
  feedback: String,
  submittedAt: { type: Date, default: Date.now }
});
autoIncrement(TaskSubmissionSchema, 'task_submission');
export const TaskSubmissionModel = mongoose.models.TaskSubmission || mongoose.model('TaskSubmission', TaskSubmissionSchema);
