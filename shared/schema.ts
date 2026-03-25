import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["student", "faculty", "admin"]),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  role: z.enum(["student", "faculty", "admin"]).optional(),
});

export const eventSchema = z.object({
  studentId: z.number().optional(), 
  courseId: z.number().optional().default(0),
  eventType: z.enum(["video_watch", "quiz_submit", "course_open", "assignment_submit", "login"]),
  duration: z.number().optional().default(0),
});

export const userResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  role: z.string(),
  createdAt: z.union([z.string(), z.date()]).nullable(),
});

// TypeScript Interfaces to replace Drizzle's $inferSelect
export interface User {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  role: string;
  createdAt: Date | null;
}

export interface Course {
  id: number;
  title: string;
  description: string;
  videoUrl: string | null;
  duration: number | null;
  facultyId: number;
}

export interface Enrollment {
  id: number;
  studentId: number;
  courseId: number;
  progress: number;
}

export interface EngagementEvent {
  id: number;
  studentId: number;
  courseId: number;
  eventType: string;
  duration: number | null;
  timestamp: Date | null;
}

export interface FacultyStudent {
  id: number;
  facultyId: number;
  studentId: number;
}

export interface Quiz {
  id: number;
  courseId: number;
  title: string;
  description: string | null;
}

export interface QuizQuestion {
  id: number;
  quizId: number;
  questionText: string;
  options: string;
  correctOptionIndex: number;
}

export interface QuizSubmission {
  id: number;
  quizId: number;
  studentId: number;
  score: number;
  submittedAt: Date | null;
}

export interface Task {
  id: number;
  courseId: number;
  title: string;
  description: string;
  dueDate: Date | null;
}

export interface TaskSubmission {
  id: number;
  taskId: number;
  studentId: number;
  pdfUrl: string;
  submittedAt: Date | null;
  grade: number | null;
  feedback: string | null;
}
