import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0A0A0A] p-4 text-white">
      {/* Deep Atmospheric Background Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-secondary/20 blur-[150px] pointer-events-none" />
      
      <div className="w-full max-w-md bg-white/[0.03] backdrop-blur-2xl rounded-[2.5rem] shadow-[0_0_80px_-20px_rgba(0,0,0,0.5)] p-10 border border-white/[0.08] relative z-10 text-center animate-in zoom-in-95 duration-500">
        <div className="w-20 h-20 rounded-3xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-6 border border-destructive/20 shadow-lg shadow-destructive/20">
          <AlertCircle className="w-10 h-10" />
        </div>
        <h1 className="text-4xl font-display font-bold text-white mb-4">404</h1>
        <h2 className="text-xl font-semibold text-white/80 mb-4">Page Not Found</h2>
        <p className="text-white/50 mb-8">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <button 
          onClick={() => window.history.back()}
          className="w-full py-4 rounded-2xl font-bold bg-white/10 text-white hover:bg-white/20 transition-all border border-white/10 hover:border-white/20"
        >
          Go Back
        </button>
      </div>
    </div>
  );
}
