import { db } from "./db";
import {
  users, courses, enrollments, engagementEvents,
  type User, type Course, type Enrollment, type EngagementEvent,
} from "@shared/schema";
import { eq, desc, sql } from "drizzle-orm";
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
  
  // Enrollments
  enrollStudent(studentId: number, courseId: number): Promise<Enrollment>;
  
  // Engagement
  logEvent(event: z.infer<typeof eventSchema>): Promise<EngagementEvent>;
  getStudentEvents(studentId: number): Promise<EngagementEvent[]>;
  getCourseEvents(courseId: number): Promise<EngagementEvent[]>;
  getAllEvents(): Promise<EngagementEvent[]>;
  
  // Instructor student management
  getStudentsByInstructor(instructorId: number): Promise<any[]>;
  removeStudentFromInstructor(studentId: number): Promise<void>;
  
  getPlatformStats(): Promise<any>;
}

export class DatabaseStorage implements IStorage {
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
  
  async getStudentsByInstructor(instructorId: number): Promise<any[]> {
    const instructorCourses = await db.select().from(courses).where(eq(courses.instructorId, instructorId));
    const courseIds = instructorCourses.map(c => c.id);
    
    if (courseIds.length === 0) return [];
    
    const studentList = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
    })
    .from(enrollments)
    .innerJoin(users, eq(enrollments.studentId, users.id))
    .where(
      sql`${enrollments.courseId} = ANY(${courseIds}::int[])`
    );
    
    const uniqueStudents = studentList.reduce((acc: any[], student: any) => {
      if (!acc.find(s => s.id === student.id)) {
        acc.push(student);
      }
      return acc;
    }, []);

    // Attach engagement scores
    const studentsWithScore = await Promise.all(
      uniqueStudents.map(async (student) => {
        const events = await this.getStudentEvents(student.id);
        const engagementScore = this.calculateEngagementScore(events);
        return { ...student, engagementScore };
      })
    );

    return studentsWithScore;
  }

  async removeStudentFromInstructor(studentId: number): Promise<void> {
    await db.delete(enrollments).where(eq(enrollments.studentId, studentId));
  }

  private calculateEngagementScore(events: EngagementEvent[]): number {
    if (events.length === 0) return 0;
    
    let score = 0;
    const eventCounts: { [key: string]: number } = {};
    
    events.forEach(event => {
      eventCounts[event.eventType] = (eventCounts[event.eventType] || 0) + 1;
    });
    
    score += (eventCounts['login'] || 0) * 2;
    score += (eventCounts['video_watch'] || 0) * 3;
    score += (eventCounts['quiz_submit'] || 0) * 10;
    score += (eventCounts['assignment_submit'] || 0) * 8;
    
    return Math.min(Math.round(score / 10), 100);
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