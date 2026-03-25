import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useStudentEngagement } from "@/hooks/use-engagement";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/ui/StatCard";
import { Trophy, Clock, BookOpen, Flame } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [range, setRange] = useState("7");
  const { data: engagement, isLoading } = useStudentEngagement(user?.id || 0, range);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-64 items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </DashboardLayout>
    );
  }

  // Use real data
  const score = engagement?.score || 0;
  const hours = engagement?.hours || 0;
  const courses = engagement?.courses || 0;
  const streak = engagement?.streak || 0;
  const chartData = engagement?.history || [];

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-foreground mb-2">Welcome back, {user?.name.split(' ')[0]} 👋</h1>
        <p className="text-muted-foreground text-lg mb-1">Here's your engagement overview for this week.</p>
        {engagement?.facultyName && (
           <p className="text-sm font-semibold text-primary/80 uppercase tracking-widest mt-2 bg-primary/10 inline-block px-3 py-1 rounded-full border border-primary/20">
             Faculty: {engagement.facultyName}
           </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Engagement Score" 
          value={score} 
          icon={Trophy} 
          trend={{ value: 12, isPositive: true }}
          colorClass="text-yellow-600 bg-yellow-500/10"
        />
        <StatCard 
          title="Study Time" 
          value={`${hours}h`} 
          icon={Clock} 
          trend={{ value: 5, isPositive: true }}
          colorClass="text-blue-600 bg-blue-500/10"
        />
        <StatCard 
          title="Active Courses" 
          value={courses} 
          icon={BookOpen} 
          colorClass="text-emerald-600 bg-emerald-500/10"
        />
        <StatCard 
          title="Day Streak" 
          value={streak} 
          icon={Flame} 
          colorClass="text-orange-600 bg-orange-500/10"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-card rounded-2xl p-6 mui-shadow border border-border">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-display font-bold">Engagement Trend</h2>
            <select 
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="bg-muted border-none rounded-lg px-3 py-1.5 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none"
            >
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
            </select>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-6 mui-shadow border border-border">
          <h2 className="text-xl font-display font-bold mb-6">Recent Activity</h2>
          <div className="space-y-6 relative before:absolute before:inset-y-0 before:left-4 before:w-px before:bg-border">
            {(engagement?.recentEvents || []).length > 0 ? (
              engagement.recentEvents.map((activity: any, i: number) => (
                <div key={i} className="flex gap-4 relative">
                  <div className="w-8 h-8 rounded-full bg-primary/10 border-2 border-card flex items-center justify-center shrink-0 z-10">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary"></div>
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">
                      {activity.eventType.replace('_', ' ')} (Course {activity.courseId})
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground pl-12 pb-4">No recent activity found.</p>
            )}
          </div>
          <button className="w-full mt-6 py-2.5 text-sm font-semibold text-primary bg-primary/5 hover:bg-primary/10 rounded-xl transition-colors">
            View All History
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
