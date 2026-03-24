import { z } from 'zod';
import { registerSchema, loginSchema, eventSchema, userResponseSchema, Course, EngagementEvent } from './schema';

export const errorSchemas = {
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  unauthorized: z.object({ message: z.string() }),
  notFound: z.object({ message: z.string() }),
  internal: z.object({ message: z.string() }),
};

export const api = {
  auth: {
    register: {
      method: 'POST' as const,
      path: '/api/auth/register' as const,
      input: registerSchema,
      responses: {
        201: z.object({ token: z.string(), user: userResponseSchema }),
        400: errorSchemas.validation,
      },
    },
    login: {
      method: 'POST' as const,
      path: '/api/auth/login' as const,
      input: loginSchema,
      responses: {
        200: z.object({ token: z.string(), user: userResponseSchema }),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/auth/me' as const,
      responses: {
        200: userResponseSchema,
        401: errorSchemas.unauthorized,
      },
    },
  },
  courses: {
    list: {
      method: 'GET' as const,
      path: '/api/courses' as const,
      responses: {
        200: z.array(z.custom<any>()), // Course + progress + instructor
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/courses' as const,
      input: z.object({ title: z.string(), description: z.string(), videoUrl: z.string().optional() }),
      responses: {
        201: z.custom<any>(),
        401: errorSchemas.unauthorized,
      },
    },
  },
  engagement: {
    log: {
      method: 'POST' as const,
      path: '/api/engagement/log' as const,
      input: eventSchema,
      responses: {
        201: z.custom<any>(),
        400: errorSchemas.validation,
      },
    },
    student: {
      method: 'GET' as const,
      path: '/api/engagement/student/:id' as const,
      responses: {
        200: z.any(),
      },
    },
  },
  analytics: {
    course: {
      method: 'GET' as const,
      path: '/api/analytics/course/:id' as const,
      responses: {
        200: z.any(),
      },
    },
    dashboard: {
      method: 'GET' as const,
      path: '/api/analytics/dashboard' as const,
      responses: {
        200: z.any(),
        401: errorSchemas.unauthorized,
      },
    },
    leaderboard: {
      method: 'GET' as const,
      path: '/api/analytics/leaderboard' as const,
      responses: {
        200: z.array(z.object({
          id: z.number(),
          name: z.string(),
          engagementScore: z.number(),
          rank: z.number(),
          avatarLetters: z.string(),
        })),
        401: errorSchemas.unauthorized,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export const ws = {
  send: {
    student_action: z.object({ courseId: z.number(), eventType: z.string() }),
    realtime_quiz: z.object({ id: z.string(), courseId: z.number(), question: z.string(), options: z.array(z.string()) }),
    realtime_answer: z.object({ quizId: z.string(), courseId: z.number(), answerIndex: z.number(), studentId: z.number(), studentName: z.string() }),
  },
  receive: {
    student_active: z.object({ studentId: z.number(), studentName: z.string(), courseId: z.number(), eventType: z.string() }),
    realtime_quiz: z.object({ id: z.string(), courseId: z.number(), question: z.string(), options: z.array(z.string()) }),
    realtime_answer: z.object({ quizId: z.string(), courseId: z.number(), answerIndex: z.number(), studentId: z.number(), studentName: z.string() }),
  },
};
