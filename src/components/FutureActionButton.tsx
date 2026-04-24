import { type ComponentType, type ReactNode } from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAuth } from "@/hooks/use-auth";

type Props = {
  /** Short button label (icon-only buttons use this as aria-label) */
  label: string;
  /** Optional leading icon */
  icon?: ComponentType<{ className?: string }>;
  /** Plain-language explanation: what this button will do once available */
  description: ReactNode;
  iconOnly?: boolean;
  className?: string;
};

/**
 * "Em breve" button - clearly marked as not-yet-available.
 *
 * - Always disabled, but clickable (via wrapping span) so non-technical
 *   users get a friendly popover explaining what it does.
 * - Works on touch (popover on tap) and mouse (popover on click).
 * - "Em breve" tag is always visible, no need to hover to discover it.
 */
export function FutureActionButton({
  label,
  icon: Icon,
  description,
  iconOnly = false,
  className,
}: Props) {
  const { user } = useAuth();
  const isAuthed = !!user;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label={iconOnly ? `${label} (em breve)` : undefined}
          className={`rounded-none gap-1.5 h-8 text-xs font-medium border-dashed text-muted-foreground hover:text-foreground hover:border-border ${className ?? ""}`}
        >
          {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
          {!iconOnly && <span>{label}</span>}
          <span
            aria-hidden
            className="ml-1 px-1.5 py-px text-[9px] uppercase tracking-wider bg-muted text-muted-foreground/90 font-semibold leading-none flex items-center"
          >
            Em breve
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="end"
        className="w-64 p-3 rounded-none border-border"
      >
        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground leading-tight">
            {label}
          </p>
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            {description}
          </p>
          <p className="text-[11px] text-muted-foreground/80 pt-1 border-t border-border">
            Este botão ainda não está pronto. Quando ficar, ele funciona aqui mesmo, sem instalar nada.
          </p>
          {!isAuthed && (
            <p className="text-[11px] text-warning flex items-center gap-1.5 pt-1">
              <Lock className="h-3 w-3" />
              Você precisa entrar para usar.
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
