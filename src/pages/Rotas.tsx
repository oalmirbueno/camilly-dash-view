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

const fmt = (v: string | null) => (v ? new Date(v).toLocaleString("pt-BR") : "");

const channelLabel = (p: string | null) => {
  if (!p) return "";
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
    <div className="space-y-6 sm:space-y-8">
      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="sparkle-dot" />
          <p className="section-label">Infraestrutura · Distribuição</p>
        </div>
        <h1 className="font-display text-foreground">Rotas</h1>
        <p className="body-text max-w-xl">
          Status das rotas de entrega — atividade nas últimas 24h.
        </p>
        <div className="line-gold mt-1" />
      </header>

      <div className="border border-border bg-card overflow-hidden">
        {error ? (
          <ErrorState error={error} source="vw_camilly_routes_status" />
        ) : isLoading ? (
          <LoadingRows count={4} />
        ) : !data || data.length === 0 ? (
          <EmptyState message="Nenhuma rota cadastrada" />
        ) : (
          <>
            {/* MOBILE: cards */}
            <div className="md:hidden divide-y divide-border">
              {data.map((r) => (
                <article key={r.route_id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-display text-base text-foreground leading-tight truncate">
                        {r.route_name ?? ""}
                      </h3>
                      <p className="text-[11px] text-muted-foreground mt-0.5 tracking-wider uppercase">
                        {channelLabel(r.destination_platform)} · {r.destination_name ?? ""}
                      </p>
                    </div>
                    {r.active ? (
                      <Badge className="bg-success text-success-foreground rounded-none shrink-0">Ativa</Badge>
                    ) : (
                      <Badge variant="secondary" className="rounded-none shrink-0">Inativa</Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <Metric label="Tentativas" value={r.attempts_24h ?? 0} />
                    <Metric label="Enviadas" value={r.sent_24h ?? 0} tone="success" />
                    <Metric
                      label="Falhas"
                      value={r.failed_24h ?? 0}
                      tone={Number(r.failed_24h) > 0 ? "destructive" : "muted"}
                    />
                  </div>

                  <dl className="space-y-1 pt-1 border-t border-border/60">
                    <div className="data-row">
                      <dt>Último envio</dt>
                      <dd>{fmt(r.last_sent_at)}</dd>
                    </div>
                    <div className="data-row">
                      <dt>Último sucesso</dt>
                      <dd className="text-success">{fmt(r.last_success_at)}</dd>
                    </div>
                    <div className="data-row">
                      <dt>Última falha</dt>
                      <dd className="text-destructive">{fmt(r.last_failure_at)}</dd>
                    </div>
                    {r.destination_identifier && (
                      <div className="data-row">
                        <dt>Identificador</dt>
                        <dd className="font-mono text-[11px] break-all">{r.destination_identifier}</dd>
                      </div>
                    )}
                  </dl>
                </article>
              ))}
            </div>

            {/* DESKTOP: tabela completa */}
            <div className="hidden md:block overflow-x-auto">
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
                        {r.route_name ?? ""}
                      </TableCell>
                      <TableCell>
                        {r.active ? (
                          <Badge className="bg-success text-success-foreground rounded-none">Ativa</Badge>
                        ) : (
                          <Badge variant="secondary" className="rounded-none">Inativa</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="rounded-none">{channelLabel(r.destination_platform)}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{r.destination_name ?? ""}</TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {r.destination_identifier ?? ""}
                      </TableCell>
                      <TableCell className="text-right text-sm tabular-nums">
                        {r.attempts_24h ?? 0}
                      </TableCell>
                      <TableCell className="text-right text-sm text-success font-semibold tabular-nums">
                        {r.sent_24h ?? 0}
                      </TableCell>
                      <TableCell className="text-right text-sm tabular-nums">
                        {Number(r.failed_24h) > 0 ? (
                          <span className="text-destructive font-semibold">{r.failed_24h}</span>
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
          </>
        )}
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number | string;
  tone?: "default" | "success" | "destructive" | "muted";
}) {
  const color =
    tone === "success"
      ? "text-success"
      : tone === "destructive"
      ? "text-destructive"
      : tone === "muted"
      ? "text-muted-foreground"
      : "text-foreground";
  return (
    <div className="border border-border bg-background/40 px-2.5 py-2">
      <p className="text-[9.5px] tracking-[0.18em] uppercase text-muted-foreground font-semibold">
        {label}
      </p>
      <p className={`stat-number text-[1.25rem] mt-1 ${color}`}>{value}</p>
    </div>
  );
}
