import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";

export default function Mensagens() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: messages, isLoading } = useQuery({
    queryKey: ["messages", search, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("v_message_status")
        .select("*")
        .order("captured_at", { ascending: false })
        .limit(100);

      if (search) {
        query = query.ilike("raw_text", `%${search}%`);
      }

      if (statusFilter !== "all") {
        query = query.eq("last_delivery_status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });

  const statusBadge = (status: string | null) => {
    if (!status) return <Badge variant="secondary">—</Badge>;
    switch (status) {
      case "sent": return <Badge className="bg-success text-success-foreground">Enviada</Badge>;
      case "failed": return <Badge variant="destructive">Falha</Badge>;
      case "pending": return <Badge className="bg-warning text-warning-foreground">Pendente</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Mensagens</h1>
        <p className="text-sm text-muted-foreground mt-1">Status de captura e entrega de mensagens</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por texto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="sent">Enviada</SelectItem>
            <SelectItem value="failed">Falha</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
          </SelectContent>
        </Select>
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
                  <TableHead>Capturada</TableHead>
                  <TableHead>Fonte</TableHead>
                  <TableHead className="max-w-xs">Texto</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Pronta</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Entregue em</TableHead>
                  <TableHead>Erro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {messages && messages.length > 0 ? messages.map((msg, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-xs whitespace-nowrap">
                      {msg.captured_at ? new Date(msg.captured_at).toLocaleString("pt-BR") : "—"}
                    </TableCell>
                    <TableCell className="text-sm">{msg.source_name ?? "—"}</TableCell>
                    <TableCell className="text-sm max-w-xs truncate">{msg.raw_text ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{msg.category ?? "—"}</Badge>
                    </TableCell>
                    <TableCell>
                      {msg.ready_for_delivery ? (
                        <span className="text-success font-medium text-sm">Sim</span>
                      ) : (
                        <span className="text-muted-foreground text-sm">Não</span>
                      )}
                    </TableCell>
                    <TableCell>{statusBadge(msg.last_delivery_status)}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">
                      {msg.last_delivery_at ? new Date(msg.last_delivery_at).toLocaleString("pt-BR") : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-destructive max-w-xs truncate">
                      {msg.last_delivery_error ?? "—"}
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      Nenhuma mensagem encontrada
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
