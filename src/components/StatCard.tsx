import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  variant?: "default" | "success" | "warning" | "destructive";
  hint?: string;
}

const accentByVariant: Record<NonNullable<StatCardProps["variant"]>, string> = {
  default: "text-foreground",
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
};

const dotByVariant: Record<NonNullable<StatCardProps["variant"]>, string> = {
  default: "bg-gold",
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
};

export function StatCard({ title, value, icon: Icon, variant = "default", hint }: StatCardProps) {
  return (
    <Card className="card-lift relative overflow-hidden border border-border bg-card p-4 sm:p-5 group">
      {/* Top accent bar */}
      <div className={cn("absolute top-0 left-0 h-[2px] w-10", dotByVariant[variant])} />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="section-label mb-2 sm:mb-3 truncate">{title}</p>
          <p className={cn("stat-number", accentByVariant[variant])}>
            {value}
          </p>
          {hint && (
            <p className="text-[11.5px] sm:text-xs text-muted-foreground mt-2 sm:mt-2.5 font-medium leading-snug">
              {hint}
            </p>
          )}
        </div>
        <div className="shrink-0 h-9 w-9 sm:h-10 sm:w-10 flex items-center justify-center border border-border bg-background/60 text-muted-foreground group-hover:text-foreground group-hover:border-foreground/30 transition-colors">
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </Card>
  );
}
