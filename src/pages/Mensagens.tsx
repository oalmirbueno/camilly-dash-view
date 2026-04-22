import { useMemo, useState } from "react";
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
import { Search } from "lucide-react";
import { ErrorState, LoadingRows, EmptyState } from "@/components/StateViews";

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
      return <Badge className="bg-success text-success-foreground">Enviada</Badge>;
    case "failed":
      return <Badge variant="destructive">Falha</Badge>;
    case "pending":
      return <Badge className="bg-warning text-warning-foreground">Pendente</Badge>;
    default:
      return <Badge variant="secondary">{status ?? "—"}</Badge>;
  }
};

const channelLabel = (p: string | null) => {
  if (!p) return "—";
  if (p === "telegram") return "Telegram";
  if (p === "whatsapp") return "WhatsApp";
  return p;
};

export default function Mensagens() {
  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState("all");
  const [status, setStatus] = useState("all");
  const [route, setRoute] = useState("all");

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Envios</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Feed de envios em tempo real — Telegram e WhatsApp
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por texto, destino, rota ou ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={platform} onValueChange={setPlatform}>
          <SelectTrigger className="w-full lg:w-44">
            <SelectValue placeholder="Plataforma" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas plataformas</SelectItem>
            <SelectItem value="telegram">Telegram</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full lg:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos status</SelectItem>
            <SelectItem value="sent">Enviada</SelectItem>
            <SelectItem value="failed">Falha</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
          </SelectContent>
        </Select>
        <Select value={route} onValueChange={setRoute}>
          <SelectTrigger className="w-full lg:w-56">
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

      <div className="border border-border rounded-xl overflow-hidden bg-card">
        {error ? (
          <ErrorState error={error} source="vw_camilly_delivery_feed" />
        ) : isLoading ? (
          <LoadingRows count={6} />
        ) : rows.length === 0 ? (
          <EmptyState message="Nenhum envio encontrado para esses filtros" />
        ) : (
          <div className="overflow-x-auto">
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.delivery_attempt_id}>
                    <TableCell className="text-xs whitespace-nowrap">
                      {r.sent_at ? new Date(r.sent_at).toLocaleString("pt-BR") : "—"}
                    </TableCell>
                    <TableCell>{statusBadge(r.delivery_status)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{channelLabel(r.destination_platform)}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{r.route_name ?? "—"}</TableCell>
                    <TableCell className="text-sm">{r.destination_name ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{r.category ?? "—"}</Badge>
                    </TableCell>
                    <TableCell className="text-sm max-w-md truncate">
                      {r.delivery_text_preview ?? "—"}
                    </TableCell>
                    <TableCell className="text-xs">{r.source_name ?? "—"}</TableCell>
                    <TableCell className="text-xs font-mono">
                      {r.external_delivery_id ?? "—"}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground max-w-[180px] truncate">
                      {r.message_uid ?? "—"}
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
