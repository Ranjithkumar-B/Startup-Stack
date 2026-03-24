import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

export default function Register() {
  const [_, setLocation] = useLocation();
  const { register, isRegistering } = useAuth();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"student" | "instructor" | "admin">("student");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await register({ name, email, password, role });
      setLocation(`/${res.user.role}`);
    } catch (err: any) {
      setError(err.message || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0A0A0A] p-4 text-white">
      {/* Deep Atmospheric Background Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-secondary/20 blur-[150px] pointer-events-none" />
      <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] rounded-full bg-accent/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-white/[0.03] backdrop-blur-2xl rounded-[2.5rem] shadow-[0_0_80px_-20px_rgba(0,0,0,0.5)] p-10 border border-white/[0.08] relative z-10 animate-in zoom-in-95 duration-500">
        <div className="mb-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
          <h2 className="text-3xl font-display font-bold text-white mb-2">Join Platform</h2>
          <p className="text-white/50">Create your account to get started</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-destructive/20 border border-destructive/50 text-red-200 text-sm font-medium backdrop-blur-md animate-in fade-in">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-500 delay-300">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white focus:bg-white/10 focus:border-primary/50 focus:ring-4 focus:ring-primary/20 transition-all outline-none placeholder:text-white/20"
              placeholder="Jane Doe"
              required
            />
          </div>

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
            <label className="block text-sm font-medium text-white/70 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white focus:bg-white/10 focus:border-primary/50 focus:ring-4 focus:ring-primary/20 transition-all outline-none placeholder:text-white/20"
              placeholder="Min 6 characters"
              required
              minLength={6}
            />
          </div>

          <div>
            <div className="grid grid-cols-2 gap-4">
              {(["student", "instructor"] as const).map((r) => (
                <label 
                  key={r} 
                  className={`
                    flex items-center justify-center px-4 py-4 rounded-2xl border cursor-pointer transition-all duration-300
                    ${role === r 
                      ? "bg-primary/20 border-primary text-white font-bold shadow-[0_0_20px_-5px_rgba(var(--primary),0.3)] ring-1 ring-primary/50" 
                      : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white/80 font-medium"}
                  `}
                >
                  <input
                    type="radio"
                    name="role"
                    value={r}
                    checked={role === r}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="sr-only"
                  />
                  <span className="capitalize">{r}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isRegistering}
            className="w-full mt-8 py-4 rounded-2xl font-bold bg-primary text-primary-foreground hover:shadow-[0_0_40px_-10px_rgba(var(--primary),0.6)] hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:pointer-events-none shadow-lg shadow-primary/20"
          >
            {isRegistering ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Account"}
          </button>
        </form>

        <p className="mt-10 text-center text-sm text-white/50 animate-in fade-in delay-500">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-primary hover:text-primary/80 hover:underline transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
