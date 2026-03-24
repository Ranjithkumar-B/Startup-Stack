import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull(), // 'student', 'instructor', 'admin'
  createdAt: integer("created_at", { mode: "timestamp" }).default(new Date()),
});

export const courses = sqliteTable("courses", {
  id: integer("course_id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  videoUrl: text("video_url"),
  instructorId: integer("instructor_id").notNull(),
});

export const enrollments = sqliteTable("enrollments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  studentId: integer("student_id").notNull(),
  courseId: integer("course_id").notNull(),
  progress: integer("progress").notNull().default(0),
});

export const engagementEvents = sqliteTable("engagement_events", {
  id: integer("event_id").primaryKey({ autoIncrement: true }),
  studentId: integer("student_id").notNull(),
  courseId: integer("course_id").notNull(),
  eventType: text("event_type").notNull(), // video_watch, quiz_submit, course_open, assignment_submit, login
  duration: integer("duration").default(0),
  timestamp: integer("timestamp", { mode: "timestamp" }).default(new Date()),
});

export const instructorStudents = sqliteTable("instructor_students", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  instructorId: integer("instructor_id").notNull(),
  studentId: integer("student_id").notNull(),
});



export const quizzes = sqliteTable("quizzes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  courseId: integer("course_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
});

export const quizQuestions = sqliteTable("quiz_questions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  quizId: integer("quiz_id").notNull(),
  questionText: text("question_text").notNull(),
  options: text("options").notNull(), // JSON string array
  correctOptionIndex: integer("correct_option_index").notNull(),
});

export const quizSubmissions = sqliteTable("quiz_submissions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  quizId: integer("quiz_id").notNull(),
  studentId: integer("student_id").notNull(),
  score: integer("score").notNull(),
  submittedAt: integer("submitted_at", { mode: "timestamp" }).default(new Date()),
});

export const tasks = sqliteTable("tasks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  courseId: integer("course_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  dueDate: integer("due_date", { mode: "timestamp" }),
});

export const taskSubmissions = sqliteTable("task_submissions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  taskId: integer("task_id").notNull(),
  studentId: integer("student_id").notNull(),
  pdfUrl: text("pdf_url").notNull(),
  submittedAt: integer("submitted_at", { mode: "timestamp" }).default(new Date()),
});

export const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["student", "instructor", "admin"]),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const eventSchema = z.object({
  studentId: z.number().optional(), // Can be derived from auth token
  courseId: z.number().optional().default(0),
  eventType: z.enum(["video_watch", "quiz_submit", "course_open", "assignment_submit", "login"]),
  duration: z.number().optional().default(0),
});

export type User = typeof users.$inferSelect;
export type Course = typeof courses.$inferSelect;
export type Enrollment = typeof enrollments.$inferSelect;
export type EngagementEvent = typeof engagementEvents.$inferSelect;
export type InstructorStudent = typeof instructorStudents.$inferSelect;

export type Quiz = typeof quizzes.$inferSelect;
export type QuizQuestion = typeof quizQuestions.$inferSelect;
export type QuizSubmission = typeof quizSubmissions.$inferSelect;

export type Task = typeof tasks.$inferSelect;
export type TaskSubmission = typeof taskSubmissions.$inferSelect;

export const userResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  role: z.string(),
  createdAt: z.string().or(z.date()).nullable(),
});
