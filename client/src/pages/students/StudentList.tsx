import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Users, Mail, BookOpen, Plus, Trash2, Loader2, X, LogIn, PlayCircle, FileCheck, CheckCircle2, TrendingUp, Sparkles } from "lucide-react";
import { apiClient, fetchApi } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotifications } from "@/hooks/use-notifications";

interface StudentDetails {
  score: number;
  hours: string;
  courses: number;
  streak: number;
  breakdown: {
    logins: number;
    videoWatches: number;
    quizzes: number;
    assignments: number;
  };
}

export default function StudentsPage() {
  const { user } = useAuth();
  
  const { toast } = useToast();
  const { addNotification } = useNotifications();
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentEmail, setNewStudentEmail] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);

  const { data: details, isLoading: isLoadingDetails } = useQuery<StudentDetails>({
    queryKey: ["/api/engagement/student", selectedStudentId],
    queryFn: async () => {
      const response = await fetchApi(`/api/engagement/student/${selectedStudentId}`);
      return response;
    },
    enabled: !!selectedStudentId
  });

  const { data: students = [], isLoading } = useQuery({
    queryKey: ["/api/faculty/students"],
    queryFn: async () => {
      if (user?.role === "admin") {
        const response = await apiClient.get("/api/admin/students");
        return Array.isArray(response.data) ? response.data : [];
      }
      const response = await apiClient.get("/api/faculty/students");
      return Array.isArray(response.data) ? response.data : [];
    },
    enabled: !!user && (user.role === 'faculty' || user.role === 'admin')
  });

  const selectedStudent = students.find((s: any) => s.id === selectedStudentId);

  const addStudentMutation = useMutation({
    mutationFn: async (data: { name: string, email: string }) => {
      await apiClient.post("/api/faculty/add-student", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/faculty/students"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/dashboard"] });
      toast({ title: "Student added", description: "The student has been successfully enrolled." });
      addNotification("New Student Enrolled", `${newStudentName} has been added to your student directory.`, "success");
      setShowAddModal(false);
      setNewStudentName("");
      setNewStudentEmail("");
    },
    onError: (err: any) => {
      toast({ 
        title: "Error", 
        description: err.response?.data?.message || "Failed to add student.",
        variant: "destructive"
      });
    }
  });

  const deleteStudentMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/api/faculty/students/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/faculty/students"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/dashboard"] });
      toast({ title: "Student removed", description: "The student has been successfully deleted." });
    },
    onError: (err: any) => {
      toast({ 
        title: "Error", 
        description: err.response?.data?.message || "Failed to remove student.",
        variant: "destructive"
      });
    }
  });

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    addStudentMutation.mutate({ name: newStudentName, email: newStudentEmail });
  };

  const handleDeleteStudent = (id: number, name: string) => {
    if (confirm(`Are you sure you want to remove ${name} from your student list?`)) {
      deleteStudentMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">Student Directory</h1>
          <p className="text-muted-foreground text-lg">Manage your enrolled students and monitor their overall performance.</p>
        </div>
        {user?.role === "faculty" && (
          <button 
            onClick={() => setShowAddModal(!showAddModal)}
            className="px-6 py-3 bg-primary text-white font-bold rounded-2xl flex items-center gap-2 mui-shadow hover:-translate-y-0.5 transition-all shadow-primary/30"
          >
            {showAddModal ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {showAddModal ? "Cancel" : "Add Student"}
          </button>
        )}
      </div>

      {showAddModal && (
        <div className="mb-8 p-8 bg-card rounded-3xl border border-primary/20 mui-shadow-lg animate-in fade-in slide-in-from-top-4">
          <h2 className="text-xl font-bold mb-6">Add New Student</h2>
          <form onSubmit={handleAddStudent} className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <label className="block text-sm font-semibold mb-2">Full Name</label>
              <input 
                value={newStudentName}
                onChange={(e) => setNewStudentName(e.target.value)}
                className="w-full px-4 py-3 bg-muted border border-border rounded-xl outline-none focus:border-primary transition-colors"
                placeholder="John Doe"
                required
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-semibold mb-2">Email Address</label>
              <input 
                type="email"
                value={newStudentEmail}
                onChange={(e) => setNewStudentEmail(e.target.value)}
                className="w-full px-4 py-3 bg-muted border border-border rounded-xl outline-none focus:border-primary transition-colors"
                placeholder="john@example.com"
                required
              />
            </div>
            <div className="md:pt-7">
              <button 
                type="submit" 
                disabled={addStudentMutation.isPending}
                className="w-full h-[52px] px-8 bg-primary text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-70 transition-opacity"
              >
                {addStudentMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                Add Student
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-card rounded-2xl mui-shadow border border-border overflow-hidden">
        {students.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No students found.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {students.map((student: any) => (
              <div key={student.id} className="p-6 flex items-center justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                    {student.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">{student.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="w-3 h-3" />
                      {student.email}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  {student.engagementScore !== undefined && (
                    <div className="text-right">
                      <div className="text-sm font-semibold text-muted-foreground mb-1">Engagement Score</div>
                      <div className={`text-lg font-bold ${student.engagementScore >= 80 ? 'text-emerald-500' : student.engagementScore >= 50 ? 'text-yellow-500' : 'text-destructive'}`}>
                        {student.points}/{student.maxPoints || 100}
                      </div>
                    </div>
                  )}
                                     <button 
                      onClick={() => setSelectedStudentId(student.id)}
                      className="px-4 py-2 bg-secondary/10 text-secondary hover:bg-secondary border border-secondary/20 hover:text-white rounded-xl text-sm font-semibold transition-colors"
                    >
                     View Details
                   </button>
                  
                  {user?.role === "faculty" && (
                    <button 
                      onClick={() => handleDeleteStudent(student.id, student.name)}
                      disabled={deleteStudentMutation.isPending}
                      className="p-2.5 text-destructive bg-destructive/5 hover:bg-destructive hover:text-white rounded-xl transition-all border border-destructive/10"
                      title="Remove student"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {selectedStudentId && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card w-full max-w-xl rounded-[2.5rem] border border-border mui-shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-border flex justify-between items-center bg-muted/30">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xl">
                  {selectedStudent.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{selectedStudent.name}</h2>
                  <p className="text-muted-foreground">{selectedStudent.email}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedStudentId(null)}
                className="p-3 hover:bg-muted rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8">
              {isLoadingDetails ? (
                <div className="py-12 flex justify-center">
                  <Loader2 className="w-10 h-10 animate-spin text-primary" />
                </div>
              ) : details ? (
                <div className="space-y-8">
                  {/* Points Summary Card */}
                  <div className="bg-gradient-to-br from-primary to-primary/80 p-8 rounded-3xl text-white shadow-xl shadow-primary/20 flex justify-between items-center">
                    <div>
                      <p className="text-primary-foreground/80 font-bold uppercase tracking-widest text-xs mb-1">Total Points</p>
                      <h3 className="text-5xl font-display font-black">{(details as any).points || 0}<span className="text-xl font-bold opacity-60 ml-2">/ {(details as any).maxPoints || 100} pts</span></h3>
                    </div>
                    <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md border border-white/20">
                      <TrendingUp className="w-10 h-10" />
                    </div>
                  </div>

                  {/* Points Breakdown Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-6 bg-muted/40 rounded-3xl border border-border/50 group hover:border-primary/20 transition-colors">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-blue-500/10 text-blue-500 rounded-xl">
                          <LogIn className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-sm">Logins</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-display font-black">{details.breakdown.logins}</span>
                        <span className="text-xs font-bold text-muted-foreground uppercase">+2 pts ea.</span>
                      </div>
                    </div>

                    <div className="p-6 bg-muted/40 rounded-3xl border border-border/50 group hover:border-primary/20 transition-colors">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-red-500/10 text-red-500 rounded-xl">
                          <PlayCircle className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-sm">Videos</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-display font-black">{details.breakdown.videoWatches}</span>
                        <span className="text-xs font-bold text-muted-foreground uppercase">+3 pts ea.</span>
                      </div>
                    </div>

                    <div className="p-6 bg-muted/40 rounded-3xl border border-border/50 group hover:border-primary/20 transition-colors">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-sm">Quizzes</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-display font-black">{details.breakdown.quizzes}</span>
                        <span className="text-xs font-bold text-muted-foreground uppercase">+10 pts ea.</span>
                      </div>
                    </div>

                    <div className="p-6 bg-muted/40 rounded-3xl border border-border/50 group hover:border-primary/20 transition-colors">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-purple-500/10 text-purple-500 rounded-xl">
                          <FileCheck className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-sm">Tasks</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-display font-black">{details.breakdown.assignments}</span>
                        <span className="text-xs font-bold text-muted-foreground uppercase">+8 pts ea.</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-center pt-2">
                    <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      Student maintains a <span className="text-foreground font-bold">{details.streak} day</span> study streak
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-muted-foreground">Error loading details.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
