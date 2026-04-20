# 🎓 Startup-Stack: A-Z Project Guide
## Student Course Engagement Monitoring System

Startup-Stack is a state-of-the-art, full-stack Learning Management System (LMS) designed to bridge the gap between content delivery and student engagement. It focuses on real-time monitoring and gamified rewards to ensure students stay active and instructors stay informed.

---

## 🏛️ Project Vision & Purpose
The primary goal of Startup-Stack is to solve the "Passive Learning" problem. By tracking every interaction—from logins to video watch time—the system provides a dynamic "Engagement Score" that reflects a student's true participation, not just their test results.

---

## 👥 User Personas & Workflows

### 🛡️ Administrator (The Overseer)
*   **Role**: Manages the platform at scale.
*   **Key Actions**: 
    *   Monitor system-wide activity trends (Logins over time).
    *   View global metrics (Total Users, Courses, Engagement levels).
    *   Manage user roles and platform security.

### 👨‍🏫 Faculty/Instructor (The Catalyst)
*   **Role**: Experts who create content and mentor cohorts.
*   **Key Actions**:
    *   **Course Creation**: Upload videos and reading materials.
    *   **Assessment**: Create Quizzes (multiple choice) and Tasks (PDF assignments).
    *   **Student Management**: Add students to their cohort and track their individual engagement logs.
    *   **Feedback**: Review and grade PDF submissions with personalized comments.
    *   **Analytics**: Identify "At-Risk" students (Engagement < 40%) before they fall behind.

### 🎓 Student (The Learner)
*   **Role**: End-users who consume content and earn rewards.
*   **Key Actions**:
    *   **Dashboard**: A glassmorphic UI showcasing their points, streak, and recent activity.
    *   **Learning**: Watch course videos (with time tracking) and complete reading tasks.
    *   **Assessment**: Submit assignments as PDFs and take interactive quizzes.
    *   **Growth**: Earn engagement points for every action to climb the privacy-focused leaderboard.

---

## ⚙️ The Engagement Engine (Technical Logic)
The "Heart" of the system is the **Dynamic Scoring Model**.

### 💎 How Points are Earned
| Action | Points Awarded | Frequency |
| :--- | :--- | :--- |
| **Daily Login** | +2 Points | Once per day |
| **Video Watch** | +1 Point / Minute | Based on duration |
| **Quiz Submission** | +10 Points | Per attempt |
| **Assignment Submission** | +30 Points | Per submission |

### 📊 Score Calculation
The system calculates a percentage based on **Points Earned** vs. **Total Possible Points**.
*   **Total Possible Points** = (Days since platform launch × 2) + Sum(Total Video Minutes) + (Tasks × 8) + (Quizzes × 10).
*   **Engagement %** = [(Points Earned / Total Possible) * 100](file:///c:/Users/Lenovo/OneDrive/Documents/student%20course/Startup-Stack/server/routes.ts#50-53).

---

## 🛠️ Technical Architecture

### 🚀 Frontend
*   **Framework**: React 18 with TypeScript.
*   **Design**: Tailwind CSS for styling + Framer Motion for premium animations.
*   **UI Library**: Radix UI & Shadcn components (Premium Glassmorphism aesthetics).
*   **Data Fetching**: TanStack Query (React Query) for efficient caching and state management.
*   **Visualization**: Recharts for engagement graphs and distribution charts.

### 💾 Backend
*   **Server**: Node.js with Express.js.
*   **Database**: MongoDB (Mongoose) with Auto-incrementing IDs for optimized lookups.
*   **Auth**: JWT-based authentication (7-day sessions) with bcrypt password hashing.
*   **Real-time**: Socket.io for immediate notifications (e.g., "Student X is now active").
*   **Storage**: Multer for secure PDF assignment uploads.

---

## 📁 Key Data Models
*   **Users**: Unified schema for Admin, Faculty, and Students.
*   **Courses**: Metadata including video URLs and durations.
*   **EngagementEvents**: A log of every significant action for historical tracking.
*   **Tasks & Submissions**: Supports PDF uploads and recursive grading/feedback.
*   **Quizzes**: Associated questions with automated scoring logic.

---

## 🚀 Setup & Local Deployment
1.  **Dependencies**: Run `npm install`.
2.  **Environment**: 
    *   `MONGODB_URI`: Your database connection.
    *   `SESSION_SECRET`: For JWT signing.
3.  **Launch**: `npm run dev` (Runs concurrently: Frontend on 5173, Backend on 5000).

---

## 📋 Maintenance Scripts
The project includes utility scripts for developers:
| Script | Purpose |
| :--- | :--- |
| [complete_reset.js](file:///c:/Users/Lenovo/OneDrive/Documents/student%20course/Startup-Stack/complete_reset.js) | Full database wipe and schema initialization. |
| [check_data.js](file:///c:/Users/Lenovo/OneDrive/Documents/student%20course/Startup-Stack/check_data.js) | Validates data integrity across models. |
| [reassign_courses.js](file:///c:/Users/Lenovo/OneDrive/Documents/student%20course/Startup-Stack/reassign_courses.js) | Utility for bulk migrating courses between instructors. |

---

## 🔮 Future Roadmap
1.  **AI-Powered Insights**: Predictive analytics to suggest specific content to low-engagement students.
2.  **Mobile App**: Dedicated React Native app for on-the-go learning.
3.  **Peer Review**: Enabling students to provide feedback on each other's (anonymized) tasks.
4.  **Live Classrooms**: Integration with WebRTC for real-time video sessions.

---
*Created with passion for the future of education. 💡*
