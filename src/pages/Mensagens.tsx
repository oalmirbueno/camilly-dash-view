import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, RotateCw } from "lucide-react";
import { FutureActionButton } from "@/components/FutureActionButton";
import { ErrorState, LoadingRows, EmptyState } from "@/components/StateViews";
import { usePersistentFilters } from "@/hooks/usePersistentFilters";
import { FilterSummary, type ActiveChip, type SummaryStat } from "@/components/FilterSummary";

type DeliveryRow = {
  delivery_attempt_id: string;
  sent_at: string | null;
  delivery_status: string | null;
  external_delivery_id: string | null;
  error_message: string | null;
  retry_count: number | null;
  route_id: string | null;
  route_name: string | null;
  destination_platform: string | null;
  destination_name: string | null;
  destination_identifier: string | null;
  processed_message_id: string | null;
  category: string | null;
  ready_for_delivery: boolean | null;
  source_name: string | null;
  source_platform: string | null;
  message_uid: string | null;
  captured_at: string | null;
  delivery_text_preview: string | null;
};

const statusBadge = (status: string | null) => {
  switch (status) {
    case "sent":
      return <Badge className="bg-success text-success-foreground rounded-none">Enviada</Badge>;
    case "failed":
      return <Badge variant="destructive" className="rounded-none">Falha</Badge>;
    case "pending":
      return <Badge className="bg-warning text-warning-foreground rounded-none">Pendente</Badge>;
    default:
      return <Badge variant="secondary" className="rounded-none">{status ?? ""}</Badge>;
  }
};

const channelLabel = (p: string | null) => {
  if (!p) return "";
  if (p === "telegram") return "Telegram";
  if (p === "whatsapp") return "WhatsApp";
  return p;
};

const STATUS_LABELS: Record<string, string> = {
  sent: "Enviada",
  failed: "Falha",
  pending: "Pendente",
};

const PLATFORM_LABELS: Record<string, string> = {
  telegram: "Telegram",
  whatsapp: "WhatsApp",
};

const DEFAULTS: Record<"q" | "platform" | "status" | "route", string> = {
  q: "",
  platform: "all",
  status: "all",
  route: "all",
};

export default function Mensagens() {
  const { filters, setFilter, reset, activeKeys } = usePersistentFilters(
    "filters:mensagens",
    DEFAULTS,
  );
  const { q: search, platform, status, route } = filters;

  const { data, isLoading, error } = useQuery<DeliveryRow[]>({
    queryKey: ["vw_camilly_delivery_feed", platform, status, route],
    queryFn: async () => {
      let query = supabase
        .from("vw_camilly_delivery_feed" as any)
        .select("*")
        .order("sent_at", { ascending: false, nullsFirst: false })
        .limit(200);

      if (platform !== "all") query = query.eq("destination_platform", platform);
      if (status !== "all") query = query.eq("delivery_status", status);
      if (route !== "all") query = query.eq("route_name", route);

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as DeliveryRow[];
    },
    refetchInterval: 30000,
  });

  const rows = useMemo(() => {
    if (!data) return [];
    if (!search.trim()) return data;
    const s = search.toLowerCase();
    return data.filter(
      (r) =>
        r.delivery_text_preview?.toLowerCase().includes(s) ||
        r.destination_name?.toLowerCase().includes(s) ||
        r.route_name?.toLowerCase().includes(s) ||
        r.message_uid?.toLowerCase().includes(s),
    );
  }, [data, search]);

  const routeOptions = useMemo(() => {
    const set = new Set<string>();
    data?.forEach((r) => r.route_name && set.add(r.route_name));
    return Array.from(set).sort();
  }, [data]);

  // Resumo dos resultados filtrados
  const summary = useMemo<SummaryStat[]>(() => {
    const total = rows.length;
    let sent = 0;
    let failed = 0;
    let telegram = 0;
    let whatsapp = 0;
    rows.forEach((r) => {
      if (r.delivery_status === "sent") sent++;
      else if (r.delivery_status === "failed") failed++;
      if (r.destination_platform === "telegram") telegram++;
      else if (r.destination_platform === "whatsapp") whatsapp++;
    });
    const pct = (n: number) => (total === 0 ? "—" : `${Math.round((n / total) * 100)}%`);
    return [
      { label: "Resultados", value: total },
      { label: "Sucesso", value: total ? `${sent} · ${pct(sent)}` : "0", tone: "success" },
      { label: "Falhas", value: total ? `${failed} · ${pct(failed)}` : "0", tone: "destructive" },
      {
        label: "Telegram / WhatsApp",
        value: `${telegram} / ${whatsapp}`,
        tone: "muted",
      },
    ];
  }, [rows]);

  const chips: ActiveChip[] = useMemo(() => {
    const list: ActiveChip[] = [];
    activeKeys.forEach((k) => {
      const key = k as keyof typeof DEFAULTS;
      const val = filters[key];
      let label = "";
      switch (key) {
        case "q":
          label = `Busca: "${val}"`;
          break;
        case "platform":
          label = `Canal: ${PLATFORM_LABELS[val] ?? val}`;
          break;
        case "status":
          label = `Status: ${STATUS_LABELS[val] ?? val}`;
          break;
        case "route":
          label = `Rota: ${val}`;
          break;
      }
      list.push({
        key: key as string,
        label,
        onClear: () => setFilter(key, DEFAULTS[key]),
      });
    });
    return list;
  }, [activeKeys, filters, setFilter]);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header editorial */}
      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="sparkle-dot" />
          <p className="section-label">Operação · Tempo real</p>
        </div>
        <h1 className="font-display text-foreground">Envios</h1>
        <p className="body-text max-w-xl">
          Feed de envios em tempo real · Telegram e WhatsApp. Atualiza a cada 30s.
        </p>
        <div className="line-gold mt-1" />
      </header>

      {/* Filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_11rem_10rem_14rem] gap-2.5 sm:gap-3">
        <div className="relative sm:col-span-2 lg:col-span-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por texto, destino, rota ou ID…"
            value={search}
            onChange={(e) => setFilter("q", e.target.value)}
            className="pl-9 rounded-none h-10"
          />
        </div>
        <Select value={platform} onValueChange={(v) => setFilter("platform", v)}>
          <SelectTrigger className="rounded-none h-10">
            <SelectValue placeholder="Plataforma" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas plataformas</SelectItem>
            <SelectItem value="telegram">Telegram</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => setFilter("status", v)}>
          <SelectTrigger className="rounded-none h-10">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos status</SelectItem>
            <SelectItem value="sent">Enviada</SelectItem>
            <SelectItem value="failed">Falha</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
          </SelectContent>
        </Select>
        <Select value={route} onValueChange={(v) => setFilter("route", v)}>
          <SelectTrigger className="rounded-none h-10">
            <SelectValue placeholder="Rota" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas rotas</SelectItem>
            {routeOptions.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Painel resumo persistente */}
      <FilterSummary
        stats={summary}
        chips={chips}
        onClearAll={reset}
        totalLabel={chips.length ? "Filtros ativos" : undefined}
      />

      {/* Resultado: cards no mobile, tabela no md+ */}
      <div className="border border-border bg-card overflow-hidden">
        {error ? (
          <ErrorState error={error} source="vw_camilly_delivery_feed" />
        ) : isLoading ? (
          <LoadingRows count={6} />
        ) : rows.length === 0 ? (
          <EmptyState message="Nenhum envio encontrado para esses filtros" />
        ) : (
          <>
            {/* MOBILE: stacked cards */}
            <div className="md:hidden divide-y divide-border">
              {rows.map((r) => (
                <article key={r.delivery_attempt_id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {statusBadge(r.delivery_status)}
                      <Badge variant="outline" className="rounded-none text-[10px]">
                        {channelLabel(r.destination_platform)}
                      </Badge>
                      {r.category && (
                        <Badge variant="secondary" className="rounded-none text-[10px]">
                          {r.category}
                        </Badge>
                      )}
                    </div>
                    <time className="text-[10.5px] text-muted-foreground tracking-wider uppercase whitespace-nowrap shrink-0 pt-0.5">
                      {r.sent_at ? new Date(r.sent_at).toLocaleString("pt-BR") : ""}
                    </time>
                  </div>

                  <p className="text-[13.5px] leading-relaxed text-foreground line-clamp-3">
                    {r.delivery_text_preview ?? ""}
                  </p>

                  <dl className="grid grid-cols-1 gap-1.5 pt-1 border-t border-border/60">
                    <div className="data-row">
                      <dt>Rota</dt>
                      <dd>{r.route_name ?? ""}</dd>
                    </div>
                    <div className="data-row">
                      <dt>Destino</dt>
                      <dd>{r.destination_name ?? ""}</dd>
                    </div>
                    <div className="data-row">
                      <dt>Origem</dt>
                      <dd>{r.source_name ?? ""}</dd>
                    </div>
                    {r.external_delivery_id && (
                      <div className="data-row">
                        <dt>ID externo</dt>
                        <dd className="font-mono text-[11px] break-all">{r.external_delivery_id}</dd>
                      </div>
                    )}
                  </dl>

                  {r.delivery_status === "failed" && (
                    <div className="pt-1">
                      <FutureActionButton
                        label="Tentar enviar de novo"
                        icon={RotateCw}
                        description="Quando estiver pronto, este botão tenta enviar essa mensagem mais uma vez, para o mesmo destino."
                      />
                    </div>
                  )}
                </article>
              ))}
            </div>

            {/* DESKTOP: tabela completa */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Enviada em</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Canal</TableHead>
                    <TableHead>Rota</TableHead>
                    <TableHead>Destino</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="max-w-md">Mensagem</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>ID externo</TableHead>
                    <TableHead>UID</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.delivery_attempt_id}>
                      <TableCell className="text-xs whitespace-nowrap">
                        {r.sent_at ? new Date(r.sent_at).toLocaleString("pt-BR") : ""}
                      </TableCell>
                      <TableCell>{statusBadge(r.delivery_status)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="rounded-none">
                          {channelLabel(r.destination_platform)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{r.route_name ?? ""}</TableCell>
                      <TableCell className="text-sm">{r.destination_name ?? ""}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="rounded-none">
                          {r.category ?? ""}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm max-w-md truncate">
                        {r.delivery_text_preview ?? ""}
                      </TableCell>
                      <TableCell className="text-xs">{r.source_name ?? ""}</TableCell>
                      <TableCell className="text-xs font-mono">
                        {r.external_delivery_id ?? ""}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground max-w-[180px] truncate">
                        {r.message_uid ?? ""}
                      </TableCell>
                      <TableCell className="text-right">
                        {r.delivery_status === "failed" && (
                          <FutureActionButton
                            label="Tentar enviar de novo"
                            icon={RotateCw}
                            iconOnly
                            description="Quando estiver pronto, este botão tenta enviar essa mensagem mais uma vez, para o mesmo destino."
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
