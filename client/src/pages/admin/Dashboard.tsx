import { useAuth } from "@/hooks/use-auth";
import { useDashboardAnalytics } from "@/hooks/use-analytics";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/ui/StatCard";
import { Server, Users, BookOpen, Target, Trash2, ShieldAlert, Database, ClipboardList, Loader2, Mail, UserCheck } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function AdminDashboard() {
  const { user } = useAuth();
  const { data: analytics, isLoading: isLoadingAnalytics } = useDashboardAnalytics();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "courses" | "quizzes" | "tasks">("overview");

  // --- Queries ---
  const { data: adminUsers = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await apiClient.get("/api/admin/users");
      return res.data;
    },
    enabled: activeTab === "users"
  });

  const { data: adminCourses = [], isLoading: isLoadingCourses } = useQuery({
    queryKey: ["/api/courses"],
    queryFn: async () => {
      const res = await apiClient.get("/api/courses");
      return res.data;
    },
    enabled: activeTab === "courses"
  });

  const { data: adminQuizzes = [], isLoading: isLoadingQuizzes } = useQuery({
    queryKey: ["/api/admin/quizzes"],
    queryFn: async () => {
      const res = await apiClient.get("/api/admin/quizzes");
      return res.data;
    },
    enabled: activeTab === "quizzes"
  });

  const { data: adminTasks = [], isLoading: isLoadingTasks } = useQuery({
    queryKey: ["/api/admin/tasks"],
    queryFn: async () => {
      const res = await apiClient.get("/api/admin/tasks");
      return res.data;
    },
    enabled: activeTab === "tasks"
  });

  // --- Mutations ---
  const deleteMutation = useMutation({
    mutationFn: async ({ type, id }: { type: string, id: number }) => {
      await apiClient.delete(`/api/admin/${type}/${id}`);
    },
    onSuccess: (_, variables) => {
      toast({ title: "Deleted Successfully", description: `The ${variables.type} has been removed from the platform.` });
      queryClient.invalidateQueries({ queryKey: [variables.type === "users" ? "/api/admin/users" : variables.type === "courses" ? "/api/courses" : `/api/admin/${variables.type}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/dashboard"] });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.response?.data?.message || "Action failed", variant: "destructive" });
    }
  });

  const handleDelete = (type: string, id: number, label: string) => {
    if (window.confirm(`CRITICAL ACTION: Are you sure you want to permanently delete "${label}"? This action cannot be undone and will remove all associated data.`)) {
      deleteMutation.mutate({ type, id });
    }
  };

  if (isLoadingAnalytics) {
    return (
      <DashboardLayout>
        <div className="flex h-64 items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-foreground mb-2 flex items-center gap-3">
          <ShieldAlert className="w-8 h-8 text-primary" />
          Platform Administration
        </h1>
        <p className="text-muted-foreground text-lg">System-wide control, analytics, and data management.</p>
      </div>

      {/* Admin Tabs Navigation */}
      <div className="flex gap-2 mb-8 bg-muted/50 p-1 rounded-2xl w-fit">
        {(["overview", "users", "courses", "quizzes", "tasks"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === tab 
                ? "bg-white text-primary shadow-sm" 
                : "text-muted-foreground hover:text-foreground hover:bg-white/50"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* --- Tab Content: Overview --- */}
      {activeTab === "overview" && (
        <div className="animate-in fade-in duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard title="Total Users" value={analytics?.totalUsers || 0} icon={Users} colorClass="text-primary bg-primary/10" />
            <StatCard title="Active Courses" value={analytics?.totalCourses || 0} icon={BookOpen} colorClass="text-emerald-600 bg-emerald-500/10" />
            <StatCard title="Total Quizzes" value={analytics?.totalQuizzes || 0} icon={Target} colorClass="text-purple-600 bg-purple-500/10" />
            <StatCard title="Total Tasks" value={analytics?.totalTasks || 0} icon={ClipboardList} colorClass="text-blue-600 bg-blue-500/10" />
          </div>

        </div>
      )}

      {/* --- Tab Content: Users --- */}
      {activeTab === "users" && (
        <div className="bg-card rounded-3xl border border-border mui-shadow-lg overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          <div className="p-6 border-b border-border bg-muted/30">
            <h2 className="font-bold flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> User Directory</h2>
          </div>
          {isLoadingUsers ? (
            <div className="p-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" /></div>
          ) : (
            <div className="divide-y divide-border">
              {adminUsers.map((u: any) => (
                <div key={u.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      u.role === 'admin' ? 'bg-purple-500/20 text-purple-600' : 
                      u.role === 'faculty' ? 'bg-blue-500/20 text-blue-600' : 
                      'bg-emerald-500/20 text-emerald-600'
                    }`}>
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold">{u.name} {u.id === user?.id && <span className="text-xs bg-muted px-2 py-0.5 rounded-full ml-1">You</span>}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" /> {u.email} • <span className="capitalize font-semibold">{u.role}</span></p>
                    </div>
                  </div>
                  {u.id !== user?.id && (
                    <button 
                      onClick={() => handleDelete("users", u.id, u.name)}
                      className="p-2 text-destructive hover:bg-destructive hover:text-white rounded-xl transition-all border border-transparent hover:border-destructive/20"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- Tab Content: Courses --- */}
      {activeTab === "courses" && (
        <div className="bg-card rounded-3xl border border-border mui-shadow-lg overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          <div className="p-6 border-b border-border bg-muted/30">
            <h2 className="font-bold flex items-center gap-2"><BookOpen className="w-5 h-5 text-emerald-500" /> Platform Courses</h2>
          </div>
          {isLoadingCourses ? (
            <div className="p-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" /></div>
          ) : (
            <div className="divide-y divide-border">
              {adminCourses.map((c: any) => (
                <div key={c.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center"><BookOpen className="w-5 h-5 text-emerald-600" /></div>
                    <div>
                      <p className="font-bold">{c.title}</p>
                      <p className="text-xs text-muted-foreground">ID: {c.id} • Instructor ID: {c.instructorId}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDelete("courses", c.id, c.title)}
                    className="p-2 text-destructive hover:bg-destructive hover:text-white rounded-xl transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- Tab Content: Assessments --- */}
      {(activeTab === "quizzes" || activeTab === "tasks") && (
        <div className="bg-card rounded-3xl border border-border mui-shadow-lg overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          <div className="p-6 border-b border-border bg-muted/30">
            <h2 className="font-bold flex items-center gap-2">
              {activeTab === "quizzes" ? <Target className="w-5 h-5 text-purple-500" /> : <ClipboardList className="w-5 h-5 text-blue-500" />}
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} List
            </h2>
          </div>
          {(activeTab === "quizzes" ? isLoadingQuizzes : isLoadingTasks) ? (
            <div className="p-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" /></div>
          ) : (
            <div className="divide-y divide-border">
              {(activeTab === "quizzes" ? adminQuizzes : adminTasks).map((item: any) => (
                <div key={item.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeTab === 'quizzes' ? 'bg-purple-100' : 'bg-blue-100'}`}>
                      {activeTab === 'quizzes' ? <Target className="w-5 h-5 text-purple-600" /> : <ClipboardList className="w-5 h-5 text-blue-600" />}
                    </div>
                    <div>
                      <p className="font-bold">{item.title}</p>
                      <p className="text-xs text-muted-foreground">Course ID: {item.courseId}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDelete(activeTab as string, item.id, item.title)}
                    className="p-2 text-destructive hover:bg-destructive hover:text-white rounded-xl transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}

