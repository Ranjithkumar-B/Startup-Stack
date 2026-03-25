import {
  UserModel, CourseModel, EnrollmentModel, EngagementEventModel,
  FacultyStudentModel, QuizModel, QuizQuestionModel, 
  QuizSubmissionModel, TaskModel, TaskSubmissionModel
} from "./models";
import type { User, Course, Enrollment, EngagementEvent, Quiz, QuizQuestion, QuizSubmission } from "@shared/schema";
import type { registerSchema, eventSchema } from "@shared/schema";
import type { z } from "zod";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: z.infer<typeof registerSchema> & { passwordHash: string }): Promise<User>;
  
  getCourses(): Promise<Course[]>;
  getCoursesByFaculty(facultyId: number): Promise<Course[]>;
  getEnrolledCourses(studentId: number): Promise<(Course & { progress: number })[]>;
  createCourse(course: Omit<Course, "id">): Promise<Course>;
  updateCourse(id: number, course: Partial<Course>): Promise<Course>;
  deleteCourse(id: number): Promise<void>;
  
  enrollStudent(studentId: number, courseId: number): Promise<Enrollment>;
  
  logEvent(event: z.infer<typeof eventSchema>): Promise<EngagementEvent>;
  getStudentEvents(studentId: number): Promise<EngagementEvent[]>;
  getCourseEvents(courseId: number): Promise<EngagementEvent[]>;
  getAllEvents(): Promise<EngagementEvent[]>;
  
  getQuiz(id: number): Promise<Quiz | undefined>;
  createQuiz(quiz: Omit<Quiz, "id">): Promise<Quiz>;
  deleteQuiz(id: number): Promise<void>;
  createQuizQuestion(question: Omit<QuizQuestion, "id">): Promise<QuizQuestion>;
  getQuizzesByCourse(courseId: number): Promise<Quiz[]>;
  getQuizQuestions(quizId: number): Promise<QuizQuestion[]>;
  submitQuiz(submission: Omit<QuizSubmission, "id" | "submittedAt">): Promise<QuizSubmission>;
  getQuizSubmissions(studentId: number, courseId?: number): Promise<QuizSubmission[]>;
  
  getStudentsByFaculty(facultyId: number): Promise<any[]>;
  removeStudentFromFaculty(facultyId: number, studentId: number): Promise<void>;
  linkFacultyStudent(facultyId: number, studentId: number): Promise<void>;
  
  getAllStudents(): Promise<any[]>;
  getLeaderboard(userId?: number, role?: string): Promise<any[]>;
  
  getPlatformStats(): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  private mapDoc(doc: any) {
    if (!doc) return doc;
    const obj = (typeof doc.toObject === 'function') ? doc.toObject() : { ...doc };
    if (obj._id !== undefined) {
      obj.id = obj._id;
      delete obj._id;
    }
    delete obj.__v;
    return obj;
  }

  async getUser(id: number): Promise<User | undefined> {
    const user = await UserModel.findById(id).lean();
    return user ? this.mapDoc(user) : undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const user = await UserModel.findOne({ email }).lean();
    return user ? this.mapDoc(user) : undefined;
  }

  async createUser(userData: z.infer<typeof registerSchema> & { passwordHash: string }): Promise<User> {
    const user = await UserModel.create({
      name: userData.name,
      email: userData.email,
      passwordHash: userData.passwordHash,
      role: userData.role,
    });
    return this.mapDoc(user);
  }

  async getCourses(): Promise<Course[]> {
    const courses = await CourseModel.find().lean();
    return courses.map(c => this.mapDoc(c));
  }

  async getCoursesByFaculty(facultyId: number): Promise<Course[]> {
    const courses = await CourseModel.find({ facultyId }).lean();
    return courses.map(c => this.mapDoc(c));
  }

  async getEnrolledCourses(studentId: number): Promise<(Course & { progress: number })[]> {
    const enrollments = await EnrollmentModel.find({ studentId }).lean();
    const courseIds = enrollments.map(e => e.courseId);
    const courses = await CourseModel.find({ _id: { $in: courseIds } }).lean();
    
    return courses.map(c => {
      const enrollment = enrollments.find(e => e.courseId === c._id);
      return { ...this.mapDoc(c), progress: enrollment ? enrollment.progress : 0 };
    });
  }

  async createCourse(course: Omit<Course, "id">): Promise<Course> {
    const newCourse = await CourseModel.create(course);
    return this.mapDoc(newCourse.toObject());
  }

  async updateCourse(id: number, courseData: Partial<Course>): Promise<Course> {
    const updated = await CourseModel.findByIdAndUpdate(id, courseData, { new: true }).lean();
    if (!updated) throw new Error("Course not found");
    return this.mapDoc(updated);
  }

  async deleteCourse(id: number): Promise<void> {
    await EngagementEventModel.deleteMany({ courseId: id });
    await EnrollmentModel.deleteMany({ courseId: id });
    await CourseModel.findByIdAndDelete(id);
  }

  async enrollStudent(studentId: number, courseId: number): Promise<Enrollment> {
    const enrollment = await EnrollmentModel.create({ studentId, courseId });
    return this.mapDoc(enrollment.toObject());
  }

  async logEvent(event: z.infer<typeof eventSchema>): Promise<EngagementEvent> {
    const newEvent = await EngagementEventModel.create({
      studentId: event.studentId!,
      courseId: event.courseId,
      eventType: event.eventType,
      duration: event.duration || 0,
    });
    return this.mapDoc(newEvent.toObject());
  }

  async getStudentEvents(studentId: number): Promise<EngagementEvent[]> {
    const events = await EngagementEventModel.find({ studentId }).sort({ timestamp: -1 }).lean();
    return events.map(e => this.mapDoc(e));
  }

  async getCourseEvents(courseId: number): Promise<EngagementEvent[]> {
    const events = await EngagementEventModel.find({ courseId }).sort({ timestamp: -1 }).lean();
    return events.map(e => this.mapDoc(e));
  }

  async getAllEvents(): Promise<EngagementEvent[]> {
    const events = await EngagementEventModel.find().sort({ timestamp: -1 }).lean();
    return events.map(e => this.mapDoc(e));
  }
  
  async getQuiz(id: number): Promise<Quiz | undefined> {
    const quiz = await QuizModel.findById(id).lean();
    return quiz ? this.mapDoc(quiz) : undefined;
  }

  async createQuiz(quiz: Omit<Quiz, "id">): Promise<Quiz> {
    const newQuiz = await QuizModel.create(quiz);
    return this.mapDoc(newQuiz.toObject());
  }

  async deleteQuiz(id: number): Promise<void> {
    await QuizQuestionModel.deleteMany({ quizId: id });
    await QuizSubmissionModel.deleteMany({ quizId: id });
    await QuizModel.findByIdAndDelete(id);
  }

  async createQuizQuestion(question: Omit<QuizQuestion, "id">): Promise<QuizQuestion> {
    const newQuestion = await QuizQuestionModel.create(question);
    return this.mapDoc(newQuestion.toObject());
  }

  async getQuizzesByCourse(courseId: number): Promise<Quiz[]> {
    const quizzes = await QuizModel.find({ courseId }).lean();
    return quizzes.map(q => this.mapDoc(q));
  }

  async getQuizQuestions(quizId: number): Promise<QuizQuestion[]> {
    const questions = await QuizQuestionModel.find({ quizId }).lean();
    return questions.map(q => this.mapDoc(q));
  }

  async submitQuiz(submission: Omit<QuizSubmission, "id" | "submittedAt">): Promise<QuizSubmission> {
    const newSub = await QuizSubmissionModel.create({
      quizId: submission.quizId,
      studentId: submission.studentId,
      score: submission.score
    });
    return this.mapDoc(newSub.toObject());
  }

  async getQuizSubmissions(studentId: number, courseId?: number): Promise<QuizSubmission[]> {
    const query: any = { studentId };
    if (courseId) {
      const courseQuizzes = await QuizModel.find({ courseId }).lean();
      const quizIds = courseQuizzes.map(q => q._id);
      query.quizId = { $in: quizIds };
    }
    const submissions = await QuizSubmissionModel.find(query).lean();
    return submissions.map(s => this.mapDoc(s));
  }

  async getStudentsByFaculty(facultyId: number): Promise<any[]> {
    const mappings = await FacultyStudentModel.find({ facultyId }).lean();
    if (mappings.length === 0) return [];
    
    const studentIds = mappings.map(m => m.studentId);
    const studentsList = await UserModel.find({ _id: { $in: studentIds } }).lean();
    
    const studentsWithPoints = await Promise.all(studentsList.map(async (student) => {
      const events = await EngagementEventModel.find({ studentId: student._id }).lean();
      const enrollments = await EnrollmentModel.find({ studentId: student._id }).lean();
      const enrolledCourseIds = enrollments.map(e => e.courseId);
      const enrolledCourses = await CourseModel.find({ _id: { $in: enrolledCourseIds } }).lean();
      
      const rawPoints = events.reduce((sum, e) => {
        if (e.eventType === 'video_watch') return sum + e.duration;
        if (e.eventType === 'quiz_complete') return sum + 10;
        if (e.eventType === 'assignment_submit') return sum + 8;
        if (e.eventType === 'login') return sum + 2;
        return sum;
      }, 0);

      // Dynamic possible points based on student's specific curriculum
      let possiblePoints = 2; // Baseline for daily login
      for (const course of enrolledCourses) {
        possiblePoints += (course.duration || 0);
        const taskCount = await TaskModel.countDocuments({ courseId: course._id });
        const quizCount = await QuizModel.countDocuments({ courseId: course._id });
        possiblePoints += (taskCount * 8) + (quizCount * 10);
      }
      
      const daysSet = new Set();
      events.forEach(e => {
        const d = new Date(e.timestamp);
        daysSet.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
      });
      const activeDays = daysSet.size;

      const engagementScore = Math.round((rawPoints / Math.max(possiblePoints, 1)) * 100);

      return { 
        ...this.mapDoc(student), 
        points: rawPoints, 
        engagementScore, 
        activeDays, 
        maxPoints: possiblePoints 
      };
    }));

    return studentsWithPoints;
  }

  async removeStudentFromFaculty(facultyId: number, studentId: number): Promise<void> {
    await FacultyStudentModel.deleteMany({ facultyId, studentId });
  }

  async linkFacultyStudent(facultyId: number, studentId: number): Promise<void> {
    const exists = await FacultyStudentModel.findOne({ facultyId, studentId }).lean();
    if (!exists) {
      await FacultyStudentModel.create({ facultyId, studentId });
    }
  }

  async getAllStudents(): Promise<any[]> {
    const studentsList = await UserModel.find({ role: 'student' }).lean();
    const studentsWithPoints = await Promise.all(studentsList.map(async (student) => {
      const events = await EngagementEventModel.find({ studentId: student._id }).lean();
      const enrollments = await EnrollmentModel.find({ studentId: student._id }).lean();
      const enrolledCourseIds = enrollments.map(e => e.courseId);
      const enrolledCourses = await CourseModel.find({ _id: { $in: enrolledCourseIds } }).lean();

      const rawPoints = events.reduce((sum, e) => {
        if (e.eventType === 'video_watch') return sum + e.duration;
        if (e.eventType === 'quiz_complete') return sum + 10;
        if (e.eventType === 'assignment_submit') return sum + 8;
        if (e.eventType === 'login') return sum + 2;
        return sum;
      }, 0);

      // Dynamic possible points
      let possiblePoints = 2; // Baseline
      for (const course of enrolledCourses) {
        possiblePoints += (course.duration || 0);
        const taskCount = await TaskModel.countDocuments({ courseId: course._id });
        const quizCount = await QuizModel.countDocuments({ courseId: course._id });
        possiblePoints += (taskCount * 8) + (quizCount * 10);
      }
      
      const daysSet = new Set();
      events.forEach(e => {
        const d = new Date(e.timestamp);
        daysSet.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
      });
      const activeDays = daysSet.size;
      const engagementScore = Math.round((rawPoints / Math.max(possiblePoints, 1)) * 100);

      return { 
        ...this.mapDoc(student), 
        engagementScore, 
        points: rawPoints, 
        activeDays,
        maxPoints: possiblePoints
      };
    }));

    return studentsWithPoints;
  }

  async getLeaderboard(userId?: number, role?: string): Promise<any[]> {
    let studentIds: number[] = [];
    if (role === 'faculty' && userId) {
      const mappings = await FacultyStudentModel.find({ facultyId: userId }).lean();
      studentIds = [...new Set(mappings.map(m => m.studentId))];
    }

    const query = studentIds.length > 0 ? { _id: { $in: studentIds }, role: 'student' } : { role: 'student' };
    const studentsList = await UserModel.find(query).lean();
    
    const results = await Promise.all(studentsList.map(async (student) => {
      const events = await EngagementEventModel.find({ studentId: student._id }).lean();
      const enrollments = await EnrollmentModel.find({ studentId: student._id }).lean();
      const enrolledCourseIds = enrollments.map(e => e.courseId);
      const enrolledCourses = await CourseModel.find({ _id: { $in: enrolledCourseIds } }).lean();

      const rawPoints = events.reduce((sum, e) => {
        if (e.eventType === 'video_watch') return sum + e.duration;
        if (e.eventType === 'quiz_complete') return sum + 10;
        if (e.eventType === 'assignment_submit') return sum + 8;
        if (e.eventType === 'login') return sum + 2;
        return sum;
      }, 0);

      // Dynamic possible points
      let possiblePoints = 2; 
      for (const course of enrolledCourses) {
        possiblePoints += (course.duration || 0);
        const taskCount = await TaskModel.countDocuments({ courseId: course._id });
        const quizCount = await QuizModel.countDocuments({ courseId: course._id });
        possiblePoints += (taskCount * 8) + (quizCount * 10);
      }

      const avatarLetters = (student.name || '').split(' ').map((n: any) => n[0]).join('').toUpperCase().substring(0, 2);
      const engagementScore = Math.round((rawPoints / Math.max(possiblePoints, 1)) * 100);

      return {
        id: student._id,
        name: student.name,
        points: rawPoints,
        engagementScore, 
        avatarLetters,
        trend: engagementScore > 50 ? 'up' : 'down',
        maxPoints: possiblePoints
      };
    }));
    
    // Sort by points descending (or score, same ranking mostly)
    const sorted = results.sort((a, b) => (b.points || 0) - (a.points || 0));
    
    // Assign rank based on sorted order
    return sorted.map((s, index) => ({ ...s, rank: index + 1 }));
  }

  async getPlatformStats(): Promise<any> {
    const totalStudents = await UserModel.countDocuments({ role: 'student' });
    const totalFaculty = await UserModel.countDocuments({ role: 'faculty' });
    const totalCourses = await CourseModel.countDocuments();
    
    return { totalStudents, totalFaculty, totalCourses };
  }
}

export const storage = new DatabaseStorage();