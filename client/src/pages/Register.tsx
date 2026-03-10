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
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md bg-card rounded-3xl mui-shadow-md p-8 border border-border">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-display font-bold text-foreground mb-2">Join Platform</h2>
          <p className="text-muted-foreground">Create your account to get started</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border focus:bg-background focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
              placeholder="Jane Doe"
              required
            />
          </div>

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
            <label className="block text-sm font-semibold text-foreground mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border focus:bg-background focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
              placeholder="Min 6 characters"
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">I am a...</label>
            <div className="grid grid-cols-2 gap-3">
              {(["student", "instructor"] as const).map((r) => (
                <label 
                  key={r} 
                  className={`
                    flex items-center justify-center px-4 py-3 rounded-xl border cursor-pointer transition-all
                    ${role === r ? "bg-primary/10 border-primary text-primary font-bold" : "bg-card border-border text-muted-foreground hover:bg-muted font-medium"}
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
            className="w-full mt-6 py-3.5 rounded-xl font-semibold bg-primary text-primary-foreground mui-shadow-md hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:pointer-events-none"
          >
            {isRegistering ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Account"}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
