import { useLeaderboard } from "@/hooks/use-analytics";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Trophy, Medal, Star, Flame, Loader2, Sparkles } from "lucide-react";

export default function Leaderboard() {
  const { data: leaderboard, isLoading } = useLeaderboard();

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
      <div className="max-w-2xl mx-auto mb-20">
        <div className="mb-12 text-center">
           <div className="flex justify-center mb-6">
              <div className="p-4 rounded-full bg-primary/5 border border-primary/10">
                 <Sparkles className="w-8 h-8 text-primary animate-pulse" />
              </div>
           </div>
           <h1 className="text-5xl font-display font-black tracking-tight text-foreground mb-2">ENGAGEMENT</h1>
           <h2 className="text-3xl font-display font-bold text-primary/80 tracking-[0.2em] uppercase mb-4">Leaderboard</h2>
           <div className="h-1 w-20 bg-primary/20 mx-auto rounded-full"></div>
        </div>

        <div className="space-y-4">
          {leaderboard?.map((student: any) => (
            <div 
              key={student.id} 
              className="relative flex items-center p-3 pl-4 rounded-full bg-card border border-border/50 mui-shadow-sm hover:translate-x-1 hover:border-primary/30 transition-all group overflow-hidden"
            >
              {/* Rank Badge */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/0 group-hover:bg-primary/40 transition-all"></div>

              {/* Avatar section */}
              <div className="relative shrink-0">
                 <div className="w-16 h-16 rounded-full bg-muted border-4 border-background flex items-center justify-center font-display font-bold text-xl text-primary mui-shadow-sm group-hover:scale-105 transition-transform">
                    {student.avatarLetters}
                 </div>
                 {student.rank <= 3 && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center shadow-lg">
                       <Trophy className="w-3.5 h-3.5" />
                    </div>
                 )}
              </div>

              {/* Name and Rank */}
              <div className="flex-1 ml-6">
                 <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                    {student.name}
                 </h3>
                 <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Rank #{student.rank}</span>
                    {student.rank === 1 && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>}
                 </div>
              </div>

              {/* Score section */}
              <div className="pr-8 text-right min-w-[120px]">
                 <p className="text-3xl font-display font-black text-foreground/90 tabular-nums">
                    {student.points}
                 </p>
                 <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Score</p>
              </div>

              {/* Highlight for Top 3 */}
              {student.rank <= 3 && (
                 <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-primary/5 to-transparent pointer-events-none"></div>
              )}
            </div>
          ))}

          {(!leaderboard || leaderboard.length === 0) && (
            <div className="py-20 text-center rounded-[3rem] border-2 border-dashed border-border bg-muted/20">
              <Star className="w-12 h-12 mx-auto mb-4 opacity-10" />
              <p className="text-muted-foreground font-medium">No activity recorded yet for this period.</p>
            </div>
          )}
        </div>

        {/* Legend / Info */}
        <div className="mt-16 flex flex-wrap justify-center gap-8 opacity-60 grayscale hover:grayscale-0 transition-all duration-700">
           <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
              <Flame className="w-4 h-4 text-orange-500" /> Streaks
           </div>
           <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
              <Trophy className="w-4 h-4 text-primary" /> Top Tier
           </div>
           <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
              <Star className="w-4 h-4 text-yellow-500" /> active
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
