import { type ComponentType, type ReactNode } from "react";
import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";

type Size = "sm" | "icon" | "default";

type Props = {
  /** Short button label (icon-only buttons use this as aria-label) */
  label: string;
  /** Optional leading icon */
  icon?: ComponentType<{ className?: string }>;
  /** What this action will do once available */
  description: ReactNode;
  /** Optional ETA / status hint shown on second line */
  hint?: ReactNode;
  size?: Size;
  iconOnly?: boolean;
  className?: string;
};

/**
 * Renders a permanently-disabled button with a tooltip explaining
 * the future action. Communicates planned functionality without
 * inventing backend behaviour.
 *
 * - Authenticated user: tooltip explains what the action *will* do.
 * - Unauthenticated user: tooltip prompts sign-in (action is gated anyway).
 */
export function FutureActionButton({
  label,
  icon: Icon,
  description,
  hint,
  size = "sm",
  iconOnly = false,
  className,
}: Props) {
  const { user } = useAuth();
  const isAuthed = !!user;

  return (
    <TooltipProvider delayDuration={120}>
      <Tooltip>
        {/* The trigger wraps a span because disabled buttons don't fire pointer events */}
        <TooltipTrigger asChild>
          <span className="inline-flex">
            <Button
              type="button"
              variant="outline"
              size={size}
              disabled
              aria-disabled="true"
              aria-label={iconOnly ? label : undefined}
              className={`rounded-none gap-1.5 text-[11px] uppercase tracking-wider font-medium opacity-70 cursor-not-allowed ${className ?? ""}`}
            >
              {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
              {!iconOnly && <span>{label}</span>}
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" align="end" className="max-w-[260px] p-3">
          <div className="flex items-start gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-wider font-semibold text-foreground">
                {label} · em breve
              </p>
              <p className="text-xs leading-snug text-muted-foreground">
                {description}
              </p>
              {hint && (
                <p className="text-[10.5px] text-muted-foreground/80 italic">
                  {hint}
                </p>
              )}
              {!isAuthed && (
                <p className="text-[10.5px] text-warning flex items-center gap-1 pt-0.5">
                  <Lock className="h-3 w-3" />
                  Requer login
                </p>
              )}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
