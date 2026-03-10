import { useAuth } from "@/hooks/use-auth";
import { useDashboardAnalytics } from "@/hooks/use-analytics";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/ui/StatCard";
import { Server, Users, BookOpen, Target } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const mockSystemTrend = [
  { name: 'Mon', logins: 1200 },
  { name: 'Tue', logins: 1350 },
  { name: 'Wed', logins: 1280 },
  { name: 'Thu', logins: 1500 },
  { name: 'Fri', logins: 1620 },
  { name: 'Sat', logins: 800 },
  { name: 'Sun', logins: 950 },
];

export default function AdminDashboard() {
  const { user } = useAuth();
  const { data: analytics, isLoading } = useDashboardAnalytics();

  if (isLoading) {
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
        <h1 className="text-3xl font-display font-bold text-foreground mb-2">Platform Admin</h1>
        <p className="text-muted-foreground text-lg">System-wide statistics and usage metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Users" value="4,250" icon={Users} colorClass="text-primary bg-primary/10" />
        <StatCard title="Active Courses" value="184" icon={BookOpen} colorClass="text-emerald-600 bg-emerald-500/10" />
        <StatCard title="Platform Score" value="82/100" icon={Target} colorClass="text-purple-600 bg-purple-500/10" />
        <StatCard title="Server Health" value="99.9%" icon={Server} colorClass="text-blue-600 bg-blue-500/10" />
      </div>

      <div className="bg-card rounded-2xl p-6 mui-shadow border border-border">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-display font-bold">System Load (Logins/Day)</h2>
        </div>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mockSystemTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorLogins" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
              <Area type="monotone" dataKey="logins" stroke="hsl(var(--secondary))" strokeWidth={3} fillOpacity={1} fill="url(#colorLogins)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </DashboardLayout>
  );
}
