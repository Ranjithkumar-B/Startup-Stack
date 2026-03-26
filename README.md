# Startup-Stack: Student Course Engagement Monitoring System

A comprehensive, full-stack learning management and engagement tracking platform designed for modern classrooms. This system doesn't just deliver courses; it monitors student interaction in real-time to provide actionable insights for instructors and a gamified experience for students.

---

## 🌟 Key Features

### 🎓 For Students
- **Course Dashboard**: High-end glassmorphism-styled UI to access videos, reading materials, and quizzes.
- **Engagement Scoring**: A dynamic points-based system that rewards daily logins, video watches, and submissions.
- **Interactive Quizzes**: Direct assessment with instant grading and engagement point rewards.
- **Task Portal**: Secure PDF assignment submission with feedback tracking.
- **Privacy-First Leaderboard**: Competitive ranking within assigned groups while maintaining student privacy.

### 👨‍🏫 For Faculty (Instructors)
- **Course Management**: Seamlessly upload course content, create automated quizzes, and set deadlines.
- **Engagement Analytics**: Bird's-eye view of student participation to identify at-risk learners early.
- **Student Management**: Add students to specific cohorts and track their individual progress logs.
- **Grading System**: Review and grade PDF assignment submissions with personalized feedback.

### 🛠️ For Administrators
- **Platform Overview**: Monitor system-wide activity, user metrics, and course popularity.
- **User Controls**: Manage access roles for students, faculty, and other admins.

---

## 🚀 Technology Stack

### Frontend
- **Framework**: [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with Framer Motion for premium animations.
- **Components**: [Radix UI](https://www.radix-ui.com/) + Shadcn/UI for accessible, high-performance elements.
- **Analytics**: [Recharts](https://recharts.org/) for student engagement and system trends visualization.
- **State Management**: [@tanstack/react-query](https://tanstack.com/query/latest) for robust server state handling.

### Backend
- **Environment**: [Node.js](https://nodejs.org/) & [Express.js](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) via [Mongoose](https://mongoosejs.com/) for reliable NoSQL storage.
- **Authentication**: [Passport.js](https://www.passportjs.org/) with JWT for secure role-based session management.
- **Real-time**: [Socket.io](https://socket.io/) for instant notification and activity broadcasts.

---

## 📁 Project Structure

```text
├── client/          # Frontend React application
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── hooks/      # Custom React hooks (auth, query, notifications)
│   │   ├── pages/      # Role-specific dashboard layouts and views
│   │   └── lib/        # Shared logic and client utilities
├── server/          # Backend Express server
│   ├── models/      # MongoDB (Mongoose) schemas
│   ├── routes.ts    # Main API route definitions
│   ├── db.ts        # Database connection logic
│   └── index.ts     # Server entry point
├── shared/          # Shared type definitions and schemas (Zod)
└── attached_assets/ # Static assets and documentation
```

---

## 🛠️ Local Setup & Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd Startup-Stack
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory (never commit this to git):
   ```env
   MONGODB_URI=your_mongodb_connection_string
   SESSION_SECRET=your_secure_random_string
   PORT=5000
   ```

4. **Run the application**:
   ```bash
   npm run dev
   ```
   *The application will be available at [http://localhost:5000](http://localhost:5000)*

---

## 📈 Engagement Algorithm Overview

Engagement is calculated using a **Dynamic Points Model**:

- **Active Tracking**: Student actions (login, video_watch, quiz_submit, assignment_submit) trigger "Engagement Events."
- **Daily Growth**: The system increments "Total Available Points" by **2 per day** relative to a platform start date.
- **Score Calculation**: 
  `Engagement Score % = (Points Earned / Total Potential Points) * 100`
- **Baseline Logic**: Late-joining students start from the same reference point as the system-wide baseline to ensure fair relative scores on the leaderboard.

---

## 🌍 Deployment

This project is configured for easy deployment on **Render**:

1. Push your changes to GitHub.
2. Connect your repository to Render as a **Web Service**.
3. Set the **Build Command** to: `npm install && npm run build`.
4. Set the **Start Command** to: `npm start`.
5. Add your `MONGODB_URI` and `SESSION_SECRET` as Environment Variables in the Render dashboard.

---

## 📄 License

This project is licensed under the MIT License.