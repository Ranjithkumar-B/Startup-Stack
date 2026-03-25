import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useNotifications } from "@/hooks/use-notifications";
import { useToast } from "@/hooks/use-toast";
import { fetchApi } from "@/lib/api-client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ClipboardList, Plus, FileText, Send, Loader2, CheckCircle2, Trash2, X, Pencil } from "lucide-react";
import { useCourses } from "@/hooks/use-courses";

export default function Tasks() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [editTaskId, setEditTaskId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [courseId, setCourseId] = useState("");
  
  const [submittingTask, setSubmittingTask] = useState<number | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const { data: courses } = useCourses();
  
  const { data: tasks, isLoading } = useQuery({
    queryKey: ["/api/tasks"],
    queryFn: async () => await fetchApi("/api/tasks")
  });

  const { data: submissions } = useQuery({
    queryKey: ["/api/tasks/submissions"],
    queryFn: async () => await fetchApi("/api/tasks/submissions"),
    enabled: user?.role === 'faculty'
  });

  const createTask = useMutation({
    mutationFn: async (newTask: any) => await fetchApi("/api/tasks", { method: "POST", body: JSON.stringify(newTask) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Task added successfully!" });
      resetForm();
    }
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => 
      await fetchApi(`/api/tasks/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Task updated! 🪄" });
      resetForm();
    }
  });

  const resetForm = () => {
    setShowAdd(false);
    setEditTaskId(null);
    setTitle("");
    setDescription("");
    setCourseId("");
  };

  const deleteTask = useMutation({
    mutationFn: async (taskId: number) => await fetchApi(`/api/tasks/${taskId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/submissions"] });
      toast({ title: "Task deleted successfully!" });
    }
  });

  const gradeSubmission = useMutation({
    mutationFn: async ({ submissionId, grade, feedback }: { submissionId: number, grade: number, feedback: string }) => {
      return await fetchApi(`/api/tasks/submissions/${submissionId}/grade`, {
        method: "POST",
        body: JSON.stringify({ grade, feedback }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/submissions"] });
      toast({ title: "Grade submitted! 📝" });
    }
  });

  const submitTask = useMutation({
    mutationFn: async ({ taskId, file }: { taskId: number, file: File }) => {
      const formData = new FormData();
      formData.append("pdf", file);
      
      const res = await fetchApi(`/api/tasks/${taskId}/submit`, {
        method: "POST",
        body: formData,
      });
      return res;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/engagement/student"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/leaderboard"] });
      
      const task = tasks?.find((t: any) => t.id === variables.taskId);
      const course = courses?.find((c: any) => c.id === task?.courseId);

      addNotification(
        "Task Submitted", 
        `You've successfully submitted the project for "${task?.title || 'a topic'}" and earned points.`,
        "success",
        "student",
        user?.id
      );

      if (course?.facultyId) {
        addNotification(
          "Student Submission", 
          `${user?.name || "A student"} submitted a project for "${task?.title || 'a topic'}".`,
          "info",
          "faculty",
          course.facultyId
        );
      }

      toast({ title: "Task submitted! Points awarded! 🎉" });
      setSubmittingTask(null);
      setPdfFile(null);
    }
  });

  const handleGradeSubmit = (e: React.FormEvent, subId: number) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const grade = Number(formData.get("grade"));
    const feedback = String(formData.get("feedback"));
    gradeSubmission.mutate({ submissionId: subId, grade, feedback });
  };



  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId) return toast({ title: "Please select a course", variant: "destructive" });
    
    const taskData = { courseId: Number(courseId), title, description };
    if (editTaskId) {
      updateTask.mutate({ id: editTaskId, data: taskData });
    } else {
      createTask.mutate(taskData);
    }
  };

  const handleEditClick = (task: any) => {
    setEditTaskId(task.id);
    setTitle(task.title);
    setDescription(task.description);
    setCourseId(task.courseId.toString());
    setShowAdd(true);
  };

  const handleTaskSubmit = (e: React.FormEvent, taskId: number) => {
    e.preventDefault();
    if (!pdfFile) return toast({ title: "Select a valid PDF first", variant: "destructive" });
    submitTask.mutate({ taskId, file: pdfFile });
  };

  if (isLoading) return <DashboardLayout><div className="flex h-[50vh] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">Workspace Tasks</h1>
          <p className="text-muted-foreground text-lg">
            {user?.role === 'faculty' ? 'Manage topics and assignments as faculty.' : 'Submit your topics as PDF projects to earn points!'}
          </p>
        </div>
        {user?.role === 'faculty' && (
          <button onClick={() => { resetForm(); setShowAdd(!showAdd); }} className="px-5 py-2.5 rounded-xl font-semibold bg-primary text-primary-foreground flex items-center gap-2 mui-shadow hover:mui-shadow-md transition-all">
            <Plus className="w-5 h-5" /> Add New Topic
          </button>
        )}
      </div>

      {showAdd && user?.role === 'faculty' && (
        <div className="bg-card rounded-2xl p-6 mb-8 mui-shadow-md border border-border animate-in fade-in slide-in-from-top-4">
          <h2 className="text-xl font-bold mb-4">{editTaskId ? 'Edit Topic' : 'Create New Topic'}</h2>
          <form onSubmit={handleCreateTask} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5">Select Course</label>
              <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-border outline-none focus:ring-2 focus:ring-primary/20" required>
                <option value="">-- Choose Course --</option>
                {courses?.map((c: any) => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">Topic Title</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-border outline-none focus:ring-2 focus:ring-primary/20" required />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-border outline-none focus:ring-2 focus:ring-primary/20" rows={3} required />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => resetForm()} className="px-4 py-2 rounded-xl bg-muted font-semibold hover:bg-border transition-colors">Cancel</button>
              <button type="submit" disabled={createTask.isPending || updateTask.isPending} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center gap-2 disabled:opacity-50">
                {(createTask.isPending || updateTask.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : (editTaskId ? 'Update Topic' : 'Save Topic')}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tasks?.length > 0 ? tasks.map((task: any) => {
          const course = courses?.find((c: any) => c.id === task.courseId);
          return (
            <div key={task.id} className="bg-card rounded-2xl p-6 mui-shadow border border-border hover:mui-shadow-md transition-all flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-foreground line-clamp-1">{task.title}</h3>
                  <p className="text-xs text-muted-foreground">{course?.title || 'Unknown Course'}</p>
                </div>
                {user?.role === 'faculty' && (
                  <div className="flex items-center gap-2 self-start ml-auto">
                    <button 
                      onClick={() => handleEditClick(task)}
                      title="Edit topic"
                      className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => {
                          if (confirm("Are you sure you want to delete this task? All student submissions will be lost.")) {
                              deleteTask.mutate(task.id);
                          }
                      }}
                      disabled={deleteTask.isPending}
                      title="Delete topic"
                      className="w-8 h-8 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive hover:text-white transition-all"
                    >
                      {deleteTask.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                )}
              </div> {/* End Header Div */}

              {submittingTask === task.id ? (
                <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                  <div className="p-4 rounded-xl bg-muted/40 border border-border/50 mb-6 group-hover:bg-muted transition-colors">
                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-primary/60 mb-2">Detailed Topic</h4>
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{task.description}</p>
                  </div>
                  
                  {user?.role === 'student' && (
                    <div className="border-t border-border pt-6 mt-4">
                      <h4 className="text-xs font-black uppercase tracking-[0.2em] text-primary/60 mb-4">Submit PDF Project</h4>
                      <form onSubmit={(e) => handleTaskSubmit(e, task.id)} className="flex items-center gap-2">
                        <input 
                          type="file" 
                          accept=".pdf"
                          onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                          className="w-full text-xs px-3 py-2 rounded-lg bg-background border border-border outline-none focus:ring-2 focus:ring-primary/20 file:mr-4 file:py-1 file:px-3 file:rounded-xl file:border-0 file:bg-primary file:text-white file:font-semibold"
                          required
                        />
                        <button type="submit" disabled={submitTask.isPending} className="p-2.5 bg-primary text-white rounded-lg hover:opacity-90 mui-shadow transition-all flex-shrink-0">
                          {submitTask.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-5 h-5" />}
                        </button>
                        <button type="button" onClick={() => setSubmittingTask(null)} className="p-2 text-muted-foreground hover:text-foreground">
                          <X className="w-5 h-5" />
                        </button>
                      </form>
                      <p className="text-[10px] text-muted-foreground mt-2 font-medium">Earn 8 points upon successful submission.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-auto pt-6 flex flex-col gap-4">
                  {user?.role === 'student' && (
                    <button 
                      onClick={() => setSubmittingTask(task.id)}
                      className="w-full py-3.5 rounded-xl font-black uppercase tracking-widest text-xs bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground mui-shadow-sm transition-all flex gap-3 justify-center items-center group"
                    >
                      Process Assignment <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  )}
                  {user?.role === 'faculty' && (
                     <div className="p-4 rounded-xl bg-muted/30 border border-border/40 italic text-sm text-muted-foreground">
                       {task.description}
                     </div>
                  )}
                </div>
              )}

              {user?.role === 'faculty' && submissions && (
                <div className="mt-auto border-t border-border pt-4">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Submissions</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                    {submissions.filter((s: any) => s.taskId === task.id).map((sub: any) => (
                      <div key={sub.id} className="flex flex-col gap-3 p-3 rounded-lg bg-muted/50 border border-border/50 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-foreground truncate max-w-[120px]">{sub.studentName}</span>
                          <a href={sub.pdfUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline font-medium text-xs">
                            <FileText className="w-3 h-3" /> View Doc
                          </a>
                        </div>
                        
                        {sub.grade !== undefined && sub.grade !== null ? (
                          <div className="flex items-center gap-2 bg-primary/10 text-primary px-2 py-1.5 rounded-lg border border-primary/20">
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="font-bold text-xs uppercase tracking-wider">Grade: {sub.grade}/100</span>
                          </div>
                        ) : (
                          <form onSubmit={(e) => handleGradeSubmit(e, sub.id)} className="flex items-center gap-2">
                            <input 
                              type="number" 
                              name="grade" 
                              placeholder="Grade (0-100)" 
                              className="w-20 px-2 py-1.5 text-xs rounded-lg bg-background border border-border outline-none focus:ring-1 focus:ring-primary/20"
                              min="0"
                              max="100"
                              required
                            />
                            <input 
                              type="text" 
                              name="feedback" 
                              placeholder="Feedback" 
                              className="flex-1 px-2 py-1.5 text-xs rounded-lg bg-background border border-border outline-none focus:ring-1 focus:ring-primary/20"
                            />
                            <button 
                              type="submit" 
                              disabled={gradeSubmission.isPending}
                              className="p-1.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all disabled:opacity-50"
                            >
                              {gradeSubmission.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                            </button>
                          </form>
                        )}
                      </div>
                    ))}
                    {submissions.filter((s: any) => s.taskId === task.id).length === 0 && (
                      <p className="text-xs text-muted-foreground italic">No submissions yet.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        }) : (
          <div className="col-span-full text-center py-16 bg-muted/20 border-2 border-dashed border-border rounded-3xl">
            <ClipboardList className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-lg font-bold text-muted-foreground">No topics found.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
