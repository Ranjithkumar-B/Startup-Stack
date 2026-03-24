import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useCourses, useCreateCourse, useDeleteCourse } from "@/hooks/use-courses";
import { useAuth } from "@/hooks/use-auth";
import { useLogEngagement } from "@/hooks/use-engagement";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/hooks/use-notifications";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { BookOpen, Search, Filter, Plus, Loader2, Youtube, PlayCircle, Trash2 } from "lucide-react";

export default function CourseList() {
  const { user } = useAuth();
  const { data: courses, isLoading } = useCourses();
  const { mutateAsync: createCourse, isPending: isCreating } = useCreateCourse();
  const { mutateAsync: deleteCourse } = useDeleteCourse();
  const { mutateAsync: logEngagement } = useLogEngagement();
  const { toast } = useToast();
  const { addNotification } = useNotifications();
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [studyingCourse, setStudyingCourse] = useState<number | null>(null);
  const [deletingCourse, setDeletingCourse] = useState<number | null>(null);
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const [location] = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    if (q) {
      setLocalSearchQuery(q);
    }
  }, [location, window.location.search]);

  const handleDelete = async (e: React.MouseEvent, courseId: number) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this course? This will also remove the course and all its progress for your students.")) return;
    
    setDeletingCourse(courseId);
    try {
      await deleteCourse(courseId);
      toast({
        title: "Course deleted",
        description: "The course has been successfully removed.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete course.",
        variant: "destructive",
      });
    } finally {
      setDeletingCourse(null);
    }
  };

  const handleStudy = async (e: React.MouseEvent, courseId: number, durationMinutes: number = 30) => {
    e.stopPropagation();
    setStudyingCourse(courseId);
    try {
      await logEngagement({
        courseId,
        eventType: "video_watch",
        duration: durationMinutes,
      });
      toast({
        title: "Study session complete! 🎉",
        description: `Logged ${durationMinutes} minutes of study time and earned engagement points.`,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to log study session.",
        variant: "destructive",
      });
    } finally {
      setStudyingCourse(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;
    await createCourse({ title: newTitle, description: newDesc, videoUrl: newUrl });
    toast({ title: "Success", description: "Course created successfully" });
    addNotification("Course Published", `A new course "${newTitle}" has been successfully added to the catalog.`, "success");
    setShowCreate(false);
    setNewTitle("");
    setNewDesc("");
    setNewUrl("");
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

  const visibleCourses = (courses || []).filter((c: any) => 
    c.title.toLowerCase().includes(localSearchQuery.toLowerCase()) || 
    c.description.toLowerCase().includes(localSearchQuery.toLowerCase())
  );
  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">Courses</h1>
          <p className="text-muted-foreground text-lg">Browse and manage learning materials.</p>
        </div>
        
        <div className="flex gap-3">
          <button className="p-2.5 rounded-xl border border-border text-foreground hover:bg-muted transition-colors mui-shadow">
            <Filter className="w-5 h-5" />
          </button>
          
          {(user?.role === "instructor" || user?.role === "admin") && (
            <button 
              onClick={() => setShowCreate(true)}
              className="px-5 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl mui-shadow flex items-center gap-2 hover:shadow-primary/30 hover:-translate-y-0.5 transition-all"
            >
              <Plus className="w-5 h-5" />
              New Course
            </button>
          )}
        </div>
      </div>

      {showCreate && (
        <div className="mb-8 bg-card rounded-2xl p-6 mui-shadow border border-border animate-in fade-in slide-in-from-top-4">
          <h2 className="text-xl font-display font-bold mb-4">Create New Course</h2>
          <form onSubmit={handleCreate} className="space-y-4 max-w-2xl">
            <div>
              <label className="block text-sm font-semibold mb-1.5">Course Title</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-border focus:bg-background focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">Description</label>
              <textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-border focus:bg-background focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all min-h-[100px]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5 flex items-center gap-2"><Youtube className="w-4 h-4 text-red-500" /> Video URL (YouTube, Vimeo)</label>
              <input
                type="text"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="YouTube link or Embed URL"
                className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-border focus:bg-background focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-5 py-2.5 rounded-xl font-semibold bg-muted text-foreground hover:bg-border transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreating}
                className="px-5 py-2.5 rounded-xl font-semibold bg-primary text-primary-foreground mui-shadow hover:shadow-md flex items-center gap-2 disabled:opacity-70"
              >
                {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Course"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleCourses.length > 0 ? (
          visibleCourses.map((course: any) => (
            <div key={course.id} className="group bg-card rounded-2xl p-6 mui-shadow border border-border hover:mui-shadow-md transition-all duration-300 hover:-translate-y-1 flex flex-col relative">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div className="flex gap-2 relative z-10">
                  <a 
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(course.title + ' course tutorial full')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Watch related videos on YouTube"
                    className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all hover:scale-110 mui-shadow"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Youtube className="w-5 h-5" />
                  </a>
                  
                  {user?.role === 'instructor' && (
                    <button
                      onClick={(e) => handleDelete(e, course.id)}
                      disabled={deletingCourse === course.id}
                      title="Delete course"
                      className="w-10 h-10 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 flex items-center justify-center hover:bg-destructive hover:text-white transition-all hover:scale-110 mui-shadow disabled:opacity-50 disabled:hover:scale-100"
                    >
                      {deletingCourse === course.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>
              <h3 className="text-xl font-display font-bold text-foreground mb-2 line-clamp-1">{course.title}</h3>
              <p className="text-sm text-muted-foreground mb-6 line-clamp-2 flex-1">{course.description}</p>
              
              <div className="mt-auto">
                <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground mb-2">
                  <span>Progress</span>
                  <span className="text-foreground">{course.progress}%</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-4">
                  <div 
                    className="h-full bg-primary rounded-full" 
                    style={{ width: `${course.progress}%` }}
                  ></div>
                </div>
                
                {user?.role === 'student' && (
                  <button
                    onClick={(e) => { e.stopPropagation(); window.location.href = `/courses/${course.id}/watch`; }}
                    className="w-full py-2.5 rounded-xl font-semibold bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all flex items-center justify-center gap-2"
                  >
                    <PlayCircle className="w-4 h-4" />
                    Watch Video & Study
                  </button>
                )}
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = `/courses/${course.id}/quizzes`;
                  }}
                  className="w-full mt-2 py-2.5 rounded-xl font-semibold bg-muted hover:bg-border text-foreground transition-all flex items-center justify-center gap-2"
                >
                  <BookOpen className="w-4 h-4" />
                  View Quizzes
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-16 text-center rounded-[2rem] border-2 border-dashed border-border bg-muted/20">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-muted-foreground font-medium text-lg">No courses found.</p>
            {localSearchQuery && (
              <p className="text-sm text-muted-foreground/70 mt-2">Try adjusting your search filters.</p>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
