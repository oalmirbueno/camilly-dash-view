import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function Entregas() {
  const { data: attempts, isLoading } = useQuery({
    queryKey: ["delivery-attempts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("delivery_attempts")
        .select("*")
        .order("sent_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });

  const statusBadge = (status: string | null) => {
    switch (status) {
      case "sent": return <Badge className="bg-success text-success-foreground">Enviada</Badge>;
      case "failed": return <Badge variant="destructive">Falha</Badge>;
      case "pending": return <Badge className="bg-warning text-warning-foreground">Pendente</Badge>;
      default: return <Badge variant="secondary">{status ?? "—"}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Entregas</h1>
        <p className="text-sm text-muted-foreground mt-1">Tentativas de entrega de mensagens</p>
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
                  <TableHead>Mensagem ID</TableHead>
                  <TableHead>Rota ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Enviado em</TableHead>
                  <TableHead>Tentativas</TableHead>
                  <TableHead>Erro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attempts && attempts.length > 0 ? attempts.map((att, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-xs font-mono">{att.processed_message_id ?? "—"}</TableCell>
                    <TableCell className="text-xs font-mono">{att.route_id ?? "—"}</TableCell>
                    <TableCell>{statusBadge(att.delivery_status)}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">
                      {att.sent_at ? new Date(att.sent_at).toLocaleString("pt-BR") : "—"}
                    </TableCell>
                    <TableCell className="text-sm">{att.retry_count ?? 0}</TableCell>
                    <TableCell className="text-xs text-destructive max-w-xs truncate">
                      {att.error_message ?? "—"}
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Nenhuma tentativa de entrega encontrada
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
