import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2 } from "lucide-react";
import { FutureActionButton } from "@/components/FutureActionButton";

export default function Erros() {
  const { data: errors, isLoading } = useQuery({
    queryKey: ["error-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("error_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });

  const severityBadge = (severity: string | null) => {
    switch (severity) {
      case "critical": return <Badge variant="destructive" className="rounded-none">Crítico</Badge>;
      case "high": return <Badge variant="destructive" className="rounded-none">Alto</Badge>;
      case "medium": return <Badge className="bg-warning text-warning-foreground rounded-none">Médio</Badge>;
      case "low": return <Badge variant="secondary" className="rounded-none">Baixo</Badge>;
      default: return <Badge variant="secondary" className="rounded-none">{severity ?? ""}</Badge>;
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="sparkle-dot" />
          <p className="section-label">Saúde · Diagnóstico</p>
        </div>
        <h1 className="font-display text-foreground">Erros</h1>
        <p className="body-text max-w-xl">
          Log de erros da automação — atualizado a cada 30s.
        </p>
        <div className="line-gold mt-1" />
      </header>

      <div className="border border-border bg-card overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
          </div>
        ) : !errors || errors.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            Nenhum erro registrado
          </p>
        ) : (
          <>
            {/* MOBILE */}
            <div className="md:hidden divide-y divide-border">
              {errors.map((err, i) => (
                <article key={i} className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {severityBadge(err.severity)}
                      <Badge variant="outline" className="rounded-none text-[10px]">
                        {err.layer ?? ""}
                      </Badge>
                      {err.resolved ? (
                        <Badge className="bg-success text-success-foreground rounded-none text-[10px]">
                          Resolvido
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="rounded-none text-[10px]">
                          Aberto
                        </Badge>
                      )}
                    </div>
                    <time className="text-[10.5px] text-muted-foreground tracking-wider uppercase whitespace-nowrap">
                      {err.created_at ? new Date(err.created_at).toLocaleString("pt-BR") : ""}
                    </time>
                  </div>
                  <p className="text-[13.5px] leading-relaxed text-foreground break-words">
                    {err.error_message ?? ""}
                  </p>
                  {!err.resolved && (
                    <div className="pt-1">
                      <FutureActionButton
                        label="Marcar como resolvido"
                        icon={CheckCircle2}
                        description="Quando estiver pronto, este botão tira o erro da lista de pendências, mostrando que ele já foi tratado."
                      />
                    </div>
                  )}
                </article>
              ))}
            </div>

            {/* DESKTOP */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Camada</TableHead>
                    <TableHead>Severidade</TableHead>
                    <TableHead>Mensagem</TableHead>
                    <TableHead>Resolvido</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {errors.map((err, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs whitespace-nowrap">
                        {err.created_at ? new Date(err.created_at).toLocaleString("pt-BR") : ""}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="rounded-none">{err.layer ?? ""}</Badge>
                      </TableCell>
                      <TableCell>{severityBadge(err.severity)}</TableCell>
                      <TableCell className="text-sm max-w-md truncate">{err.error_message ?? ""}</TableCell>
                      <TableCell>
                        {err.resolved ? (
                          <span className="text-success font-medium text-sm">Sim</span>
                        ) : (
                          <span className="text-destructive font-medium text-sm">Não</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {!err.resolved && (
                          <FutureActionButton
                            label="Marcar como resolvido"
                            icon={CheckCircle2}
                            description="Quando estiver pronto, este botão tira o erro da lista de pendências, mostrando que ele já foi tratado."
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
