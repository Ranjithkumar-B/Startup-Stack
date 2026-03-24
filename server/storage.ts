import { db } from "./db";
import {
  users, courses, enrollments, engagementEvents, instructorStudents,
  quizzes, quizQuestions, quizSubmissions,
  type User, type Course, type Enrollment, type EngagementEvent,
  type Quiz, type QuizQuestion, type QuizSubmission,
} from "@shared/schema";
import { eq, desc, sql, inArray, and } from "drizzle-orm";
import type { z } from "zod";
import type { registerSchema, eventSchema } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: z.infer<typeof registerSchema> & { passwordHash: string }): Promise<User>;
  
  // Courses
  getCourses(): Promise<Course[]>;
  getCoursesByInstructor(instructorId: number): Promise<Course[]>;
  getEnrolledCourses(studentId: number): Promise<(Course & { progress: number })[]>;
  createCourse(course: Omit<Course, "id">): Promise<Course>;
  deleteCourse(id: number): Promise<void>;
  
  // Enrollments
  enrollStudent(studentId: number, courseId: number): Promise<Enrollment>;
  
  // Engagement
  logEvent(event: z.infer<typeof eventSchema>): Promise<EngagementEvent>;
  getStudentEvents(studentId: number): Promise<EngagementEvent[]>;
  getCourseEvents(courseId: number): Promise<EngagementEvent[]>;
  getAllEvents(): Promise<EngagementEvent[]>;
  
  // Quizzes
  getQuiz(id: number): Promise<Quiz | undefined>;
  createQuiz(quiz: Omit<Quiz, "id">): Promise<Quiz>;
  deleteQuiz(id: number): Promise<void>;
  createQuizQuestion(question: Omit<QuizQuestion, "id">): Promise<QuizQuestion>;
  getQuizzesByCourse(courseId: number): Promise<Quiz[]>;
  getQuizQuestions(quizId: number): Promise<QuizQuestion[]>;
  submitQuiz(submission: Omit<QuizSubmission, "id" | "submittedAt">): Promise<QuizSubmission>;
  getQuizSubmissions(studentId: number, courseId?: number): Promise<QuizSubmission[]>;
  

  
  // Instructor student management
  getStudentsByInstructor(instructorId: number): Promise<any[]>;
  removeStudentFromInstructor(instructorId: number, studentId: number): Promise<void>;
  linkInstructorStudent(instructorId: number, studentId: number): Promise<void>;
  
  // Admin student management
  getAllStudents(): Promise<any[]>;
  getLeaderboard(userId?: number, role?: string): Promise<any[]>;
  
  getPlatformStats(): Promise<any>;
}

export class DatabaseStorage implements IStorage {
// ... omitting unchanged parts ...

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: z.infer<typeof registerSchema> & { passwordHash: string }): Promise<User> {
    const [user] = await db.insert(users).values({
      name: userData.name,
      email: userData.email,
      passwordHash: userData.passwordHash,
      role: userData.role,
    }).returning();
    return user;
  }

  async getCourses(): Promise<Course[]> {
    return await db.select().from(courses);
  }

  async getCoursesByInstructor(instructorId: number): Promise<Course[]> {
    return await db.select().from(courses).where(eq(courses.instructorId, instructorId));
  }

  async getEnrolledCourses(studentId: number): Promise<(Course & { progress: number })[]> {
    const results = await db.select({
      course: courses,
      progress: enrollments.progress,
    })
    .from(enrollments)
    .innerJoin(courses, eq(enrollments.courseId, courses.id))
    .where(eq(enrollments.studentId, studentId));
    
    return results.map(r => ({ ...r.course, progress: r.progress }));
  }

  async createCourse(course: Omit<Course, "id">): Promise<Course> {
    const [newCourse] = await db.insert(courses).values(course).returning();
    return newCourse;
  }

  async deleteCourse(id: number): Promise<void> {
    await db.delete(engagementEvents).where(eq(engagementEvents.courseId, id));
    await db.delete(enrollments).where(eq(enrollments.courseId, id));
    await db.delete(courses).where(eq(courses.id, id));
  }

  async enrollStudent(studentId: number, courseId: number): Promise<Enrollment> {
    const [enrollment] = await db.insert(enrollments).values({ studentId, courseId }).returning();
    return enrollment;
  }

  async logEvent(event: z.infer<typeof eventSchema>): Promise<EngagementEvent> {
    const [newEvent] = await db.insert(engagementEvents).values({
      studentId: event.studentId!,
      courseId: event.courseId,
      eventType: event.eventType,
      duration: event.duration || 0,
    }).returning();
    return newEvent;
  }

  async getStudentEvents(studentId: number): Promise<EngagementEvent[]> {
    return await db.select().from(engagementEvents).where(eq(engagementEvents.studentId, studentId)).orderBy(desc(engagementEvents.timestamp));
  }

  async getCourseEvents(courseId: number): Promise<EngagementEvent[]> {
    return await db.select().from(engagementEvents).where(eq(engagementEvents.courseId, courseId)).orderBy(desc(engagementEvents.timestamp));
  }

  async getAllEvents(): Promise<EngagementEvent[]> {
    return await db.select().from(engagementEvents).orderBy(desc(engagementEvents.timestamp));
  }
  
  // Quizzes
  async getQuiz(id: number): Promise<Quiz | undefined> {
    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, id));
    return quiz;
  }

  async createQuiz(quiz: Omit<Quiz, "id">): Promise<Quiz> {
    const [newQuiz] = await db.insert(quizzes).values(quiz).returning();
    return newQuiz;
  }

  async deleteQuiz(id: number): Promise<void> {
    await db.delete(quizQuestions).where(eq(quizQuestions.quizId, id));
    await db.delete(quizSubmissions).where(eq(quizSubmissions.quizId, id));
    await db.delete(quizzes).where(eq(quizzes.id, id));
  }

  async createQuizQuestion(question: Omit<QuizQuestion, "id">): Promise<QuizQuestion> {
    const [newQuestion] = await db.insert(quizQuestions).values(question).returning();
    return newQuestion;
  }

  async getQuizzesByCourse(courseId: number): Promise<Quiz[]> {
    return await db.select().from(quizzes).where(eq(quizzes.courseId, courseId));
  }

  async getQuizQuestions(quizId: number): Promise<QuizQuestion[]> {
    return await db.select().from(quizQuestions).where(eq(quizQuestions.quizId, quizId));
  }

  async submitQuiz(submission: Omit<QuizSubmission, "id" | "submittedAt">): Promise<QuizSubmission> {
    const [newSubmission] = await db.insert(quizSubmissions).values(submission).returning();
    return newSubmission;
  }

  async getQuizSubmissions(studentId: number, courseId?: number): Promise<QuizSubmission[]> {
    const conditions = [eq(quizSubmissions.studentId, studentId)];
    if (courseId) {
      conditions.push(eq(quizzes.courseId, courseId));
    }
    
    const results = await db.select({
      submission: quizSubmissions,
      quiz: quizzes,
    }).from(quizSubmissions)
      .innerJoin(quizzes, eq(quizSubmissions.quizId, quizzes.id))
      .where(and(...conditions));
      
    return results.map(r => ({ ...r.submission }));
  }


  
  async linkInstructorStudent(instructorId: number, studentId: number): Promise<void> {
    const existing = await db.select().from(instructorStudents)
      .where(and(eq(instructorStudents.instructorId, instructorId), eq(instructorStudents.studentId, studentId)));
    
    if (existing.length === 0) {
      await db.insert(instructorStudents).values({ instructorId, studentId });
    }
  }

  async getStudentsByInstructor(instructorId: number): Promise<any[]> {
    const studentList = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
    })
    .from(instructorStudents)
    .innerJoin(users, eq(instructorStudents.studentId, users.id))
    .where(eq(instructorStudents.instructorId, instructorId));
    
    let maxPoints = 1;
    for (const student of studentList) {
       const evs = await this.getStudentEvents(student.id);
       const pts = this.calculateEngagementScore(evs);
       if (pts > maxPoints) maxPoints = pts;
    }

    // Attach engagement scores
    const studentsWithScore = await Promise.all(
      studentList.map(async (student) => {
        const events = await this.getStudentEvents(student.id);
        const rawPoints = this.calculateEngagementScore(events);
        const engagementScore = Math.round((rawPoints / maxPoints) * 100);
        return { ...student, engagementScore, points: rawPoints };
      })
    );

    return studentsWithScore;
  }

  async getAllStudents(): Promise<any[]> {
    const studentList = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
    })
    .from(users)
    .where(eq(users.role, 'student'));
    
    let maxPoints = 1;
    for (const student of studentList) {
       const evs = await this.getStudentEvents(student.id);
       const pts = this.calculateEngagementScore(evs);
       if (pts > maxPoints) maxPoints = pts;
    }

    // Attach engagement scores
    const studentsWithScore = await Promise.all(
      studentList.map(async (student) => {
        const events = await this.getStudentEvents(student.id);
        const rawPoints = this.calculateEngagementScore(events);
        const engagementScore = Math.round((rawPoints / maxPoints) * 100);
        return { ...student, engagementScore, points: rawPoints };
      })
    );

    return studentsWithScore;
  }

  async getLeaderboard(userId?: number, role?: string): Promise<any[]> {
    let students: any[] = [];
    if (role === 'instructor' && userId) {
      students = await this.getStudentsByInstructor(userId);
    } else if (role === 'student' && userId) {
      const [instructorLink] = await db.select()
        .from(instructorStudents)
        .where(eq(instructorStudents.studentId, userId))
        .limit(1);
      
      if (instructorLink) {
        students = await this.getStudentsByInstructor(instructorLink.instructorId);
      } else {
        students = [];
      }
    } else {
      students = await this.getAllStudents();
    }
    
    const ranked = students
      .filter(s => s.points > 0)
      .sort((a, b) => b.points - a.points)
      .slice(0, 10)
      .map((s, idx) => ({
        id: s.id,
        name: s.name,
        engagementScore: s.points, // Use raw points for leaderboard
        points: s.points,
        rank: idx + 1,
        avatarLetters: s.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase(),
      }));
    return ranked;
  }

  async removeStudentFromInstructor(instructorId: number, studentId: number): Promise<void> {
    await db.delete(instructorStudents)
      .where(
        and(
          eq(instructorStudents.instructorId, instructorId),
          eq(instructorStudents.studentId, studentId)
        )
      );
      
    const courses = await this.getCoursesByInstructor(instructorId);
    if (courses.length > 0) {
      const courseIds = courses.map(c => c.id);
      
      await db.delete(enrollments)
        .where(
          and(
            eq(enrollments.studentId, studentId),
            inArray(enrollments.courseId, courseIds)
          )
        );
        
      const qs = await db.select({ id: quizzes.id }).from(quizzes).where(inArray(quizzes.courseId, courseIds));
      const quizIds = qs.map(q => q.id);
      
      if (quizIds.length > 0) {
        await db.delete(quizSubmissions)
          .where(
            and(
              eq(quizSubmissions.studentId, studentId),
              inArray(quizSubmissions.quizId, quizIds)
            )
          );
      }
    }
    
    // Completely wipe out engagement events (including 'login' events without course associations)
    await db.delete(engagementEvents).where(eq(engagementEvents.studentId, studentId));
  }

  private calculateEngagementScore(events: EngagementEvent[]): number {
    if (events.length === 0) return 0;
    
    let score = 0;
    events.forEach(event => {
      if (event.eventType === 'login') score += 2;
      else if (event.eventType === 'video_watch') score += 3;
      else if (event.eventType === 'quiz_submit') score += 10;
      else if (event.eventType === 'assignment_submit') score += 8;
    });
    
    return Math.round(score);
  }

  async getPlatformStats(): Promise<any> {
    const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
    const [courseCount] = await db.select({ count: sql<number>`count(*)` }).from(courses);
    const [eventCount] = await db.select({ count: sql<number>`count(*)` }).from(engagementEvents);
    
    return {
      totalUsers: userCount.count,
      totalCourses: courseCount.count,
      totalEvents: eventCount.count,
    };
  }
}

export const storage = new DatabaseStorage();