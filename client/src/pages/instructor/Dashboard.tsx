import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useDashboardAnalytics } from "@/hooks/use-analytics";
import { useSocket } from "@/hooks/use-socket";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/ui/StatCard";
import { Users, AlertTriangle, BookOpen, ActivitySquare, Plus, Trash2, Mail, X } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { apiClient } from "@/lib/api-client";

const mockDistribution = [
  { name: 'High', students: 45, fill: 'hsl(var(--accent))' },
  { name: 'Medium', students: 30, fill: 'hsl(var(--primary))' },
  { name: 'Low', students: 12, fill: 'hsl(var(--destructive))' },
];

export default function InstructorDashboard() {
  const { user } = useAuth();
  const { data: analytics, isLoading } = useDashboardAnalytics();
  const { activeStudents } = useSocket();
  const [students, setStudents] = useState<any[]>([]);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [studentEmail, setStudentEmail] = useState("");
  const [studentName, setStudentName] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const response = await apiClient.get("/api/instructor/students");
      setStudents(response.data);
    } catch (err) {
      console.error("Failed to load students:", err);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    try {
      await apiClient.post("/api/instructor/add-student", { email: studentEmail, name: studentName });
      setStudentEmail("");
      setStudentName("");
      setShowAddStudent(false);
      loadStudents();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to add student");
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveStudent = async (studentId: number) => {
    if (!confirm("Are you sure you want to remove this student?")) return;
    try {
      await apiClient.delete(`/api/instructor/students/${studentId}`);
      loadStudents();
    } catch (err) {
      alert("Failed to remove student");
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-64 items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </DashboardLayout>
    );
  }

  const totalStudents = students.length || analytics?.totalStudents || 87;
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

      {/* Student Management Section */}
      <div className="mt-8 bg-card rounded-2xl p-6 mui-shadow border border-border">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-display font-bold">Manage Students</h2>
            <p className="text-sm text-muted-foreground mt-1">Add and manage students in your courses</p>
          </div>
          <button
            onClick={() => setShowAddStudent(true)}
            className="px-4 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 transition-all active:translate-y-0 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Student
          </button>
        </div>

        {/* Add Student Modal */}
        {showAddStudent && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-2xl p-6 w-full max-w-md border border-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-display font-bold">Add New Student</h3>
                <button
                  onClick={() => setShowAddStudent(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddStudent} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Student Name</label>
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                    placeholder="student@university.edu"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddStudent(false)}
                    className="flex-1 px-4 py-2.5 rounded-xl font-semibold border border-border hover:bg-muted/50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isAdding}
                    className="flex-1 px-4 py-2.5 rounded-xl font-semibold bg-primary text-primary-foreground hover:shadow-lg hover:shadow-primary/30 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                  >
                    {isAdding ? <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : "Add Student"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Student List */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 font-semibold text-foreground">Name</th>
                <th className="text-left p-3 font-semibold text-foreground">Email</th>
                <th className="text-left p-3 font-semibold text-foreground">Engagement</th>
                <th className="text-right p-3 font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center p-8 text-muted-foreground">
                    No students added yet. Click "Add Student" to get started.
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-semibold text-foreground">{student.name}</td>
                    <td className="p-3 text-muted-foreground flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {student.email}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-emerald-500 rounded-full" 
                            style={{ width: `${Math.min(student.engagementScore || 65, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-foreground">{student.engagementScore || 65}%</span>
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleRemoveStudent(student.id)}
                        className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
