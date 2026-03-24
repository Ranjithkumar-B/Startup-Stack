 import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuizzes, useCreateQuiz, useDeleteQuiz } from "@/hooks/use-quizzes";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useLocation } from "wouter";
import { BookOpen, Plus, Loader2, List, PlayCircle, ShieldCheck, Trash2 } from "lucide-react";

export default function CourseQuizzes({ params }: { params: { courseId: string } }) {
  const courseId = Number(params.courseId);
  const { user } = useAuth();
  const [_, setLocation] = useLocation();
  const { data: quizzes, isLoading } = useQuizzes(courseId);
  const { mutateAsync: createQuiz, isPending: isCreating } = useCreateQuiz();
  const { mutateAsync: deleteQuiz } = useDeleteQuiz();

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const isInstructor = user?.role === "instructor" || user?.role === "admin";

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    await createQuiz({ courseId, title, description });
    setShowCreate(false);
    setTitle("");
    setDescription("");
  };

  const handleDelete = async (e: React.MouseEvent, quizId: number) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this quiz? All questions and student submissions will be lost.")) return;
    
    setDeletingId(quizId);
    try {
      await deleteQuiz({ quizId, courseId });
    } catch {
      alert("Failed to delete quiz.");
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-64 items-center justify-center">
           <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-2 flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-primary" />
            Course Quizzes
          </h1>
          <p className="text-muted-foreground text-lg">Manage and take course quizzes</p>
        </div>
        
        {isInstructor && (
          <button
            onClick={() => setShowCreate(true)}
            className="px-5 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl mui-shadow hover:shadow-primary/30 hover:-translate-y-0.5 transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Quiz
          </button>
        )}
      </div>

      {showCreate && isInstructor && (
        <div className="bg-card p-6 rounded-2xl border border-border mui-shadow mb-8 animate-in fade-in">
          <h2 className="text-xl font-bold mb-4">Create New Quiz</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Title</label>
              <input
                type="text"
                className="w-full p-3 rounded-lg bg-muted/50 border outline-none focus:border-primary"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Quiz Title"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Description</label>
              <textarea
                className="w-full p-3 rounded-lg bg-muted/50 border outline-none focus:border-primary"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Quiz Description"
              />
            </div>
            <div className="flex gap-3">
              <button disabled={isCreating} type="submit" className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-bold flex items-center gap-2">
                {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                Create
              </button>
              <button type="button" onClick={() => setShowCreate(false)} className="px-5 py-2.5 border rounded-lg font-bold hover:bg-muted">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quizzes?.map((quiz: any) => (
          <div key={quiz.id} className="bg-card p-6 rounded-2xl border border-border hover:border-primary/50 transition-colors mui-shadow group relative">
            {isInstructor && (
              <button 
                onClick={(e) => handleDelete(e, quiz.id)}
                disabled={deletingId === quiz.id}
                className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                title="Delete Quiz"
              >
                {deletingId === quiz.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
            )}
            <h3 className="text-xl font-bold mb-2 text-foreground pr-8">{quiz.title}</h3>
            <p className="text-muted-foreground mb-6 line-clamp-2 min-h-12">{quiz.description}</p>
            
            {quiz.isSubmitted && !isInstructor ? (
              <div className="bg-emerald-500/10 text-emerald-600 font-bold p-3 rounded-xl flex items-center justify-between">
                <span>Completed</span>
                <span className="text-lg">{quiz.score}%</span>
              </div>
            ) : (
              <button
                onClick={() => setLocation(`/courses/${courseId}/quizzes/${quiz.id}`)}
                className="w-full py-3 bg-muted group-hover:bg-primary group-hover:text-primary-foreground text-foreground rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
              >
                {isInstructor ? (
                  <><List className="w-5 h-5" /> Manage Questions</>
                ) : (
                  <><PlayCircle className="w-5 h-5" /> Start Quiz</>
                )}
              </button>
            )}
          </div>
        ))}
        {quizzes?.length === 0 && (
          <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center p-12 border-2 border-dashed rounded-2xl text-muted-foreground">
             No quizzes available for this course yet.
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
