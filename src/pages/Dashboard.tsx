import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/StatCard";
import {
  Activity,
  Download,
  Cpu,
  CheckCheck,
  Send,
  XCircle,
  MessageCircle,
  Phone,
  Power,
  PowerOff,
  Clock,
  Sparkles,
  Radio,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/StateViews";
import { AutomationToggle } from "@/components/AutomationToggle";

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
    <div className="space-y-8">
      {/* ============ HERO HEADER ============ */}
      <section className="relative overflow-hidden border border-border bg-card">
        {/* Decorative accents */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
             style={{
               backgroundImage:
                 "radial-gradient(circle at 20% 20%, hsl(var(--gold)) 0, transparent 40%), radial-gradient(circle at 90% 80%, hsl(var(--blush)) 0, transparent 40%)",
             }}
        />
        <div className="absolute top-0 left-0 right-0 h-px shimmer-line" />

        <div className="relative p-6 sm:p-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
          <div className="min-w-0 max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <span className="sparkle-dot" />
              <p className="section-label">Painel · Visão geral</p>
            </div>
            <h1 className="font-display text-[2.5rem] sm:text-[3.25rem] text-foreground leading-[1] tracking-tight">
              Operação <span className="heading-accent text-gold">em tempo real</span>
            </h1>
            <div className="mt-5 line-gold" />
            <p className="body-text mt-5">
              Monitoramento ao vivo da automação Camilly — captura, processamento e
              entrega nos canais Telegram e WhatsApp. Atualiza a cada 30s.
            </p>
          </div>

          {/* Status pill */}
          {data && (
            <div className="flex flex-col items-start lg:items-end gap-3 shrink-0">
              {data.automation_paused ? (
                <div className="flex items-center gap-2.5 px-5 py-2.5 border border-destructive/40 bg-destructive/10">
                  <PowerOff className="h-4 w-4 text-destructive" />
                  <span className="text-xs font-bold text-destructive uppercase tracking-[0.2em]">
                    Pausada
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2.5 px-5 py-2.5 border border-success/40 bg-success/10">
                  <Power className="h-4 w-4 text-success" />
                  <span className="text-xs font-bold text-success uppercase tracking-[0.2em]">
                    Ativa
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground tracking-[0.15em] uppercase font-medium">
                <Clock className="h-3 w-3" />
                Sync: {fmtDateTime(data.runtime_updated_at)}
              </div>
            </div>
          )}
        </div>
      </section>

      {error ? (
        <div className="border border-border bg-card">
          <ErrorState error={error} source="vw_camilly_dashboard_summary" />
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : !data ? (
        <p className="text-sm text-muted-foreground">Sem dados ainda na view de resumo.</p>
      ) : (
        <>
          {/* ============ FLOW SECTION ============ */}
          <section>
            <div className="flex items-end justify-between mb-5 pb-3 border-b border-border">
              <div>
                <p className="section-label mb-2">Fluxo · Últimas 24 horas</p>
                <h2 className="font-display text-[1.75rem] text-foreground leading-tight">
                  Pipeline operacional
                </h2>
              </div>
              <span className="hidden sm:inline-block text-xs text-muted-foreground tracking-[0.18em] uppercase font-medium pb-1">
                4 etapas
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Capturadas"
                value={data.source_messages_24h ?? 0}
                icon={Download}
                hint="Mensagens recebidas"
              />
              <StatCard
                title="Processadas"
                value={data.processed_messages_24h ?? 0}
                icon={Cpu}
                hint="Tratadas pelo motor"
              />
              <StatCard
                title="Prontas p/ envio"
                value={data.ready_messages_24h ?? 0}
                icon={CheckCheck}
                hint="Aguardando rota"
              />
              <StatCard
                title="Tentativas"
                value={data.delivery_attempts_24h ?? 0}
                icon={Activity}
                hint="Disparos executados"
              />
            </div>
          </section>

          {/* ============ DELIVERY SECTION ============ */}
          <section>
            <div className="flex items-end justify-between mb-5 pb-3 border-b border-border">
              <div>
                <p className="section-label mb-2">Entregas · Últimas 24 horas</p>
                <h2 className="font-display text-[1.75rem] text-foreground leading-tight">
                  Resultado por canal
                </h2>
              </div>
              <span className="hidden sm:inline-block text-xs text-muted-foreground tracking-[0.18em] uppercase font-medium pb-1">
                Telegram · WhatsApp
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Enviadas"
                value={data.deliveries_sent_24h ?? 0}
                icon={Send}
                variant="success"
                hint="Sucesso confirmado"
              />
              <StatCard
                title="Com falha"
                value={data.deliveries_failed_24h ?? 0}
                icon={XCircle}
                variant={Number(data.deliveries_failed_24h) > 0 ? "destructive" : "success"}
                hint="Erro no disparo"
              />
              <StatCard
                title="Telegram"
                value={data.telegram_sent_24h ?? 0}
                icon={MessageCircle}
                hint="Canal Telegram"
              />
              <StatCard
                title="WhatsApp"
                value={data.whatsapp_sent_24h ?? 0}
                icon={Phone}
                variant="success"
                hint="Canal WhatsApp"
              />
            </div>
          </section>

          {/* ============ DETAIL CARDS ============ */}
          <section className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Timeline */}
            <Card className="lg:col-span-2 border border-border bg-card overflow-hidden">
              <div className="px-6 pt-6 pb-4 border-b border-border">
                <p className="section-label mb-1">Linha do tempo</p>
                <h3 className="font-display text-xl text-foreground">Última atividade</h3>
              </div>
              <CardContent className="p-6">
                <ol className="relative border-l border-border space-y-5 ml-2">
                  <TimelineItem
                    label="Última captura"
                    value={fmtDateTime(data.last_source_captured_at)}
                    icon={Download}
                  />
                  <TimelineItem
                    label="Último processamento"
                    value={fmtDateTime(data.last_processed_at)}
                    icon={Cpu}
                  />
                  <TimelineItem
                    label="Último envio"
                    value={fmtDateTime(data.last_delivery_at)}
                    icon={Send}
                    accent
                  />
                </ol>
              </CardContent>
            </Card>

            {/* Last message */}
            <Card className="lg:col-span-3 border border-border bg-card overflow-hidden">
              <div className="px-6 pt-6 pb-4 border-b border-border flex items-start justify-between gap-4">
                <div>
                  <p className="section-label mb-1">Última mensagem</p>
                  <h3 className="font-display text-xl text-foreground">
                    Conteúdo mais recente enviado
                  </h3>
                </div>
                <Radio className="h-5 w-5 text-gold shrink-0 mt-1" />
              </div>
              <CardContent className="p-6">
                {data.last_delivery_at ? (
                  <div className="space-y-4 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      {data.last_delivery_status === "sent" ? (
                        <Badge className="bg-success text-success-foreground rounded-none">
                          Enviada
                        </Badge>
                      ) : data.last_delivery_status === "failed" ? (
                        <Badge variant="destructive" className="rounded-none">Falha</Badge>
                      ) : (
                        <Badge variant="secondary" className="rounded-none">
                          {data.last_delivery_status ?? "—"}
                        </Badge>
                      )}
                      <Badge variant="outline" className="rounded-none">
                        {channelLabel(data.last_destination_platform)}
                      </Badge>
                      {data.last_route_name && (
                        <Badge variant="secondary" className="rounded-none">
                          {data.last_route_name}
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <DetailRow label="Destino" value={data.last_destination_name ?? "—"} />
                      <DetailRow label="Horário" value={fmtDateTime(data.last_delivery_sent_at)} />
                      {data.last_external_delivery_id && (
                        <DetailRow
                          label="ID externo"
                          value={data.last_external_delivery_id}
                          mono
                        />
                      )}
                    </div>

                    <div className="relative border border-border bg-background/60 p-4">
                      <Sparkles className="absolute -top-2 -left-2 h-4 w-4 text-gold bg-card p-0.5" />
                      <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                        {data.last_message_text ?? "—"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    Nenhum envio registrado ainda.
                  </p>
                )}
              </CardContent>
            </Card>
          </section>
        </>
      )}
    </div>
  );
}

function TimelineItem({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  icon: typeof Download;
  accent?: boolean;
}) {
  return (
    <li className="ml-4">
      <span
        className={`absolute -left-[9px] flex h-4 w-4 items-center justify-center ${
          accent ? "bg-foreground text-background" : "bg-card border border-border text-muted-foreground"
        }`}
      >
        <Icon className="h-2.5 w-2.5" />
      </span>
      <p className="section-label text-[9px] mb-1">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </li>
  );
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="border border-border bg-background/40 px-3 py-2">
      <p className="section-label text-[9px] mb-1">{label}</p>
      <p className={`text-foreground text-xs ${mono ? "font-mono break-all" : "font-medium"}`}>
        {value}
      </p>
    </div>
  );
}
