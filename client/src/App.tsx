import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "./hooks/use-auth";

// Pages
import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import StudentDashboard from "@/pages/student/Dashboard";
import FacultyDashboard from "@/pages/instructor/Dashboard";
import AdminDashboard from "@/pages/admin/Dashboard";
import CourseList from "@/pages/courses/CourseList";
import StudentList from "@/pages/students/StudentList";
import SystemActivity from "@/pages/activity/SystemActivity";
import CourseQuizzes from "@/pages/quizzes/CourseQuizzes";
import TakeQuiz from "@/pages/quizzes/TakeQuiz";
import WatchCourse from "@/pages/courses/WatchCourse";
import Leaderboard from "@/pages/analytics/Leaderboard";
import Tasks from "@/pages/tasks/Tasks";
import { NotificationProvider } from "./hooks/use-notifications";

// Protected Route Wrapper
function ProtectedRoute({ component: Component, allowedRoles }: { component: any, allowedRoles?: string[] }) {
  const { user, isLoading } = useAuth();
  const [_, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user) {
    setLocation("/login");
    return null;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-center p-4">
        <h1 className="text-4xl font-display font-bold text-foreground mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-6">You don't have permission to view this page.</p>
        <button onClick={() => setLocation(`/${user.role}`)} className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold">
          Return to Dashboard
        </button>
      </div>
    );
  }

  return <Component />;
}

// Global router
function Router() {
  const { user, isLoading } = useAuth();
  
  return (
    <Switch>
      {/* Auth routes */}
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />

      {/* Redirect root based on role */}
      <Route path="/">
        {() => {
          if (isLoading) return null;
          if (user) {
            window.location.replace(`/${user.role}`);
            return null;
          }
          window.location.replace("/login");
          return null;
        }}
      </Route>

      {/* Dashboards */}
      <Route path="/student">
        {() => <ProtectedRoute component={StudentDashboard} allowedRoles={["student"]} />}
      </Route>
      <Route path="/faculty">
        {() => <ProtectedRoute component={FacultyDashboard} allowedRoles={["faculty", "admin"]} />}
      </Route>
      <Route path="/admin">
        {() => <ProtectedRoute component={AdminDashboard} allowedRoles={["admin"]} />}
      </Route>

      {/* Shared routes */}
      <Route path="/courses">
        {() => <ProtectedRoute component={CourseList} />}
      </Route>
      <Route path="/tasks">
        {() => <ProtectedRoute component={Tasks} />}
      </Route>
      <Route path="/courses/:courseId/watch">
        {(params) => <ProtectedRoute component={() => <WatchCourse params={params} />} />}
      </Route>
      <Route path="/courses/:courseId/quizzes">
        {(params) => <ProtectedRoute component={() => <CourseQuizzes params={params} />} />}
      </Route>
      <Route path="/courses/:courseId/quizzes/:quizId">
        {(params) => <ProtectedRoute component={() => <TakeQuiz params={params} />} />}
      </Route>
      <Route path="/leaderboard">
        {() => <ProtectedRoute component={Leaderboard} />}
      </Route>

      <Route path="/students">
        {() => <ProtectedRoute component={StudentList} allowedRoles={["faculty", "admin"]} />}
      </Route>


      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <NotificationProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </NotificationProvider>
    </QueryClientProvider>
  );
}

export default App;
