import { useAuth } from "@/hooks/use-auth";
import { useDashboardAnalytics } from "@/hooks/use-analytics";
import { useSocket } from "@/hooks/use-socket";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/ui/StatCard";
import { Users, AlertTriangle, BookOpen, ActivitySquare } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const mockDistribution = [
  { name: 'High', students: 45, fill: 'hsl(var(--accent))' },
  { name: 'Medium', students: 30, fill: 'hsl(var(--primary))' },
  { name: 'Low', students: 12, fill: 'hsl(var(--destructive))' },
];

export default function InstructorDashboard() {
  const { user } = useAuth();
  const { data: analytics, isLoading } = useDashboardAnalytics();
  const { activeStudents } = useSocket();

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-64 items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </DashboardLayout>
    );
  }

  const totalStudents = analytics?.totalStudents || 87;
  const avgEngagement = analytics?.avgEngagement || 72;
  const atRisk = analytics?.atRisk || 12;

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">Instructor Dashboard</h1>
          <p className="text-muted-foreground text-lg">Monitor your classes and student engagement.</p>
        </div>
        <button className="px-5 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl mui-shadow hover:shadow-primary/30 hover:-translate-y-0.5 transition-all">
          Create New Course
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Students" value={totalStudents} icon={Users} colorClass="text-blue-600 bg-blue-500/10" />
        <StatCard title="Avg Engagement" value={`${avgEngagement}%`} icon={ActivitySquare} colorClass="text-emerald-600 bg-emerald-500/10" />
        <StatCard title="At Risk Students" value={atRisk} icon={AlertTriangle} colorClass="text-destructive bg-destructive/10" />
        <StatCard title="Active Courses" value={3} icon={BookOpen} colorClass="text-purple-600 bg-purple-500/10" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-card rounded-2xl p-6 mui-shadow border border-border">
          <h2 className="text-xl font-display font-bold mb-6">Engagement Distribution</h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.distribution || mockDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={60}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="students" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-6 mui-shadow border border-border flex flex-col h-[400px]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-display font-bold">Live Activity</h2>
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-semibold text-emerald-600">Real-time</span>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-3">
            {activeStudents.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                <ActivitySquare className="w-10 h-10 mb-2 opacity-20" />
                <p className="text-sm font-medium">Waiting for student activity...</p>
              </div>
            ) : (
              activeStudents.map((event, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-muted/50 border border-border/50 animate-in slide-in-from-right-4 fade-in">
                  <p className="text-sm font-semibold text-foreground">{event.studentName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {event.eventType.replace('_', ' ')} in Course {event.courseId}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
