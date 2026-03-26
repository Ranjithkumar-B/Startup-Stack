import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { BookOpen, ArrowRight, Loader2, Users, GraduationCap } from "lucide-react";

export default function Login() {
  const [_, setLocation] = useLocation();
  const { login, isLoggingIn } = useAuth();
  const [userType, setUserType] = useState<"student" | "faculty" | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await login({ email, password, role: userType! });
      setLocation(`/${res.user.role}`);
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
    }
  };

  if (!userType) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0A0A0A] p-4 text-white">
        {/* Deep Atmospheric Background Elements */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[150px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-secondary/20 blur-[150px] pointer-events-none" />
        <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] rounded-full bg-accent/10 blur-[120px] pointer-events-none" />
        
        <div className="w-full max-w-5xl relative z-10">
          <div className="mb-16 text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-8 mx-auto shadow-2xl shadow-primary/30 border border-white/10 backdrop-blur-sm">
              <BookOpen className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl md:text-6xl font-display font-extrabold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
              Student Course Engagement Monitoring Tool
            </h1>
            <p className="text-xl text-white/50 max-w-2xl mx-auto font-light tracking-wide">
              Select your workspace environment to continue
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto px-4">
            {/* Student Login */}
            <button
              onClick={() => setUserType("student")}
              className="p-10 md:p-12 bg-white/[0.03] backdrop-blur-2xl rounded-[2.5rem] border border-white/[0.08] hover:border-primary/50 hover:bg-white/[0.05] hover:shadow-[0_0_80px_-20px_rgba(var(--primary),0.3)] transition-all duration-500 active:scale-[0.98] group cursor-pointer flex flex-col items-center text-center relative overflow-hidden animate-in fade-in slide-in-from-bottom-12 delay-150"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              
              <div className="w-24 h-24 rounded-[2rem] bg-secondary/10 flex items-center justify-center mb-8 group-hover:bg-secondary/20 group-hover:scale-110 transition-all duration-500 relative z-10 ring-1 ring-white/10 group-hover:ring-secondary/50">
                <GraduationCap className="w-12 h-12 text-secondary group-hover:text-white transition-colors duration-300" />
              </div>
              <h2 className="text-3xl font-display font-bold text-white mb-4 relative z-10">Student</h2>
              <p className="text-white/50 text-base leading-relaxed relative z-10 max-w-xs">
                Access your courses, track your learning progress, and earn engagement points
              </p>
            </button>

            {/* Faculty Login */}
            <button
              onClick={() => setUserType("faculty")}
              className="p-10 md:p-12 bg-white/[0.03] backdrop-blur-2xl rounded-[2.5rem] border border-white/[0.08] hover:border-accent/50 hover:bg-white/[0.05] hover:shadow-[0_0_80px_-20px_rgba(var(--accent),0.3)] transition-all duration-500 active:scale-[0.98] group cursor-pointer flex flex-col items-center text-center relative overflow-hidden animate-in fade-in slide-in-from-bottom-12 delay-300"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              
              <div className="w-24 h-24 rounded-[2rem] bg-accent/10 flex items-center justify-center mb-8 group-hover:bg-accent/20 group-hover:scale-110 transition-all duration-500 relative z-10 ring-1 ring-white/10 group-hover:ring-accent/50">
                <Users className="w-12 h-12 text-accent group-hover:text-white transition-colors duration-300" />
              </div>
              <h2 className="text-3xl font-display font-bold text-white mb-4 relative z-10">Faculty</h2>
              <p className="text-white/50 text-base leading-relaxed relative z-10 max-w-xs">
                Manage your curriculums, monitor analytics, and evaluate student success
              </p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0A0A0A] p-4 text-white">
      {/* Deep Atmospheric Background Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-secondary/20 blur-[150px] pointer-events-none" />
      <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] rounded-full bg-accent/10 blur-[120px] pointer-events-none" />
      
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-0 bg-white/[0.03] backdrop-blur-2xl rounded-3xl overflow-hidden border border-white/[0.08] shadow-[0_0_80px_-20px_rgba(0,0,0,0.5)] relative z-10 animate-in zoom-in-95 duration-500">
        {/* Left Side - Visual */}
        <div className="hidden md:flex flex-col justify-between p-12 bg-gradient-to-br from-primary/80 to-secondary/80 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
          
          <div className="relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-8 border border-white/30 shadow-2xl">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl lg:text-5xl font-display font-bold leading-tight mb-6">
              Monitor engagement. <br/>Drive success.
            </h1>
            <p className="text-white/80 text-lg max-w-sm font-light">
              Sign in to your {userType === 'faculty' ? 'faculty' : 'student'} workspace to continue.
            </p>
          </div>
          
          <div className="relative mb-2 flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-2xl w-fit">
            <div className={`w-2 h-2 rounded-full ${userType === 'faculty' ? 'bg-accent animate-pulse' : 'bg-primary animate-pulse'}`} />
            <span className="text-xs font-bold uppercase tracking-widest text-white/70">
              {userType === 'faculty' ? 'Faculty Mode' : 'Student Mode'}
            </span>
          </div>

          <div className="relative z-10 bg-black/20 backdrop-blur-xl p-6 rounded-2xl border border-white/10 mt-12">
            <p className="italic text-sm mb-4 leading-relaxed font-light text-white/90">"This platform transformed how I identify struggling students before they fall behind."</p>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="p-8 md:p-12 flex flex-col justify-center relative bg-black/40">
          <div className="max-w-md w-full mx-auto relative z-10">
            <button
              onClick={() => setUserType(null)}
              className="mb-8 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-semibold text-white/60 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2 w-max backdrop-blur-md"
            >
              ← Back to role selection
            </button>

            <div className="mb-10 text-center md:text-left animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
              <h2 className="text-3xl lg:text-4xl font-display font-bold text-white mb-3">
                Welcome back{userType === "faculty" ? ", Faculty" : ""}
              </h2>
              <p className="text-white/50">Sign in to securely access your workspace</p>
            </div>

            {error && (
              <div className="mb-8 p-4 rounded-2xl bg-destructive/20 border border-destructive/50 text-red-200 text-sm font-medium backdrop-blur-md animate-in fade-in">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-500 delay-300">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white focus:bg-white/10 focus:border-primary/50 focus:ring-4 focus:ring-primary/20 transition-all outline-none placeholder:text-white/20"
                  placeholder="name@university.edu"
                  required
                />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-white/70">Password</label>
                  
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white focus:bg-white/10 focus:border-primary/50 focus:ring-4 focus:ring-primary/20 transition-all outline-none placeholder:text-white/20"
                  placeholder="••••••••"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full mt-8 py-4 rounded-2xl font-bold bg-primary text-primary-foreground hover:shadow-[0_0_40px_-10px_rgba(var(--primary),0.6)] hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:pointer-events-none shadow-lg shadow-primary/20"
              >
                {isLoggingIn ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
                {!isLoggingIn && <ArrowRight className="w-5 h-5" />}
              </button>
            </form>

            <p className="mt-10 text-center text-sm text-white/50 animate-in fade-in delay-500">
              Don't have an account?{" "}
              <Link href="/register" className="font-semibold text-primary hover:text-primary/80 hover:underline transition-colors">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
