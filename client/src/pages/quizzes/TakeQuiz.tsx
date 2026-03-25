import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuizQuestions, useCreateQuestion, useSubmitQuiz } from "@/hooks/use-quizzes";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useLocation } from "wouter";
import { Loader2, Plus, ArrowRight, CheckCircle2, ChevronLeft } from "lucide-react";
import { useNotifications } from "@/hooks/use-notifications";

export default function TakeQuiz({ params }: { params: { courseId: string, quizId: string } }) {
  const courseId = Number(params.courseId);
  const quizId = Number(params.quizId);
  const { user } = useAuth();
  const [_, setLocation] = useLocation();
  const { data: questions, isLoading } = useQuizQuestions(quizId);
  const { mutateAsync: createQuestion, isPending: isAddingQuestion } = useCreateQuestion();
  const { addNotification } = useNotifications();
  const { mutateAsync: submitQuiz, isPending: isSubmitting } = useSubmitQuiz();

  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [qText, setQText] = useState("");
  const [opts, setOpts] = useState(["", "", "", ""]);
  const [correctIdx, setCorrectIdx] = useState(0);

  const isFaculty = user?.role === "faculty" || user?.role === "admin";

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qText || opts.some(o => !o)) return;
    await createQuestion({ quizId, questionText: qText, options: opts, correctOptionIndex: correctIdx });
    setShowAddQuestion(false);
    setQText("");
    setOpts(["", "", "", ""]);
    setCorrectIdx(0);
  };

  const handleOptionSelect = (qId: number, optIdx: number) => {
    setAnswers({ ...answers, [qId]: optIdx });
  };

  const handleSubmitQuiz = async () => {
    if (!questions) return;
    if (Object.keys(answers).length < questions.length) {
      alert("Please answer all questions before submitting.");
      return;
    }
    await submitQuiz({ quizId, courseId, answers });
    
    addNotification("Quiz Submitted", "Your quiz answers have been submitted successfully.", "success", "student");
    addNotification("Student Completed Quiz", `${user?.name || "A student"} has completed a quiz.`, "info", "faculty");
    
    setLocation(`/courses/${courseId}/quizzes`);
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
      <div className="mb-8">
        <button onClick={() => setLocation(`/courses/${courseId}/quizzes`)} className="text-muted-foreground hover:text-foreground font-semibold flex items-center gap-2 mb-4">
          <ChevronLeft className="w-5 h-5" /> Back to Quizzes
        </button>
        <h1 className="text-3xl font-display font-bold text-foreground mb-2">
          {isFaculty ? "Manage Quiz Questions" : "Taking Quiz"}
        </h1>
      </div>

      <div className="max-w-3xl mx-auto space-y-8">
        {questions?.map((q: any, i: number) => {
          const options = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
          return (
            <div key={q.id} className="bg-card p-6 md:p-8 rounded-2xl border border-border mui-shadow">
              <h3 className="text-lg font-bold mb-6">
                <span className="text-primary mr-2">Q{i + 1}.</span>
                {q.questionText}
              </h3>
              <div className="space-y-3">
                {options.map((opt: string, optIdx: number) => {
                  const isSelected = answers[q.id] === optIdx;
                  return (
                    <button
                      key={optIdx}
                      disabled={isFaculty}
                      onClick={() => handleOptionSelect(q.id, optIdx)}
                      className={`w-full p-4 rounded-xl border-2 text-left font-semibold transition-all flex items-center gap-4 ${isSelected ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/50 text-foreground"}`}
                    >
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected ? "border-primary bg-primary" : "border-muted-foreground"}`}>
                        {isSelected && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                      </div>
                      {opt}
                      {isFaculty && q.correctOptionIndex === optIdx && (
                        <div className="ml-auto text-emerald-500 flex items-center gap-1.5 text-sm">
                          <CheckCircle2 className="w-4 h-4" /> Correct Answer
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {questions?.length === 0 && (
          <div className="text-center p-12 border-2 border-dashed rounded-2xl text-muted-foreground font-semibold">
             No questions have been added to this quiz yet.
          </div>
        )}

        {!isFaculty && questions?.length > 0 && (
          <button
            onClick={handleSubmitQuiz}
            disabled={isSubmitting}
            className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-2xl text-lg mui-shadow hover:shadow-primary/30 transition-all flex justify-center items-center gap-2"
          >
            {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : "Submit Answers"}
          </button>
        )}

        {isFaculty && !showAddQuestion && (
          <button
            onClick={() => setShowAddQuestion(true)}
            className="w-full py-4 border-2 border-dashed border-primary text-primary font-bold rounded-2xl text-lg hover:bg-primary/5 transition-colors flex justify-center items-center gap-2"
          >
            <Plus className="w-6 h-6" /> Add Question
          </button>
        )}

        {isFaculty && showAddQuestion && (
          <div className="bg-card p-6 rounded-2xl border border-border mui-shadow">
            <h3 className="text-xl font-bold mb-4">Add New Question</h3>
            <form onSubmit={handleCreateQuestion} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Question Text</label>
                <input
                  type="text"
                  required
                  value={qText}
                  onChange={e => setQText(e.target.value)}
                  className="w-full p-3 rounded-lg bg-muted/50 border focus:border-primary outline-none"
                  placeholder="e.g. What does HTTP stand for?"
                />
              </div>
              <div className="space-y-3">
                 <label className="block text-sm font-semibold mb-1">Options</label>
                 {opts.map((opt, i) => (
                   <div key={i} className="flex items-center gap-3">
                     <button type="button" onClick={() => setCorrectIdx(i)} className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${correctIdx === i ? "border-emerald-500 bg-emerald-500" : "border-muted-foreground hover:border-emerald-500"}`}>
                       {correctIdx === i && <CheckCircle2 className="w-4 h-4 text-white" />}
                     </button>
                     <input
                       type="text"
                       required
                       value={opt}
                       onChange={e => {
                         const n = [...opts];
                         n[i] = e.target.value;
                         setOpts(n);
                       }}
                       className="flex-1 p-3 rounded-lg bg-muted/50 border focus:border-primary outline-none"
                       placeholder={`Option ${i + 1}`}
                     />
                   </div>
                 ))}
                 <p className="text-xs text-muted-foreground mt-2">Click the circle next to the option to mark it as the correct answer.</p>
              </div>
              <div className="flex gap-3 pt-4">
                 <button disabled={isAddingQuestion} type="submit" className="flex-1 py-3 bg-primary text-primary-foreground font-bold rounded-xl flex items-center justify-center gap-2">
                   {isAddingQuestion ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Question"}
                 </button>
                 <button type="button" onClick={() => setShowAddQuestion(false)} className="flex-1 py-3 border rounded-xl font-bold hover:bg-muted">Cancel</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
