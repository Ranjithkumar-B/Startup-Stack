import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLogEngagement } from "@/hooks/use-engagement";
import { fetchApi } from "@/lib/api-client";
import { Loader2, PlayCircle, ShieldCheck, ChevronLeft, Award } from "lucide-react";
import { useNotifications } from "@/hooks/use-notifications";

export default function WatchCourse({ params }: { params: { courseId: string } }) {
  const courseId = Number(params.courseId);
  const { user } = useAuth();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const { addNotification } = useNotifications();
  const { mutateAsync: logEngagement, isPending: isLogging } = useLogEngagement();


  const { data: courses, isLoading } = useQuery({
    queryKey: ["/api/courses"],
    queryFn: async () => {
      return await fetchApi("/api/courses");
    },
  });

  const course = courses?.find((c: any) => c.id === courseId);

  const getEmbedUrl = (url: string) => {
    if (!url) return "";
    
    if (url.includes("youtube.com/watch?v=")) {
      const id = url.split("v=")[1]?.split("&")[0];
      return `https://www.youtube.com/embed/${id}`;
    }
    if (url.includes("youtu.be/")) {
      const id = url.split("youtu.be/")[1]?.split("?")[0];
      return `https://www.youtube.com/embed/${id}`;
    }
    
    
    if (url.includes("vimeo.com/") && !url.includes("player.vimeo.com")) {
      const id = url.split("vimeo.com/")[1]?.split("?")[0];
      return `https://player.vimeo.com/video/${id}`;
    }
    
    return url;
  };

  const handleFinishVideo = async () => {
    try {
      await logEngagement({
        courseId,
        eventType: "video_watch",
        duration: course.duration || 30,
      });
      toast({
        title: "Video Completed! 🎉",
        description: "You've earned engagement points for completing this lesson.",
      });
      addNotification(
        "Course Activity Completed", 
        `You've successfully completed the lesson for "${course.title}" and earned points.`,
        "success",
        "student"
      );
      addNotification(
        "Student Engagement", 
        `${user?.name || "A student"} completed watching the video for "${course.title}".`,
        "info",
        "faculty"
      );
    } catch (err: any) {
      toast({
        title: "Already completed",
        description: err.response?.data?.message || err.message || "You have already completed this lesson.",
        variant: "default",
      });
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

  if (!course) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">Course not found.</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto mb-10">
        <button onClick={() => setLocation("/courses")} className="text-muted-foreground hover:text-foreground font-semibold flex items-center gap-2 mb-6">
          <ChevronLeft className="w-5 h-5" /> Back to Courses
        </button>

        <div className="flex items-center gap-3 mb-4">
          <PlayCircle className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-display font-bold text-foreground">{course.title}</h1>
        </div>
        <p className="text-muted-foreground text-lg mb-8">{course.description}</p>

        {course.videoUrl ? (
          <div className="bg-card p-4 md:p-6 rounded-3xl mui-shadow border border-border">
            <div className="relative w-full overflow-hidden rounded-2xl bg-black" style={{ paddingTop: "56.25%" }}>
              <iframe
                src={getEmbedUrl(course.videoUrl)}
                title={course.title}
                className="absolute top-0 left-0 w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            
            {user?.role === "student" && (
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleFinishVideo}
                  disabled={isLogging}
                  className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 transition-all flex items-center gap-2"
                >
                  {isLogging ? <Loader2 className="w-5 h-5 animate-spin" /> : <Award className="w-5 h-5" />}
                  Mark Complete & Earn Points
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center p-16 border-2 border-dashed rounded-3xl border-border bg-muted/20">
            <ShieldCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">No Video Available</h3>
            <p className="text-muted-foreground">The faculty has not uploaded a video for this course yet.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
