import { AlertCircle, Inbox } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function LoadingRows({ count = 5 }: { count?: number }) {
  return (
    <div className="p-4 space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-10" />
      ))}
    </div>
  );
}

export function EmptyState({ message = "Sem dados ainda" }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
      <Inbox className="h-8 w-8 mb-2 opacity-50" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

export function ErrorState({ error, source }: { error: unknown; source?: string }) {
  const msg = error instanceof Error ? error.message : String(error ?? "Erro desconhecido");
  return (
    <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
      <AlertCircle className="h-8 w-8 text-destructive mb-2" />
      <p className="text-sm font-medium text-foreground">Não consegui ler os dados</p>
      {source && (
        <p className="text-xs text-muted-foreground mt-1">
          Fonte: <code className="font-mono">{source}</code>
        </p>
      )}
      <p className="text-xs text-destructive mt-2 max-w-md break-words">{msg}</p>
    </div>
  );
}
