import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/StatCard";
import {
  Activity,
  Download,
  Cpu,
  CheckCheck,
  Send,
  CheckCircle,
  XCircle,
  MessageCircle,
  Phone,
  Power,
  PowerOff,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/StateViews";

type Summary = {
  automation_paused: boolean | null;
  runtime_updated_at: string | null;
  source_messages_24h: number | null;
  processed_messages_24h: number | null;
  ready_messages_24h: number | null;
  delivery_attempts_24h: number | null;
  deliveries_sent_24h: number | null;
  deliveries_failed_24h: number | null;
  telegram_sent_24h: number | null;
  whatsapp_sent_24h: number | null;
  last_source_captured_at: string | null;
  last_processed_at: string | null;
  last_delivery_at: string | null;
  last_delivery_status: string | null;
  last_external_delivery_id: string | null;
  last_delivery_sent_at: string | null;
  last_route_name: string | null;
  last_destination_platform: string | null;
  last_destination_name: string | null;
  last_message_text: string | null;
};

const fmtDateTime = (v: string | null) =>
  v ? new Date(v).toLocaleString("pt-BR") : "—";

const channelLabel = (p: string | null) => {
  if (!p) return "—";
  if (p === "telegram") return "Telegram";
  if (p === "whatsapp") return "WhatsApp";
  return p;
};

export default function Dashboard() {
  const { data, isLoading, error } = useQuery<Summary>({
    queryKey: ["vw_camilly_dashboard_summary"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vw_camilly_dashboard_summary" as any)
        .select("*")
        .maybeSingle();
      if (error) throw error;
      return data as Summary;
    },
    refetchInterval: 30000,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Visão geral da automação — atualiza a cada 30s
          </p>
        </div>
        {data && (
          <div className="flex items-center gap-3">
            {data.automation_paused ? (
              <Badge variant="destructive" className="gap-1.5">
                <PowerOff className="h-3.5 w-3.5" /> Automação pausada
              </Badge>
            ) : (
              <Badge className="bg-success text-success-foreground gap-1.5">
                <Power className="h-3.5 w-3.5" /> Automação ativa
              </Badge>
            )}
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              Atualizado: {fmtDateTime(data.runtime_updated_at)}
            </span>
          </div>
        )}
      </div>

      {error ? (
        <div className="border border-border rounded-xl bg-card">
          <ErrorState error={error} source="vw_camilly_dashboard_summary" />
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : !data ? (
        <p className="text-sm text-muted-foreground">Sem dados ainda na view de resumo.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Capturadas (24h)"
              value={data.source_messages_24h ?? 0}
              icon={Download}
              variant="default"
            />
            <StatCard
              title="Processadas (24h)"
              value={data.processed_messages_24h ?? 0}
              icon={Cpu}
              variant="default"
            />
            <StatCard
              title="Prontas p/ envio (24h)"
              value={data.ready_messages_24h ?? 0}
              icon={CheckCheck}
              variant="default"
            />
            <StatCard
              title="Tentativas (24h)"
              value={data.delivery_attempts_24h ?? 0}
              icon={Activity}
              variant="default"
            />
            <StatCard
              title="Enviadas (24h)"
              value={data.deliveries_sent_24h ?? 0}
              icon={Send}
              variant="success"
            />
            <StatCard
              title="Com falha (24h)"
              value={data.deliveries_failed_24h ?? 0}
              icon={XCircle}
              variant={Number(data.deliveries_failed_24h) > 0 ? "destructive" : "success"}
            />
            <StatCard
              title="Telegram (24h)"
              value={data.telegram_sent_24h ?? 0}
              icon={MessageCircle}
              variant="default"
            />
            <StatCard
              title="WhatsApp (24h)"
              value={data.whatsapp_sent_24h ?? 0}
              icon={Phone}
              variant="success"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  Última atividade
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">Última captura</span>
                    <span className="font-medium text-foreground">
                      {fmtDateTime(data.last_source_captured_at)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">Último processamento</span>
                    <span className="font-medium text-foreground">
                      {fmtDateTime(data.last_processed_at)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">Último envio</span>
                    <span className="font-medium text-foreground">
                      {fmtDateTime(data.last_delivery_at)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Send className="h-4 w-4 text-primary" />
                  Última mensagem enviada
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.last_delivery_at ? (
                  <div className="space-y-3 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      {data.last_delivery_status === "sent" ? (
                        <Badge className="bg-success text-success-foreground">Enviada</Badge>
                      ) : data.last_delivery_status === "failed" ? (
                        <Badge variant="destructive">Falha</Badge>
                      ) : (
                        <Badge variant="secondary">{data.last_delivery_status ?? "—"}</Badge>
                      )}
                      <Badge variant="outline">{channelLabel(data.last_destination_platform)}</Badge>
                      {data.last_route_name && (
                        <Badge variant="secondary">{data.last_route_name}</Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>
                        Destino:{" "}
                        <span className="text-foreground font-medium">
                          {data.last_destination_name ?? "—"}
                        </span>
                      </div>
                      <div>Horário: {fmtDateTime(data.last_delivery_sent_at)}</div>
                      {data.last_external_delivery_id && (
                        <div>
                          ID externo:{" "}
                          <code className="font-mono">{data.last_external_delivery_id}</code>
                        </div>
                      )}
                    </div>
                    <div className="rounded-lg bg-muted/40 border border-border p-3 text-sm text-foreground whitespace-pre-wrap">
                      {data.last_message_text ?? "—"}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum envio registrado ainda.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
