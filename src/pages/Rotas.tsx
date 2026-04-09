import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function Rotas() {
  const { data: routes, isLoading } = useQuery({
    queryKey: ["delivery-routes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("delivery_routes")
        .select("*")
        .order("route_name", { ascending: true });
      if (error) throw error;
      return data;
    },
    refetchInterval: 60000,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Rotas</h1>
        <p className="text-sm text-muted-foreground mt-1">Rotas de entrega configuradas</p>
      </div>

      <div className="border border-border rounded-xl overflow-hidden bg-card">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome da Rota</TableHead>
                  <TableHead>Plataforma</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead>Identificador</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {routes && routes.length > 0 ? routes.map((route, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium text-sm">{route.route_name ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{route.destination_platform ?? "—"}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{route.destination_name ?? "—"}</TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      {route.destination_identifier ?? "—"}
                    </TableCell>
                    <TableCell>
                      {route.active ? (
                        <Badge className="bg-success text-success-foreground">Ativa</Badge>
                      ) : (
                        <Badge variant="secondary">Inativa</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Nenhuma rota encontrada
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
