import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

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
      case "critical": return <Badge variant="destructive">Crítico</Badge>;
      case "high": return <Badge variant="destructive">Alto</Badge>;
      case "medium": return <Badge className="bg-warning text-warning-foreground">Médio</Badge>;
      case "low": return <Badge variant="secondary">Baixo</Badge>;
      default: return <Badge variant="secondary">{severity ?? "—"}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Erros</h1>
        <p className="text-sm text-muted-foreground mt-1">Log de erros da automação</p>
      </div>

      <div className="border border-border rounded-xl overflow-hidden bg-card">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Camada</TableHead>
                  <TableHead>Severidade</TableHead>
                  <TableHead>Mensagem</TableHead>
                  <TableHead>Resolvido</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {errors && errors.length > 0 ? errors.map((err, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-xs whitespace-nowrap">
                      {err.created_at ? new Date(err.created_at).toLocaleString("pt-BR") : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{err.layer ?? "—"}</Badge>
                    </TableCell>
                    <TableCell>{severityBadge(err.severity)}</TableCell>
                    <TableCell className="text-sm max-w-md truncate">{err.error_message ?? "—"}</TableCell>
                    <TableCell>
                      {err.resolved ? (
                        <span className="text-success font-medium text-sm">Sim</span>
                      ) : (
                        <span className="text-destructive font-medium text-sm">Não</span>
                      )}
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Nenhum erro registrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
