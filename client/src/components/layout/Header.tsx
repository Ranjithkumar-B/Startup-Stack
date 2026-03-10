import { useAuth } from "@/hooks/use-auth";
import { Bell, Search } from "lucide-react";

export function Header() {
  const { user } = useAuth();
  
  if (!user) return null;

  return (
    <header className="h-20 px-8 flex items-center justify-between bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-10 mui-shadow">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search courses, students, topics..." 
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-muted/50 border-none focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium placeholder:text-muted-foreground"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <button className="relative p-2.5 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full border border-card"></span>
        </button>
        <div className="h-8 w-px bg-border mx-2"></div>
        <div className="text-right hidden md:block">
          <p className="text-sm font-semibold text-foreground leading-tight">{user.name}</p>
          <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
        </div>
      </div>
    </header>
  );
}
