import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  colorClass?: string;
  className?: string;
}

export function StatCard({ title, value, icon: Icon, trend, colorClass = "text-primary bg-primary/10", className }: StatCardProps) {
  return (
    <div className={cn("bg-card rounded-2xl p-6 mui-shadow border border-border hover:mui-shadow-md transition-shadow duration-300", className)}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          <h3 className="text-3xl font-display font-bold text-foreground">{value}</h3>
          
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span className={cn("text-xs font-semibold", trend.isPositive ? "text-emerald-500" : "text-destructive")}>
                {trend.isPositive ? "+" : "-"}{Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-muted-foreground">vs last month</span>
            </div>
          )}
        </div>
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", colorClass)}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
