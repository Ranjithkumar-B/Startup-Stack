import type { Express, Request, Response, NextFunction } from "express";
import { Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { TaskModel, TaskSubmissionModel, UserModel, EnrollmentModel, FacultyStudentModel, QuizModel, CourseModel } from "./models";
import multer from "multer";
import path from "path";
import fs from "fs";
import express from "express";
import { format, subDays, eachDayOfInterval, isSameDay, differenceInDays } from "date-fns";

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

const upload = multer({ 
  storage: storageEngine,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /pdf/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed!'));
    }
  }
});

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

      if (input.role && user.role !== input.role) {
        return res.status(403).json({ 
          message: `This account is registered as a ${user.role}. Please log in through the correct workspace.` 
        });
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
    console.log(`[GET /api/courses] User ID: ${req.user.id}, Role: ${req.user.role}`);
    let result = [];
    if (req.user.role === 'student') {
      result = await storage.getEnrolledCourses(req.user.id);
    } else if (req.user.role === 'faculty') {
      result = await storage.getCoursesByFaculty(req.user.id);
    } else {
      result = await storage.getCourses();
    }
    res.json(result);
  });

  app.post(api.courses.create.path, requireAuth, async (req, res) => {
    if (req.user.role !== 'faculty' && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Forbidden" });
    }
    try {
      const students = await storage.getStudentsByFaculty(req.user.id);
      
      const input = api.courses.create.input.parse(req.body);
      const { videoUrl, ...rest } = input;
      const course = await storage.createCourse({ 
        ...rest, 
        videoUrl: videoUrl || null,
        duration: input.duration ?? 0,
        facultyId: req.user.id 
      });
      
      if (students.length > 0) {
        await Promise.all(students.map(s => storage.enrollStudent(s.id, course.id)));
      }
      
      res.status(201).json(course);
    } catch (err) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  app.put('/api/courses/:id', requireAuth, async (req, res) => {
    if (req.user.role !== 'faculty' && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Forbidden" });
    }
    try {
      const courseId = Number(req.params.id);
      
      if (req.user.role === 'faculty') {
        const courses = await storage.getCoursesByFaculty(req.user.id);
        if (!courses.find(c => c.id === courseId)) {
          return res.status(403).json({ message: "Forbidden" });
        }
      }
      
      const input = api.courses.create.input.partial().parse(req.body);
      const course = await storage.updateCourse(courseId, input);
      res.json(course);
    } catch (err) {
      res.status(400).json({ message: "Invalid input or course not found" });
    }
  });

  app.delete('/api/courses/:id', requireAuth, async (req, res) => {
    if (req.user.role !== 'faculty' && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Forbidden" });
    }
    try {
      const courseId = Number(req.params.id);
      
      // If faculty, verify they own the course
      if (req.user.role === 'faculty') {
        const courses = await storage.getCoursesByFaculty(req.user.id);
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
    if (req.user.role !== 'faculty' && req.user.role !== 'admin') {
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
    if (req.user.role !== 'faculty' && req.user.role !== 'admin') {
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
    if (req.user.role !== 'faculty' && req.user.role !== 'admin') {
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
    const enrollments = await EnrollmentModel.find({ studentId }).lean();
    const enrolledCourseIds = enrollments.map(e => e.courseId);
    const enrolledCourses = await CourseModel.find({ _id: { $in: enrolledCourseIds } }).lean();

    let rawPoints = 0;
    events.forEach(event => {
       if (event.eventType === 'login') rawPoints += 2;
       else if (event.eventType === 'video_watch') rawPoints += (event.duration || 0);
       else if (event.eventType === 'quiz_submit') rawPoints += 10;
       else if (event.eventType === 'assignment_submit') rawPoints += 8;
    });

    const student = await UserModel.findById(studentId).lean();
    let possiblePoints = 2; // Baseline
    
    const earliestUser = await UserModel.findOne().sort({ createdAt: 1 }).lean();
    const referenceDate = earliestUser?.createdAt || student?.createdAt || new Date();
    const daysSinceCreation = differenceInDays(new Date(), new Date(referenceDate));
    possiblePoints += (daysSinceCreation + 1) * 2; // 2 points per day from global start

    for (const course of enrolledCourses) {
       possiblePoints += (course.duration || 0);
       const taskCount = await TaskModel.countDocuments({ courseId: course._id });
       const quizCount = await QuizModel.countDocuments({ courseId: course._id });
       possiblePoints += (taskCount * 8) + (quizCount * 10);
    }

    // Ensure total available points >= earned points
    possiblePoints = Math.max(possiblePoints, rawPoints);

    const score = Math.round((rawPoints / Math.max(possiblePoints, 1)) * 100);
    
    const streak = events.length > 0 ? 3 : 0;
    const hours = (events.reduce((acc, curr) => acc + (curr.duration || 0), 0) / 60).toFixed(1);
    
    const courses = enrolledCourses.length;
    
    // Dynamic history calculation
    const rangeParam = req.query.range as string;
    const range = rangeParam === '30' ? 30 : 7;
    const end = new Date();
    const start = subDays(end, range - 1);
    
    const days = eachDayOfInterval({ start, end });
    const history = days.map(day => {
      const dayEvents = events.filter(e => e.timestamp && isSameDay(new Date(e.timestamp), day));
      let dayScore = 0;
      dayEvents.forEach(e => {
        if (e.eventType === 'login') dayScore += 2;
        else if (e.eventType === 'video_watch') dayScore += (e.duration || 0);
        else if (e.eventType === 'quiz_submit') dayScore += 10;
        else if (e.eventType === 'assignment_submit') dayScore += 8;
      });
      return {
        name: format(day, range === 7 ? "EEE" : "MMM dd"),
        fullDate: format(day, "MMM dd"),
        score: dayScore
      };
    });

    const breakdown = {
      logins: events.filter(e => e.eventType === 'login').length,
      videoWatches: events.filter(e => e.eventType === 'video_watch').length,
      quizzes: events.filter(e => e.eventType === 'quiz_submit').length,
      assignments: events.filter(e => e.eventType === 'assignment_submit').length,
    };

    let facultyName = null;
    const facultyLink = await FacultyStudentModel.findOne({ studentId }).lean();
      
    if (facultyLink) {
       const facultyUser = await UserModel.findById(facultyLink.facultyId).lean();
       if (facultyUser) { facultyName = facultyUser.name; }
    }

    res.json({ score, hours, courses, streak, history, recentEvents: events.slice(0, 5), breakdown, facultyName, points: rawPoints, maxPoints: possiblePoints });
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
    } else if (req.user.role === 'faculty') {
      const students = await storage.getStudentsByFaculty(req.user.id);
      const courses = await storage.getCoursesByFaculty(req.user.id);
      
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

  // Faculty student management
  app.get('/api/faculty/students', requireAuth, async (req, res) => {
    if (req.user.role !== 'faculty') {
      return res.status(403).json({ message: "Only faculty can manage students" });
    }
    try {
      const students = await storage.getStudentsByFaculty(req.user.id);
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

  app.post('/api/faculty/add-student', requireAuth, async (req, res) => {
    if (req.user.role !== 'faculty') {
      return res.status(403).json({ message: "Only faculty can add students" });
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

      await storage.linkFacultyStudent(req.user.id, student.id);

      const courses = await storage.getCoursesByFaculty(req.user.id);
      if (courses.length > 0) {
        await Promise.all(courses.map((c: any) => storage.enrollStudent(student.id, c.id)));
      }

      res.status(201).json({ message: "Student added successfully", student: { id: student.id, name: student.name, email: student.email } });
    } catch (err) {
      res.status(500).json({ message: "Failed to add student" });
    }
  });

  app.delete('/api/faculty/students/:id', requireAuth, async (req, res) => {
    if (req.user.role !== 'faculty') {
      return res.status(403).json({ message: "Only faculty can remove students" });
    }
    try {
      const studentId = Number(req.params.id);
      await storage.removeStudentFromFaculty(req.user.id, studentId);
      res.json({ message: "Student removed successfully" });
    } catch (err) {
      res.status(500).json({ message: "Failed to remove student" });
    }
  });

  // --- TASKS API ---
  app.get('/api/tasks', requireAuth, async (req, res) => {
    try {
      if (req.user.role === 'faculty') {
        const instCourses = await storage.getCoursesByFaculty(req.user.id);
        if (instCourses.length === 0) return res.json([]);
        const cIds = instCourses.map((c: any) => c.id);
        const instTasks = await TaskModel.find({ courseId: { $in: cIds } }).lean();
        res.json(instTasks.map(t => ({ ...t, id: t._id })));
      } else if (req.user.role === 'student') {
        const enr = await EnrollmentModel.find({ studentId: req.user.id }).lean();
        if (enr.length === 0) return res.json([]);
        const cIds = enr.map(e => e.courseId);
        const stTasks = await TaskModel.find({ courseId: { $in: cIds } }).lean();
        res.json(stTasks.map(t => ({ ...t, id: t._id })));
      } else {
        res.json([]);
      }
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.get('/api/tasks/submissions', requireAuth, async (req, res) => {
    if (req.user.role !== 'faculty') return res.status(403).json({ message: "Faculty only" });
    try {
      const instCourses = await storage.getCoursesByFaculty(req.user.id);
      if (instCourses.length === 0) return res.json([]);
      const cIds = instCourses.map((c: any) => c.id);
      
      const teacherTasks = await TaskModel.find({ courseId: { $in: cIds } }).lean();
      if (teacherTasks.length === 0) return res.json([]);
      const taskIds = teacherTasks.map(t => t._id);
      
      const subs = await TaskSubmissionModel.find({ taskId: { $in: taskIds } }).lean();
      const studentIds = subs.map(s => s.studentId);
      const students = await UserModel.find({ _id: { $in: studentIds } }).lean();

      res.json(subs.map(s => {
        const student = students.find(u => u._id === s.studentId);
        return {
          id: s._id,
          taskId: s.taskId,
          pdfUrl: s.pdfUrl,
          submittedAt: s.submittedAt,
          studentName: student ? student.name : 'Unknown',
          grade: s.grade,
          feedback: s.feedback
        };
      }));
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch submissions" });
    }
  });

  app.post('/api/tasks', requireAuth, async (req, res) => {
    if (req.user.role !== 'faculty') return res.status(403).json({ message: "Faculty only" });
    try {
      const { courseId, title, description } = req.body;
      const newTask = await TaskModel.create({ courseId, title, description });
      const t = newTask.toObject();
      res.status(201).json({ ...t, id: t._id });
    } catch (err) {
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.patch('/api/tasks/:id', requireAuth, async (req, res) => {
    if (req.user.role !== 'faculty') return res.status(403).json({ message: "Faculty only" });
    try {
      const taskId = Number(req.params.id);
      const { title, description, courseId } = req.body;
      const updated = await TaskModel.findByIdAndUpdate(taskId, { title, description, courseId }, { new: true }).lean();
      if (!updated) return res.status(404).json({ message: "Task not found" });
      res.json({ ...updated, id: updated._id });
    } catch (err) {
      res.status(500).json({ message: "Failed to update task" });
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

      const newSub = await TaskSubmissionModel.create({ taskId, studentId: req.user.id, pdfUrl });
      
      const taskReq = await TaskModel.findById(taskId).lean();
      if (taskReq) {
        await storage.logEvent({
          studentId: req.user.id,
          courseId: taskReq.courseId,
          eventType: 'assignment_submit',
          duration: 30
        });
      }
      const s = newSub.toObject();
      res.status(201).json({ ...s, id: s._id });
    } catch (err) {
      console.error("Upload Error:", err);
      res.status(500).json({ message: "Failed to submit task" });
    }
  });

  app.post('/api/tasks/submissions/:id/grade', requireAuth, async (req, res) => {
    if (req.user.role !== 'faculty') return res.status(403).json({ message: "Faculty only" });
    try {
      const submissionId = Number(req.params.id);
      const { grade, feedback } = req.body;
      
      const sub = await TaskSubmissionModel.findByIdAndUpdate(submissionId, { 
        grade, 
        feedback 
      }, { new: true }).lean();

      if (!sub) return res.status(404).json({ message: "Submission not found" });
      
      res.json({ ...sub, id: sub._id });
    } catch (err) {
      res.status(500).json({ message: "Failed to grade submission" });
    }
  });

  app.delete('/api/tasks/:id', requireAuth, async (req, res) => {
    if (req.user.role !== 'faculty') return res.status(403).json({ message: "Faculty only" });
    try {
      const taskId = Number(req.params.id);
      
      await TaskSubmissionModel.deleteMany({ taskId });
      await TaskModel.findByIdAndDelete(taskId);
      
      res.json({ message: "Task deleted successfully" });
    } catch (err) {
      console.error("Delete Task Error:", err);
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  return httpServer;
}