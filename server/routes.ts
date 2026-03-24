import type { Express, Request, Response, NextFunction } from "express";
import { Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { eq, inArray } from "drizzle-orm";
import { db } from "./db";
import { users, instructorStudents, tasks, taskSubmissions, enrollments, courses } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";
import express from "express";

const dataDir = process.env.DATA_DIR || process.cwd();
const uploadDir = path.join(dataDir, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storageEngine = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storageEngine });

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
  app.use('/uploads', express.static(uploadDir));

  const io = new SocketIOServer(httpServer, {
    path: "/ws",
    cors: { origin: "*" }
  });

  io.on("connection", (socket) => {
    socket.on("student_action", async (data) => {
      io.emit("student_active", data);
    });
    socket.on("realtime_quiz", (data) => {
      io.emit("realtime_quiz", data);
    });
    socket.on("realtime_answer", (data) => {
      io.emit("realtime_answer", data);
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
      
      if (user.role === 'student') {
        await storage.logEvent({
          studentId: user.id,
          courseId: 0,
          eventType: 'login',
          duration: 0,
        });
      }

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
      if (user.role === 'student') {
        const recentEvents = await storage.getStudentEvents(user.id);
        const today = new Date();
        const hasLoggedToday = recentEvents.some(e => {
          if (e.eventType !== 'login' || !e.timestamp) return false;
          const eDate = new Date(e.timestamp);
          return eDate.getDate() === today.getDate() && 
                 eDate.getMonth() === today.getMonth() && 
                 eDate.getFullYear() === today.getFullYear();
        });

        if (!hasLoggedToday) {
          await storage.logEvent({
            studentId: user.id,
            courseId: 0,
            eventType: 'login',
            duration: 0,
          });
        }
      }

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
      const students = await storage.getStudentsByInstructor(req.user.id);
      
      const input = api.courses.create.input.parse(req.body);
      const { videoUrl, ...rest } = input;
      const course = await storage.createCourse({ 
        ...rest, 
        videoUrl: videoUrl || null,
        instructorId: req.user.id 
      });
      
      if (students.length > 0) {
        await Promise.all(students.map(s => storage.enrollStudent(s.id, course.id)));
      }
      
      res.status(201).json(course);
    } catch (err) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  app.delete('/api/courses/:id', requireAuth, async (req, res) => {
    if (req.user.role !== 'instructor' && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Forbidden" });
    }
    try {
      const courseId = Number(req.params.id);
      
      // If instructor, verify they own the course
      if (req.user.role === 'instructor') {
        const courses = await storage.getCoursesByInstructor(req.user.id);
        if (!courses.find(c => c.id === courseId)) {
          return res.status(403).json({ message: "Forbidden" });
        }
      }
      
      await storage.deleteCourse(courseId);
      res.json({ message: "Course deleted successfully" });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete course" });
    }
  });



  // Quizzes API
  app.get('/api/courses/:id/quizzes', requireAuth, async (req, res) => {
    try {
      const courseId = Number(req.params.id);
      const quizzes = await storage.getQuizzesByCourse(courseId);
      
      if (req.user.role === 'student') {
        const submissions = await storage.getQuizSubmissions(req.user.id, courseId);
        const enrichedQuizzes = quizzes.map(q => {
          const sub = submissions.find(s => s.quizId === q.id);
          return { ...q, score: sub?.score, isSubmitted: !!sub };
        });
        return res.json(enrichedQuizzes);
      }
      
      res.json(quizzes.map(q => ({ ...q, isSubmitted: false })));
    } catch (err) {
      res.status(500).json({ message: "Failed to load quizzes" });
    }
  });

  app.post('/api/courses/:id/quizzes', requireAuth, async (req, res) => {
    if (req.user.role !== 'instructor' && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Forbidden" });
    }
    const courseId = Number(req.params.id);
    const { title, description } = req.body;
    try {
      const quiz = await storage.createQuiz({ courseId, title, description });
      res.status(201).json(quiz);
    } catch (err) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  app.delete('/api/quizzes/:id', requireAuth, async (req, res) => {
    if (req.user.role !== 'instructor' && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Forbidden" });
    }
    try {
      await storage.deleteQuiz(Number(req.params.id));
      res.json({ message: "Quiz deleted successfully" });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete quiz" });
    }
  });

  app.get('/api/quizzes/:id/questions', requireAuth, async (req, res) => {
    const quizId = Number(req.params.id);
    try {
      const questions = await storage.getQuizQuestions(quizId);
      if (req.user.role === 'student') {
         res.json(questions.map(q => ({ 
           id: q.id, 
           quizId: q.quizId, 
           questionText: q.questionText, 
           options: q.options 
         })));
         return;
      }
      res.json(questions);
    } catch (err) {
      res.status(500).json({ message: "Failed to load questions" });
    }
  });

  app.post('/api/quizzes/:id/questions', requireAuth, async (req, res) => {
    if (req.user.role !== 'instructor' && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Forbidden" });
    }
    const quizId = Number(req.params.id);
    const { questionText, options, correctOptionIndex } = req.body;
    try {
      const question = await storage.createQuizQuestion({ 
        quizId, 
        questionText, 
        options: typeof options === 'string' ? options : JSON.stringify(options), 
        correctOptionIndex 
      });
      res.status(201).json(question);
    } catch (err) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  app.post('/api/quizzes/:id/submit', requireAuth, async (req, res) => {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: "Forbidden" });
    }
    const quizId = Number(req.params.id);
    const { answers } = req.body; 
    try {
      const quiz = await storage.getQuiz(quizId);
      if (!quiz) return res.status(404).json({ message: "Quiz not found" });

      const questions = await storage.getQuizQuestions(quizId);
      if (questions.length === 0) {
        return res.status(400).json({ message: "Quiz has no questions" });
      }

      let correctCount = 0;
      questions.forEach((q) => {
        if (answers[q.id] === q.correctOptionIndex) {
          correctCount++;
        }
      });
      
      const percentage = Math.round((correctCount / questions.length) * 100);
      
      const submission = await storage.submitQuiz({
        quizId,
        studentId: req.user.id,
        score: percentage,
      });
      
      await storage.logEvent({ 
        studentId: req.user.id, 
        courseId: quiz.courseId, 
        eventType: "quiz_submit", 
        duration: 10 
      });
      
      res.status(201).json(submission);
    } catch (err) {
      res.status(400).json({ message: "Invalid request" });
    }
  });

  // Engagement
  app.post(api.engagement.log.path, requireAuth, async (req, res) => {
    try {
      const input = api.engagement.log.input.parse(req.body);
      input.studentId = req.user.id;
      
      if (input.eventType === "video_watch") {
        const events = await storage.getStudentEvents(req.user.id);
        const alreadyWatched = events.some(e => e.eventType === "video_watch" && e.courseId === input.courseId);
        if (alreadyWatched) {
          return res.status(400).json({ message: "You have already earned points for this video" });
        }
      }

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
  app.get('/api/engagement/student/:id', requireAuth, async (req, res) => {
    const studentId = Number(req.params.id);
    if (req.user.role === 'student' && req.user.id !== studentId) {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    const events = await storage.getStudentEvents(studentId);
    let score = 0;
    
    events.forEach(event => {
       if (event.eventType === 'login') score += 2;
       else if (event.eventType === 'video_watch') score += 3;
       else if (event.eventType === 'quiz_submit') score += 10;
       else if (event.eventType === 'assignment_submit') score += 8;
    });
    score = Math.round(score);
    
    const streak = events.length > 0 ? 3 : 0;
    const hours = (events.reduce((acc, curr) => acc + (curr.duration || 0), 0) / 60).toFixed(1);
    
    const enrolledCourses = await storage.getEnrolledCourses(studentId);
    const courses = enrolledCourses.length;
    
    const history = [
      { name: 'Mon', score: Math.max(0, score - 20) },
      { name: 'Tue', score: Math.max(0, score - 15) },
      { name: 'Wed', score: Math.max(0, score - 10) },
      { name: 'Thu', score: Math.max(0, score - 5) },
      { name: 'Fri', score: score },
    ];

    const breakdown = {
      logins: events.filter(e => e.eventType === 'login').length,
      videoWatches: events.filter(e => e.eventType === 'video_watch').length,
      quizzes: events.filter(e => e.eventType === 'quiz_submit').length,
      assignments: events.filter(e => e.eventType === 'assignment_submit').length,
    };

    let instructorName = null;
    const [instructorLink] = await db.select()
      .from(instructorStudents)
      .where(eq(instructorStudents.studentId, studentId))
      .limit(1);
      
    if (instructorLink) {
       const [instructorUser] = await db.select().from(users).where(eq(users.id, instructorLink.instructorId));
       if (instructorUser) { instructorName = instructorUser.name; }
    }

    res.json({ score, hours, courses, streak, history, recentEvents: events.slice(0, 5), breakdown, instructorName });
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
      const systemTrend = [
        { name: 'Mon', logins: Math.max(0, stats.totalEvents - 10) },
        { name: 'Tue', logins: Math.max(0, stats.totalEvents - 8) },
        { name: 'Wed', logins: Math.max(0, stats.totalEvents - 5) },
        { name: 'Thu', logins: Math.max(0, stats.totalEvents - 3) },
        { name: 'Fri', logins: stats.totalEvents },
      ];
      res.json({ ...stats, systemTrend });
    } else if (req.user.role === 'instructor') {
      const students = await storage.getStudentsByInstructor(req.user.id);
      const courses = await storage.getCoursesByInstructor(req.user.id);
      
      const totalStudents = students.length;
      const activeCourses = courses.length;
      
      let totalScore = 0;
      let atRisk = 0;
      let distribution = [
        { name: 'High', students: 0, fill: 'hsl(var(--accent))' },
        { name: 'Medium', students: 0, fill: 'hsl(var(--primary))' },
        { name: 'Low', students: 0, fill: 'hsl(var(--destructive))' },
      ];

      students.forEach(s => {
        const score = s.engagementScore || 0;
        totalScore += score;
        if (score < 40) {
           atRisk++;
           distribution[2].students++;
        } else if (score < 75) {
           distribution[1].students++;
        } else {
           distribution[0].students++;
        }
      });
      
      const avgEngagement = totalStudents > 0 ? Math.round(totalScore / totalStudents) : 0;
      
      let allEvents: any[] = [];
      for (const student of students) {
         const events = await storage.getStudentEvents(student.id);
         const mapped = events.slice(0, 5).map(e => ({
           studentId: student.id,
           studentName: student.name,
           courseId: e.courseId,
           eventType: e.eventType,
           timestamp: e.timestamp
         }));
         allEvents = [...allEvents, ...mapped];
      }
      allEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      const recentEvents = allEvents.slice(0, 5);
      
      res.json({ totalStudents, activeCourses, avgEngagement, atRisk, distribution, recentEvents });
    } else {
      res.json({});
    }
  });

  app.get('/api/analytics/leaderboard', requireAuth, async (req, res) => {
    try {
      const leaderboard = await storage.getLeaderboard(req.user.id, req.user.role);
      res.json(leaderboard);
    } catch (err) {
      res.status(500).json({ message: "Failed to load leaderboard" });
    }
  });

  // Instructor student management
  app.get('/api/instructor/students', requireAuth, async (req, res) => {
    if (req.user.role !== 'instructor') {
      return res.status(403).json({ message: "Only instructors can manage students" });
    }
    try {
      const students = await storage.getStudentsByInstructor(req.user.id);
      res.json(students);
    } catch (err) {
      res.status(500).json({ message: "Failed to load students" });
    }
  });

  app.get('/api/admin/students', requireAuth, async (req, res) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Only admins can view students" });
    }
    try {
      const students = await storage.getAllStudents();
      res.json(students);
    } catch (err) {
      res.status(500).json({ message: "Failed to load students" });
    }
  });

  app.post('/api/instructor/add-student', requireAuth, async (req, res) => {
    if (req.user.role !== 'instructor') {
      return res.status(403).json({ message: "Only instructors can add students" });
    }
    try {
      const { email, name } = req.body;
      if (!email || !name) {
        return res.status(400).json({ message: "Email and name are required" });
      }

      let student = await storage.getUserByEmail(email);
      if (!student) {
        const defaultPass = await bcrypt.hash("DefaultPass123", 10);
        student = await storage.createUser({ 
          name, 
          email, 
          password: "DefaultPass123",
          role: "student", 
          passwordHash: defaultPass 
        });
      }

      await storage.linkInstructorStudent(req.user.id, student.id);

      const courses = await storage.getCoursesByInstructor(req.user.id);
      if (courses.length > 0) {
        await Promise.all(courses.map(c => storage.enrollStudent(student.id, c.id)));
      }

      res.status(201).json({ message: "Student added successfully", student: { id: student.id, name: student.name, email: student.email } });
    } catch (err) {
      res.status(500).json({ message: "Failed to add student" });
    }
  });

  app.delete('/api/instructor/students/:id', requireAuth, async (req, res) => {
    if (req.user.role !== 'instructor') {
      return res.status(403).json({ message: "Only instructors can remove students" });
    }
    try {
      const studentId = Number(req.params.id);
      await storage.removeStudentFromInstructor(req.user.id, studentId);
      res.json({ message: "Student removed successfully" });
    } catch (err) {
      res.status(500).json({ message: "Failed to remove student" });
    }
  });

  // --- TASKS API ---
  app.get('/api/tasks', requireAuth, async (req, res) => {
    try {
      if (req.user.role === 'instructor') {
        const instCourses = await storage.getCoursesByInstructor(req.user.id);
        if (instCourses.length === 0) return res.json([]);
        const cIds = instCourses.map(c => c.id);
        const instTasks = await db.select().from(tasks).where(inArray(tasks.courseId, cIds));
        res.json(instTasks);
      } else if (req.user.role === 'student') {
        const enr = await db.select().from(enrollments).where(eq(enrollments.studentId, req.user.id));
        if (enr.length === 0) return res.json([]);
        const cIds = enr.map(e => e.courseId);
        const stTasks = await db.select().from(tasks).where(inArray(tasks.courseId, cIds));
        res.json(stTasks);
      } else {
        res.json([]);
      }
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.get('/api/tasks/submissions', requireAuth, async (req, res) => {
    if (req.user.role !== 'instructor') return res.status(403).json({ message: "Instructor only" });
    try {
      const instCourses = await storage.getCoursesByInstructor(req.user.id);
      if (instCourses.length === 0) return res.json([]);
      const cIds = instCourses.map(c => c.id);
      
      const teacherTasks = await db.select({ id: tasks.id }).from(tasks).where(inArray(tasks.courseId, cIds));
      if (teacherTasks.length === 0) return res.json([]);
      const taskIds = teacherTasks.map(t => t.id);
      
      const subs = await db.select({
        id: taskSubmissions.id,
        taskId: taskSubmissions.taskId,
        pdfUrl: taskSubmissions.pdfUrl,
        submittedAt: taskSubmissions.submittedAt,
        studentName: users.name
      })
      .from(taskSubmissions)
      .innerJoin(users, eq(users.id, taskSubmissions.studentId))
      .where(inArray(taskSubmissions.taskId, taskIds));
      
      res.json(subs);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch submissions" });
    }
  });

  app.post('/api/tasks', requireAuth, async (req, res) => {
    if (req.user.role !== 'instructor') return res.status(403).json({ message: "Instructor only" });
    try {
      const { courseId, title, description } = req.body;
      const [newTask] = await db.insert(tasks).values({
        courseId, title, description
      }).returning();
      res.status(201).json(newTask);
    } catch (err) {
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.post('/api/tasks/:id/submit', requireAuth, upload.single('pdf'), async (req, res) => {
    if (req.user.role !== 'student') return res.status(403).json({ message: "Student only" });
    try {
      const taskId = Number(req.params.id);
      let pdfUrl = req.body.pdfUrl;
      
      if (req.file) {
        pdfUrl = '/uploads/' + req.file.filename;
      }
      
      if (!pdfUrl) {
        return res.status(400).json({ message: "PDF file is required" });
      }

      const [newSub] = await db.insert(taskSubmissions).values({
        taskId, studentId: req.user.id, pdfUrl
      }).returning();
      
      const [taskReq] = await db.select().from(tasks).where(eq(tasks.id, taskId));
      if (taskReq) {
        await storage.logEvent({
          studentId: req.user.id,
          courseId: taskReq.courseId,
          eventType: 'assignment_submit',
          duration: 30
        });
      }
      res.status(201).json(newSub);
    } catch (err) {
      console.error("Upload Error:", err);
      res.status(500).json({ message: "Failed to submit task" });
    }
  });

  app.delete('/api/tasks/:id', requireAuth, async (req, res) => {
    if (req.user.role !== 'instructor') return res.status(403).json({ message: "Instructor only" });
    try {
      const taskId = Number(req.params.id);
      
      // Delete submissions first (foreign key integrity)
      await db.delete(taskSubmissions).where(eq(taskSubmissions.taskId, taskId));
      
      // Delete the actual task
      await db.delete(tasks).where(eq(tasks.id, taskId));
      
      res.json({ message: "Task deleted successfully" });
    } catch (err) {
      console.error("Delete Task Error:", err);
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  return httpServer;
}