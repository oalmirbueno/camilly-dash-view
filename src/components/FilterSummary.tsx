import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type SummaryStat = {
  label: string;
  value: number | string;
  tone?: "default" | "success" | "destructive" | "warning" | "muted";
};

export type ActiveChip = {
  key: string;
  label: string; // e.g. "Status: Enviada"
  onClear: () => void;
};

type Props = {
  stats: SummaryStat[];
  chips: ActiveChip[];
  onClearAll: () => void;
  totalLabel?: string;
};

const toneClass = (tone: SummaryStat["tone"]) => {
  switch (tone) {
    case "success":
      return "text-success";
    case "destructive":
      return "text-destructive";
    case "warning":
      return "text-warning";
    case "muted":
      return "text-muted-foreground";
    default:
      return "text-foreground";
  }
};

export function FilterSummary({ stats, chips, onClearAll, totalLabel }: Props) {
  const hasChips = chips.length > 0;

  return (
    <section
      aria-label="Resumo dos filtros"
      className="border border-border bg-card/60 backdrop-blur-sm"
    >
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-border">
        {stats.map((s, i) => (
          <div
            key={`${s.label}-${i}`}
            className="px-4 py-3 sm:py-3.5 flex flex-col gap-0.5 min-w-0"
          >
            <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-medium truncate">
              {s.label}
            </span>
            <span
              className={`font-display text-xl sm:text-2xl leading-none ${toneClass(s.tone)}`}
            >
              {s.value}
            </span>
          </div>
        ))}
      </div>

      {/* Chips row */}
      {(hasChips || totalLabel) && (
        <div className="border-t border-border px-3 sm:px-4 py-2.5 flex flex-wrap items-center gap-1.5">
          {totalLabel && (
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground mr-1">
              {totalLabel}
            </span>
          )}
          {chips.map((c) => (
            <Badge
              key={c.key}
              variant="outline"
              className="rounded-none gap-1 pr-1 pl-2 py-0.5 text-[11px] font-normal border-border"
            >
              {c.label}
              <button
                type="button"
                onClick={c.onClear}
                aria-label={`Remover filtro ${c.label}`}
                className="ml-0.5 inline-flex h-4 w-4 items-center justify-center hover:bg-muted transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {hasChips && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearAll}
              className="h-6 px-2 text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground rounded-none ml-auto"
            >
              Limpar tudo
            </Button>
          )}
        </div>
      )}
    </section>
  );
}
