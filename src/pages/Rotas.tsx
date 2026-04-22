import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ErrorState, LoadingRows, EmptyState } from "@/components/StateViews";

type RouteRow = {
  route_id: string;
  route_name: string | null;
  active: boolean | null;
  destination_platform: string | null;
  destination_name: string | null;
  destination_identifier: string | null;
  last_sent_at: string | null;
  last_success_at: string | null;
  last_failure_at: string | null;
  attempts_24h: number | null;
  sent_24h: number | null;
  failed_24h: number | null;
};

const fmt = (v: string | null) => (v ? new Date(v).toLocaleString("pt-BR") : "—");

const channelLabel = (p: string | null) => {
  if (!p) return "—";
  if (p === "telegram") return "Telegram";
  if (p === "whatsapp") return "WhatsApp";
  return p;
};

export default function Rotas() {
  const { data, isLoading, error } = useQuery<RouteRow[]>({
    queryKey: ["vw_camilly_routes_status"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vw_camilly_routes_status" as any)
        .select("*")
        .order("active", { ascending: false })
        .order("route_name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as RouteRow[];
    },
    refetchInterval: 60000,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Rotas</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Status das rotas de entrega — atividade nas últimas 24h
        </p>
      </div>

      <div className="border border-border rounded-xl overflow-hidden bg-card">
        {error ? (
          <ErrorState error={error} source="vw_camilly_routes_status" />
        ) : isLoading ? (
          <LoadingRows count={4} />
        ) : !data || data.length === 0 ? (
          <EmptyState message="Nenhuma rota cadastrada" />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rota</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead>Identificador</TableHead>
                  <TableHead className="text-right">Tentativas 24h</TableHead>
                  <TableHead className="text-right">Enviadas 24h</TableHead>
                  <TableHead className="text-right">Falhas 24h</TableHead>
                  <TableHead>Último envio</TableHead>
                  <TableHead>Último sucesso</TableHead>
                  <TableHead>Última falha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((r) => (
                  <TableRow key={r.route_id}>
                    <TableCell className="font-medium text-sm">
                      {r.route_name ?? "—"}
                    </TableCell>
                    <TableCell>
                      {r.active ? (
                        <Badge className="bg-success text-success-foreground">Ativa</Badge>
                      ) : (
                        <Badge variant="secondary">Inativa</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{channelLabel(r.destination_platform)}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{r.destination_name ?? "—"}</TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      {r.destination_identifier ?? "—"}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {r.attempts_24h ?? 0}
                    </TableCell>
                    <TableCell className="text-right text-sm text-success font-medium">
                      {r.sent_24h ?? 0}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {Number(r.failed_24h) > 0 ? (
                        <span className="text-destructive font-medium">{r.failed_24h}</span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap">
                      {fmt(r.last_sent_at)}
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap text-success">
                      {fmt(r.last_success_at)}
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap text-destructive">
                      {fmt(r.last_failure_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
