import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Activity, Server } from "lucide-react";
import { apiClient } from "@/lib/api-client";

export default function SystemActivity() {
  const { user } = useAuth();
  
  if (user?.role !== "admin") {
    return (
      <DashboardLayout>
        <div className="flex h-64 items-center justify-center">
          <p className="text-destructive font-bold text-xl">Unauthorized: Platform Admins Only</p>
        </div>
      </DashboardLayout>
    );
  }

  // Poll for latest stats every 30 seconds
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/analytics/dashboard"],
    queryFn: async () => {
      const resp = await apiClient.get("/api/analytics/dashboard");
      return resp.data;
    },
    refetchInterval: 30000,
  });

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-foreground mb-2 flex items-center gap-2">
          <Activity className="w-8 h-8 text-secondary" />
          System Activity Log
        </h1>
        <p className="text-muted-foreground text-lg">Monitor live platform metrics and health data continuously.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-card rounded-2xl p-6 mui-shadow border border-border">
          <div className="flex justify-between items-center mb-4 border-b border-border pb-4">
            <h2 className="font-bold flex items-center gap-2"><Server className="text-primary w-5 h-5"/> Server Status</h2>
            <div className="flex items-center gap-2 text-sm text-emerald-500 font-bold bg-emerald-500/10 px-3 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Online
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Uptime</span>
              <span className="font-mono">99.98%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Memory Usage</span>
              <span className="font-mono">428 MB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">CPU Load</span>
              <span className="font-mono">1.2%</span>
            </div>
          </div>
        </div>
        
        <div className="bg-card rounded-2xl p-6 mui-shadow border border-border">
          <h2 className="font-bold mb-4 border-b border-border pb-4">Real-Time Metrics</h2>
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-muted/50 rounded w-full line-2" />
              <div className="h-6 bg-muted/50 rounded w-3/4 line-2" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Users</span>
                <span className="font-bold text-foreground">{stats?.totalUsers || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Registered Courses</span>
                <span className="font-bold text-foreground">{stats?.totalCourses || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Engagement Events Recorded</span>
                <span className="font-bold text-foreground">{stats?.totalEvents || 0}</span>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-card rounded-2xl p-6 mui-shadow border border-border">
         <h2 className="font-bold mb-4">Latest Logs</h2>
         <div className="p-4 bg-black rounded-xl border border-border font-mono text-sm text-green-400 max-h-48 overflow-y-auto">
            {'>'} System initialization complete.<br/>
            {'>'} Database connected successfully.<br/>
            {'>'} WebSocket server ready on /ws.<br/>
            {'>'} Listening for engagements...
         </div>
      </div>
    </DashboardLayout>
  );
}
