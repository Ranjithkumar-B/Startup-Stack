import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { BookOpen, ArrowRight, Loader2, Users, GraduationCap } from "lucide-react";

export default function Login() {
  const [_, setLocation] = useLocation();
  const { login, isLoggingIn } = useAuth();
  const [userType, setUserType] = useState<"student" | "teacher" | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await login({ email, password });
      setLocation(`/${res.user.role}`);
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
    }
  };

  if (!userType) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <div className="w-full max-w-5xl">
          <div className="mb-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 mx-auto">
              <BookOpen className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl font-display font-bold text-foreground mb-3">
              Course Engagement Platform
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Monitor student participation and drive academic success
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            {/* Student Login */}
            <button
              onClick={() => setUserType("student")}
              className="p-8 bg-card rounded-2xl border-2 border-border hover:border-primary hover:shadow-lg hover:shadow-primary/20 transition-all active:translate-y-1 group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center mb-4 group-hover:bg-secondary/40 transition-colors">
                <GraduationCap className="w-7 h-7 text-secondary" />
              </div>
              <h2 className="text-2xl font-display font-bold text-foreground mb-2">Login as Student</h2>
              <p className="text-muted-foreground text-sm">
                Access your courses, track progress, and view your engagement analytics
              </p>
            </button>

            {/* Teacher Login */}
            <button
              onClick={() => setUserType("teacher")}
              className="p-8 bg-card rounded-2xl border-2 border-border hover:border-primary hover:shadow-lg hover:shadow-primary/20 transition-all active:translate-y-1 group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center mb-4 group-hover:bg-accent/40 transition-colors">
                <Users className="w-7 h-7 text-accent" />
              </div>
              <h2 className="text-2xl font-display font-bold text-foreground mb-2">Login as Teacher</h2>
              <p className="text-muted-foreground text-sm">
                Manage your courses, monitor students, and track class engagement
              </p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8 bg-card rounded-3xl mui-shadow-md overflow-hidden border border-border">
        {/* Left Side - Visual */}
        <div className="hidden md:flex flex-col justify-between p-12 bg-gradient-to-br from-primary to-secondary text-primary-foreground relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
          
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-6">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-4xl font-display font-bold leading-tight mb-4">
              Monitor engagement. <br/>Drive success.
            </h1>
            <p className="text-primary-foreground/80 text-lg max-w-sm">
              The complete platform for tracking student participation and course analytics.
            </p>
          </div>
          
          <div className="relative z-10 glass-card p-6 rounded-2xl border-white/10">
            <p className="italic text-sm mb-4">"This platform transformed how I identify struggling students before they fall behind."</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold">DR</div>
              <div>
                <p className="font-semibold text-sm">Dr. Sarah Jenkins</p>
                <p className="text-xs text-primary-foreground/70">Computer Science Dept</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="p-8 md:p-12 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto">
            <button
              onClick={() => setUserType(null)}
              className="mb-6 px-3 py-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back to role selection
            </button>

            <div className="mb-10 text-center md:text-left">
              <h2 className="text-3xl font-display font-bold text-foreground mb-2">
                Welcome back{userType === "teacher" ? ", Teacher" : ""}
              </h2>
              <p className="text-muted-foreground">Sign in to access your dashboard</p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border focus:bg-background focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                  placeholder="name@university.edu"
                  required
                />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-sm font-semibold text-foreground">Password</label>
                  <a href="#" className="text-xs font-semibold text-primary hover:text-primary/80">Forgot password?</a>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border focus:bg-background focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                  placeholder="••••••••"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full mt-6 py-3.5 rounded-xl font-semibold bg-gradient-to-r from-primary to-primary/90 text-primary-foreground mui-shadow-md hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:pointer-events-none"
              >
                {isLoggingIn ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
                {!isLoggingIn && <ArrowRight className="w-5 h-5" />}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/register" className="font-semibold text-primary hover:underline">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
