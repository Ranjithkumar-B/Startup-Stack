import { useAuth } from "@/hooks/use-auth";
import { Bell, Search, X, Check, Trash2, Clock } from "lucide-react";
import { useNotifications } from "@/hooks/use-notifications";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { useLocation } from "wouter";

export function Header() {
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();
  const [showDropdown, setShowDropdown] = useState(false);
  const [location, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  
  if (!user) return null;

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      const isStudentPage = location.startsWith("/students") || location.startsWith("/admin") || location.startsWith("/leaderboard");
      // If on admin or student page, search students, otherwise search courses
      const targetPath = isStudentPage ? "/students" : "/courses";
      setLocation(`${targetPath}?q=${encodeURIComponent(searchQuery)}`);
      // Force a re-render in components that don't react to query-only changes
      window.dispatchEvent(new Event("locationchange"));
    }
  };

  return (
    <header className="h-20 px-8 flex items-center justify-between bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-10 mui-shadow">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search courses, students, topics... (Press Enter)" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-muted/50 border-none focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium placeholder:text-muted-foreground"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-4 relative">
        <button 
          onClick={() => setShowDropdown(!showDropdown)}
          className="relative p-2.5 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 w-3 h-3 bg-destructive rounded-full border-2 border-card flex items-center justify-center text-[8px] text-white font-bold">
              {unreadCount}
            </span>
          )}
        </button>

        {showDropdown && (
          <div className="absolute top-full right-0 mt-4 w-96 bg-card border border-border rounded-3xl mui-shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 z-50">
            <div className="p-5 border-b border-border flex justify-between items-center bg-muted/20">
              <h3 className="font-bold">Notifications</h3>
              <div className="flex gap-2">
                <button onClick={markAllAsRead} className="text-xs font-bold text-primary hover:underline">Mark all read</button>
                <span className="text-border">|</span>
                <button onClick={clearAll} className="text-xs font-bold text-destructive hover:underline">Clear</button>
              </div>
            </div>
            
            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-10 text-center">
                  <Bell className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No new notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {notifications.map((n) => (
                    <div 
                      key={n.id} 
                      className={`p-5 hover:bg-muted/30 transition-colors relative cursor-pointer ${!n.read ? 'bg-primary/5' : ''}`}
                      onClick={() => markAsRead(n.id)}
                    >
                      {!n.read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>}
                      <div className="flex justify-between items-start mb-1">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${n.type === 'success' ? 'text-emerald-500' : 'text-primary'}`}>{n.type}</span>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(n.timestamp, { addSuffix: true })}
                        </div>
                      </div>
                      <h4 className="font-bold text-sm mb-1">{n.title}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {notifications.length > 0 && (
               <div className="p-3 bg-muted/10 border-t border-border text-center">
                  <button onClick={() => setShowDropdown(false)} className="text-xs font-bold text-muted-foreground hover:text-foreground">Close</button>
               </div>
            )}
          </div>
        )}

        <div className="h-8 w-px bg-border mx-2"></div>
        <div className="text-right hidden md:block">
          <p className="text-sm font-semibold text-foreground leading-tight">{user.name}</p>
          <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
        </div>
      </div>
    </header>
  );
}
