import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LoadingRows, EmptyState, ErrorState } from "@/components/StateViews";
import { toast } from "@/hooks/use-toast";
import { Pencil, Lock, LogIn, Settings2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Link as RouterLink } from "react-router-dom";

type Template = {
  id: string;
  template_key: string;
  template_name: string;
  channel_scope: string | null;
  category: string | null;
  body_template: string | null;
  variables_json: any;
  active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
};

const CHANNELS = ["all", "telegram", "whatsapp"] as const;
const CATEGORIES = [
  "meia_hora",
  "lancamento_oficial",
  "lancamentos_recentes",
  "incentivo",
  "general",
] as const;

function fmtDate(s: string | null) {
  if (!s) return "";
  try {
    return new Date(s).toLocaleString("pt-BR");
  } catch {
    return s;
  }
}

export default function Templates() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const canEdit = !!user;
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [editing, setEditing] = useState<Template | null>(null);
  const [advanced, setAdvanced] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["message_templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("message_templates")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as Template[];
    },
    refetchInterval: 60000,
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    return data.filter((t) => {
      if (activeFilter === "active" && !t.active) return false;
      if (activeFilter === "inactive" && t.active) return false;
      if (categoryFilter !== "all" && t.category !== categoryFilter) return false;
      if (channelFilter !== "all" && t.channel_scope !== channelFilter) return false;
      if (!q) return true;
      return (
        t.template_name?.toLowerCase().includes(q) ||
        t.template_key?.toLowerCase().includes(q)
      );
    });
  }, [data, search, activeFilter, categoryFilter, channelFilter]);

  const updateMutation = useMutation({
    mutationFn: async (payload: Partial<Template> & { id: string }) => {
      const { id, ...rest } = payload;
      const { error } = await supabase
        .from("message_templates")
        .update(rest)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Template atualizado" });
      qc.invalidateQueries({ queryKey: ["message_templates"] });
      setEditing(null);
    },
    onError: (e: any) => {
      toast({
        title: "Erro ao salvar",
        description: e?.message ?? String(e),
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6 sm:space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="space-y-2 min-w-0">
          <div className="flex items-center gap-2">
            <span className="sparkle-dot" />
            <p className="section-label">Conteúdo · Mensagens</p>
          </div>
          <h1 className="font-display text-foreground">Mensagens</h1>
          <p className="body-text max-w-2xl">
            Edite o texto das mensagens enviadas. Clique em uma mensagem para
            alterar o conteúdo.
          </p>
          <div className="line-gold mt-1" />
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setAdvanced((v) => !v)}
          className="rounded-none uppercase tracking-wider text-[11px] h-10 self-start sm:self-auto shrink-0"
          title="Mostrar filtros e detalhes técnicos"
        >
          <Settings2 className="h-4 w-4 mr-1.5" />
          {advanced ? "Modo simples" : "Modo avançado"}
        </Button>
      </header>

      {!canEdit && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border border-border bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-2 text-sm">
            <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
            <span>
              Visualização liberada. Faça login para editar mensagens.
            </span>
          </div>
          <Button asChild size="sm" variant="outline" className="rounded-none uppercase tracking-wider text-[11px] self-start sm:self-auto">
            <RouterLink to="/login">
              <LogIn className="h-4 w-4 mr-1.5" />
              Entrar
            </RouterLink>
          </Button>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{advanced ? "Filtros" : "Buscar"}</CardTitle>
        </CardHeader>
        <CardContent>
          {advanced ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Input
                placeholder="Buscar por nome ou chave"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Select value={activeFilter} onValueChange={(v: any) => setActiveFilter(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas categorias</SelectItem>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={channelFilter} onValueChange={setChannelFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Canal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos canais</SelectItem>
                  {CHANNELS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <Input
              placeholder="Buscar por nome da mensagem"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Mensagens ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <LoadingRows />
          ) : error ? (
            <ErrorState error={error} source="message_templates" />
          ) : filtered.length === 0 ? (
            <EmptyState message="Nenhuma mensagem encontrada" />
          ) : advanced ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Chave</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Atualizado</TableHead>
                  <TableHead>Preview</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.template_name}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {t.template_key}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{t.category ?? ""}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{t.channel_scope ?? ""}</Badge>
                    </TableCell>
                    <TableCell>
                      {t.active ? (
                        <Badge>Ativo</Badge>
                      ) : (
                        <Badge variant="outline">Inativo</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {fmtDate(t.updated_at)}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {t.body_template ?? ""}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditing(t)}
                        disabled={!canEdit}
                        title={canEdit ? "Editar" : "Faça login para editar"}
                      >
                        {canEdit ? (
                          <Pencil className="h-4 w-4" />
                        ) : (
                          <Lock className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <ul className="divide-y divide-border">
              {filtered.map((t) => (
                <li
                  key={t.id}
                  className="flex items-start gap-3 px-4 py-3 sm:px-6 sm:py-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium truncate">
                        {t.template_name}
                      </span>
                      {!t.active && (
                        <Badge variant="outline" className="text-[10px]">
                          Desativado
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {t.body_template ?? ""}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditing(t)}
                    disabled={!canEdit}
                    className="rounded-none uppercase tracking-wider text-[11px] shrink-0"
                    title={canEdit ? "Editar texto da mensagem" : "Faça login para editar"}
                  >
                    {canEdit ? (
                      <>
                        <Pencil className="h-3.5 w-3.5 mr-1.5" />
                        Editar
                      </>
                    ) : (
                      <>
                        <Lock className="h-3.5 w-3.5 mr-1.5" />
                        Editar
                      </>
                    )}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <EditTemplateDialog
        template={editing}
        onClose={() => setEditing(null)}
        onSave={(payload) => updateMutation.mutate(payload)}
        saving={updateMutation.isPending}
      />
    </div>
  );
}

function EditTemplateDialog({
  template,
  onClose,
  onSave,
  saving,
}: {
  template: Template | null;
  onClose: () => void;
  onSave: (p: Partial<Template> & { id: string }) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<Template | null>(template);
  const [varsText, setVarsText] = useState("");
  const [varsError, setVarsError] = useState<string | null>(null);
  const [advanced, setAdvanced] = useState(false);

  // sync when prop changes
  useMemo(() => {
    setForm(template);
    setVarsText(
      template?.variables_json
        ? JSON.stringify(template.variables_json, null, 2)
        : ""
    );
    setVarsError(null);
    setAdvanced(false);
  }, [template]);

  if (!form) return null;

  const handleSave = () => {
    let variables_json: any = null;
    if (varsText.trim()) {
      try {
        variables_json = JSON.parse(varsText);
        setVarsError(null);
      } catch (e: any) {
        setVarsError("JSON inválido: " + e.message);
        return;
      }
    }
    onSave({
      id: form.id,
      template_name: form.template_name,
      channel_scope: form.channel_scope,
      category: form.category,
      body_template: form.body_template,
      variables_json,
      active: form.active,
    });
  };

  return (
    <Dialog open={!!template} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar mensagem</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Nome</Label>
            <Input
              value={form.template_name ?? ""}
              onChange={(e) => setForm({ ...form, template_name: e.target.value })}
            />
          </div>
          <div>
            <Label>Texto da mensagem</Label>
            <Textarea
              rows={10}
              value={form.body_template ?? ""}
              onChange={(e) => setForm({ ...form, body_template: e.target.value })}
              className="text-sm"
              placeholder="Escreva a mensagem que será enviada..."
            />
            <p className="text-xs text-muted-foreground mt-1">
              Trechos entre chaves como {"{nome}"} são preenchidos automaticamente.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={!!form.active}
              onCheckedChange={(v) => setForm({ ...form, active: v })}
            />
            <Label>Ativo</Label>
          </div>

          <button
            type="button"
            onClick={() => setAdvanced((v) => !v)}
            className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
          >
            {advanced ? "Ocultar opções avançadas" : "Mostrar opções avançadas"}
          </button>

          {advanced && (
            <div className="space-y-4 border-t border-border pt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Canal</Label>
                  <Select
                    value={form.channel_scope ?? "all"}
                    onValueChange={(v) => setForm({ ...form, channel_scope: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CHANNELS.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Categoria</Label>
                  <Select
                    value={form.category ?? "general"}
                    onValueChange={(v) => setForm({ ...form, category: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Variáveis esperadas (JSON)</Label>
                <Textarea
                  rows={5}
                  value={varsText}
                  onChange={(e) => setVarsText(e.target.value)}
                  className="font-mono text-xs"
                  placeholder='{"campo": "descrição"}'
                />
                {varsError && (
                  <p className="text-xs text-destructive mt-1">{varsError}</p>
                )}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
