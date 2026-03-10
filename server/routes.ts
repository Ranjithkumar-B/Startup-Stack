import type { Express, Request, Response, NextFunction } from "express";
import { Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { db } from "./db";
import { users } from "@shared/schema";

const JWT_SECRET = process.env.SESSION_SECRET || "fallback_secret_for_jwt_auth_123";

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return next();
  }
  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
  } catch (err) {
  }
  next();
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.use(authMiddleware);

  const io = new SocketIOServer(httpServer, {
    path: "/ws",
    cors: { origin: "*" }
  });

  io.on("connection", (socket) => {
    socket.on("student_action", async (data) => {
      io.emit("student_active", data);
    });
  });

  // Auth routes
  app.post(api.auth.register.path, async (req, res) => {
    try {
      const input = api.auth.register.input.parse(req.body);
      const existingUser = await storage.getUserByEmail(input.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use", field: "email" });
      }
      const passwordHash = await bcrypt.hash(input.password, 10);
      const user = await storage.createUser({ ...input, passwordHash });
      const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
      
      const { passwordHash: _, ...safeUser } = user;
      res.status(201).json({ token, user: safeUser });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.auth.login.path, async (req, res) => {
    try {
      const input = api.auth.login.input.parse(req.body);
      const user = await storage.getUserByEmail(input.email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const isValid = await bcrypt.compare(input.password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
      const { passwordHash: _, ...safeUser } = user;
      res.status(200).json({ token, user: safeUser });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.auth.me.path, requireAuth, async (req, res) => {
    const user = await storage.getUser(req.user.id);
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    const { passwordHash: _, ...safeUser } = user;
    res.status(200).json(safeUser);
  });

  // Courses
  app.get(api.courses.list.path, requireAuth, async (req, res) => {
    let result = [];
    if (req.user.role === 'student') {
      result = await storage.getEnrolledCourses(req.user.id);
    } else if (req.user.role === 'instructor') {
      result = await storage.getCoursesByInstructor(req.user.id);
    } else {
      result = await storage.getCourses();
    }
    res.json(result);
  });

  app.post(api.courses.create.path, requireAuth, async (req, res) => {
    if (req.user.role !== 'instructor' && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Forbidden" });
    }
    try {
      const input = api.courses.create.input.parse(req.body);
      const course = await storage.createCourse({ ...input, instructorId: req.user.id });
      res.status(201).json(course);
    } catch (err) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  // Engagement
  app.post(api.engagement.log.path, requireAuth, async (req, res) => {
    try {
      const input = api.engagement.log.input.parse(req.body);
      input.studentId = req.user.id;
      const event = await storage.logEvent(input);
      
      const user = await storage.getUser(req.user.id);
      
      io.emit("student_active", {
        studentId: req.user.id,
        studentName: user?.name || "Student",
        courseId: input.courseId,
        eventType: input.eventType
      });
      
      res.status(201).json(event);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal error" });
    }
  });
  
  app.get('/api/analytics/course/:id', requireAuth, async (req, res) => {
    const events = await storage.getCourseEvents(Number(req.params.id));
    res.json({ events });
  });

  app.get('/api/analytics/dashboard', requireAuth, async (req, res) => {
    if (req.user.role === 'student') {
      const events = await storage.getStudentEvents(req.user.id);
      res.json({ events });
    } else if (req.user.role === 'admin') {
      const stats = await storage.getPlatformStats();
      res.json(stats);
    } else {
      res.json({});
    }
  });

  // Seed Data
  async function seed() {
    const allUsers = await db.select().from(users);
    if (allUsers.length === 0) {
      const adminPass = await bcrypt.hash("admin123", 10);
      const studentPass = await bcrypt.hash("student123", 10);
      const instructorPass = await bcrypt.hash("instructor123", 10);
      
      const admin = await storage.createUser({ name: "Admin User", email: "admin@platform.com", password: "123", role: "admin", passwordHash: adminPass });
      const instructor = await storage.createUser({ name: "Instructor Bob", email: "instructor@platform.com", password: "123", role: "instructor", passwordHash: instructorPass });
      const student = await storage.createUser({ name: "Student Alice", email: "student@platform.com", password: "123", role: "student", passwordHash: studentPass });
      
      const course1 = await storage.createCourse({ title: "Introduction to React", description: "Learn React from scratch", instructorId: instructor.id });
      const course2 = await storage.createCourse({ title: "Advanced Node.js", description: "Master backend development", instructorId: instructor.id });
      
      await storage.enrollStudent(student.id, course1.id);
      
      await storage.logEvent({ studentId: student.id, courseId: course1.id, eventType: "login", duration: 0 });
      await storage.logEvent({ studentId: student.id, courseId: course1.id, eventType: "video_watch", duration: 15 });
      await storage.logEvent({ studentId: student.id, courseId: course1.id, eventType: "quiz_submit", duration: 0 });
    }
  }
  
  seed().catch(console.error);

  return httpServer;
}