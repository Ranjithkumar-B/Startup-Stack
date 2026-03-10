import { useState } from "react";
import { useCourses, useCreateCourse } from "@/hooks/use-courses";
import { useAuth } from "@/hooks/use-auth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { BookOpen, Search, Filter, Plus, Loader2 } from "lucide-react";

export default function CourseList() {
  const { user } = useAuth();
  const { data: courses, isLoading } = useCourses();
  const { mutateAsync: createCourse, isPending: isCreating } = useCreateCourse();
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;
    await createCourse({ title: newTitle, description: newDesc });
    setShowCreate(false);
    setNewTitle("");
    setNewDesc("");
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

  // Provide dummy data if none returned
  const displayCourses = courses?.length ? courses : [
    { id: 1, title: "Introduction to Computer Science", description: "Learn the basics of programming and algorithms.", progress: 45, instructor: "Dr. Jenkins" },
    { id: 2, title: "Advanced React Patterns", description: "Master custom hooks, performance, and architecture.", progress: 12, instructor: "Alice Smith" },
    { id: 3, title: "Data Structures", description: "Deep dive into trees, graphs, and hash maps.", progress: 88, instructor: "Bob Johnson" },
  ];

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
        {displayCourses.map((course: any) => (
          <div key={course.id} className="group bg-card rounded-2xl p-6 mui-shadow border border-border hover:mui-shadow-md transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-display font-bold text-foreground mb-2 line-clamp-1">{course.title}</h3>
            <p className="text-sm text-muted-foreground mb-6 line-clamp-2 flex-1">{course.description}</p>
            
            <div className="mt-auto">
              <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground mb-2">
                <span>Progress</span>
                <span className="text-foreground">{course.progress}%</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full" 
                  style={{ width: `${course.progress}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
