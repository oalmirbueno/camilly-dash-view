import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/StatCard";
import { Download, Cpu, Send, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: counts, isLoading: countsLoading } = useQuery({
    queryKey: ["dashboard-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_dashboard_counts_today")
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });

  const { data: recentErrors } = useQuery({
    queryKey: ["recent-errors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("error_logs")
        .select("created_at, layer, severity, error_message")
        .eq("resolved", false)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Visão geral da automação — atualiza a cada 30s</p>
      </div>

      {countsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Capturadas Hoje"
            value={counts?.captured_today ?? 0}
            icon={Download}
            variant="default"
          />
          <StatCard
            title="Processadas Hoje"
            value={counts?.processed_today ?? 0}
            icon={Cpu}
            variant="success"
          />
          <StatCard
            title="Enviadas Hoje"
            value={counts?.sent_today ?? 0}
            icon={Send}
            variant="default"
          />
          <StatCard
            title="Erros Abertos"
            value={counts?.open_errors ?? 0}
            icon={AlertTriangle}
            variant={Number(counts?.open_errors) > 0 ? "destructive" : "success"}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success" />
              Status Geral
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">Captura</span>
                <span className="font-medium text-success">Ativa</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">Processamento</span>
                <span className="font-medium text-success">Ativo</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">Distribuição</span>
                <span className="font-medium text-success">Ativa</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <XCircle className="h-4 w-4 text-destructive" />
              Últimos Erros
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentErrors && recentErrors.length > 0 ? (
              <div className="space-y-2">
                {recentErrors.map((err, i) => (
                  <div key={i} className="text-sm py-2 border-b border-border last:border-0">
                    <div className="flex justify-between">
                      <span className="font-medium text-foreground">{err.layer}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(err.created_at).toLocaleTimeString("pt-BR")}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-xs mt-0.5 line-clamp-1">{err.error_message}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum erro aberto 🎉</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
