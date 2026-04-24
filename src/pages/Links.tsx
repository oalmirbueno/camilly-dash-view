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
import { Pencil, ExternalLink, Lock, LogIn } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Link as RouterLink } from "react-router-dom";

type Link = {
  id: string;
  link_type: string | null;
  platform_name: string | null;
  campaign_name: string | null;
  short_label: string | null;
  destination_url: string | null;
  fixed_link: boolean | null;
  valid_from: string | null;
  valid_until: string | null;
  active: boolean | null;
  metadata_json: any;
  created_at: string | null;
  updated_at: string | null;
};

const LINK_TYPES = ["fixed", "daily", "recent", "rtp", "platform"] as const;

function fmtDate(s: string | null) {
  if (!s) return "";
  try {
    return new Date(s).toLocaleString("pt-BR");
  } catch {
    return s;
  }
}

function fmtDateOnly(s: string | null) {
  if (!s) return "";
  try {
    return new Date(s).toLocaleDateString("pt-BR");
  } catch {
    return s;
  }
}

function toInputDateTime(s: string | null) {
  if (!s) return "";
  try {
    const d = new Date(s);
    const off = d.getTimezoneOffset();
    const local = new Date(d.getTime() - off * 60000);
    return local.toISOString().slice(0, 16);
  } catch {
    return "";
  }
}

type LinkStatus = "active_now" | "scheduled" | "expired" | "fixed" | "inactive";

function getStatus(link: Link, now = new Date()): LinkStatus {
  if (!link.active) return "inactive";
  if (link.fixed_link) return "fixed";
  const from = link.valid_from ? new Date(link.valid_from) : null;
  const until = link.valid_until ? new Date(link.valid_until) : null;
  if (from && from > now) return "scheduled";
  if (until && until < now) return "expired";
  return "active_now";
}

function StatusBadge({ status }: { status: LinkStatus }) {
  switch (status) {
    case "active_now":
      return <Badge>Ativo agora</Badge>;
    case "fixed":
      return <Badge className="bg-primary/80">Fixo</Badge>;
    case "scheduled":
      return <Badge variant="secondary">Agendado</Badge>;
    case "expired":
      return <Badge variant="destructive">Vencido</Badge>;
    case "inactive":
      return <Badge variant="outline">Inativo</Badge>;
  }
}

export default function Links() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const canEdit = !!user;
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [validityFilter, setValidityFilter] = useState<
    "all" | "valid_now" | "expired" | "today"
  >("all");
  const [editing, setEditing] = useState<Link | null>(null);
  const [creating, setCreating] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["affiliate_links"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliate_links")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as Link[];
    },
    refetchInterval: 60000,
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const list = data.filter((l) => {
      if (activeFilter === "active" && !l.active) return false;
      if (activeFilter === "inactive" && l.active) return false;
      if (typeFilter !== "all" && l.link_type !== typeFilter) return false;

      const status = getStatus(l, now);
      if (validityFilter === "valid_now" && !(status === "active_now" || status === "fixed"))
        return false;
      if (validityFilter === "expired" && status !== "expired") return false;
      if (validityFilter === "today") {
        const from = l.valid_from ? new Date(l.valid_from) : null;
        const until = l.valid_until ? new Date(l.valid_until) : null;
        const overlapsToday =
          (!from || from <= todayEnd) && (!until || until >= todayStart);
        if (!overlapsToday) return false;
      }

      if (!q) return true;
      return (
        l.short_label?.toLowerCase().includes(q) ||
        l.platform_name?.toLowerCase().includes(q) ||
        l.campaign_name?.toLowerCase().includes(q) ||
        l.destination_url?.toLowerCase().includes(q)
      );
    });

    // Order: active_now/fixed first, then by updated_at desc
    return list.sort((a, b) => {
      const sa = getStatus(a, now);
      const sb = getStatus(b, now);
      const priority = (s: LinkStatus) =>
        s === "active_now" ? 0 : s === "fixed" ? 1 : s === "scheduled" ? 2 : s === "expired" ? 3 : 4;
      const pa = priority(sa);
      const pb = priority(sb);
      if (pa !== pb) return pa - pb;
      const ua = a.updated_at ? new Date(a.updated_at).getTime() : 0;
      const ub = b.updated_at ? new Date(b.updated_at).getTime() : 0;
      return ub - ua;
    });
  }, [data, search, activeFilter, typeFilter, validityFilter]);

  const counts = useMemo(() => {
    if (!data) return { active_now: 0, fixed: 0, expired: 0, scheduled: 0 };
    const now = new Date();
    return data.reduce(
      (acc, l) => {
        const s = getStatus(l, now);
        if (s === "active_now") acc.active_now++;
        if (s === "fixed") acc.fixed++;
        if (s === "expired") acc.expired++;
        if (s === "scheduled") acc.scheduled++;
        return acc;
      },
      { active_now: 0, fixed: 0, expired: 0, scheduled: 0 }
    );
  }, [data]);

  const upsertMutation = useMutation({
    mutationFn: async (payload: Partial<Link> & { id?: string }) => {
      if (payload.id) {
        const { id, ...rest } = payload;
        const { error } = await supabase.from("affiliate_links").update(rest).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("affiliate_links").insert(payload as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: "Link salvo" });
      qc.invalidateQueries({ queryKey: ["affiliate_links"] });
      setEditing(null);
      setCreating(false);
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
            <p className="section-label">Conteúdo · Distribuição</p>
          </div>
          <h1 className="font-display text-foreground">Links de afiliado</h1>
          <p className="body-text max-w-xl">
            Links reais que o motor distribui. O painel reflete sempre o estado
            atual da tabela.
          </p>
          <div className="line-gold mt-1" />
        </div>
        <Button
          onClick={() => setCreating(true)}
          disabled={!canEdit}
          className="rounded-none uppercase tracking-wider text-[11px] h-10 self-start sm:self-auto shrink-0"
        >
          {canEdit ? "Novo link" : (
            <>
              <Lock className="h-4 w-4 mr-1.5" />
              Novo link
            </>
          )}
        </Button>
      </header>

      {!canEdit && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border border-border bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-2 text-sm">
            <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
            <span>
              Visualização liberada. Faça login para criar ou editar links.
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="rounded-none border-border">
          <CardContent className="pt-4 pb-4">
            <p className="section-label text-[9.5px] mb-2">Ativos agora</p>
            <p className="stat-number text-[1.5rem] sm:text-[1.75rem]">{counts.active_now}</p>
          </CardContent>
        </Card>
        <Card className="rounded-none border-border">
          <CardContent className="pt-4 pb-4">
            <p className="section-label text-[9.5px] mb-2">Fixos</p>
            <p className="stat-number text-[1.5rem] sm:text-[1.75rem]">{counts.fixed}</p>
          </CardContent>
        </Card>
        <Card className="rounded-none border-border">
          <CardContent className="pt-4 pb-4">
            <p className="section-label text-[9.5px] mb-2">Agendados</p>
            <p className="stat-number text-[1.5rem] sm:text-[1.75rem]">{counts.scheduled}</p>
          </CardContent>
        </Card>
        <Card className="rounded-none border-border">
          <CardContent className="pt-4 pb-4">
            <p className="section-label text-[9.5px] mb-2">Vencidos</p>
            <p className="stat-number text-[1.5rem] sm:text-[1.75rem]">{counts.expired}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Input
              placeholder="Buscar por rótulo, plataforma, campanha ou URL"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select value={activeFilter} onValueChange={(v: any) => setActiveFilter(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {LINK_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={validityFilter} onValueChange={(v: any) => setValidityFilter(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toda validade</SelectItem>
                <SelectItem value="valid_now">Válidos agora</SelectItem>
                <SelectItem value="today">Do dia</SelectItem>
                <SelectItem value="expired">Vencidos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Links ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <LoadingRows />
          ) : error ? (
            <ErrorState error={error} source="affiliate_links" />
          ) : filtered.length === 0 ? (
            <EmptyState message="Nenhum link encontrado" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Rótulo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Plataforma</TableHead>
                  <TableHead>Campanha</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Atualizado</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell>
                      <StatusBadge status={getStatus(l)} />
                    </TableCell>
                    <TableCell className="font-medium">{l.short_label ?? ""}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{l.link_type ?? ""}</Badge>
                    </TableCell>
                    <TableCell>{l.platform_name ?? ""}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {l.campaign_name ?? ""}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {l.fixed_link ? (
                        "Sem expiração"
                      ) : (
                        <>
                          {fmtDateOnly(l.valid_from)} → {fmtDateOnly(l.valid_until)}
                        </>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      {l.destination_url ? (
                        <a
                          href={l.destination_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline truncate"
                        >
                          <span className="truncate max-w-[180px]">{l.destination_url}</span>
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {fmtDate(l.updated_at)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditing(l)}
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
          )}
        </CardContent>
      </Card>

      <EditLinkDialog
        link={editing ?? (creating ? ({} as Link) : null)}
        isNew={creating}
        onClose={() => {
          setEditing(null);
          setCreating(false);
        }}
        onSave={(p) => upsertMutation.mutate(p)}
        saving={upsertMutation.isPending}
      />
    </div>
  );
}

function EditLinkDialog({
  link,
  isNew,
  onClose,
  onSave,
  saving,
}: {
  link: Link | null;
  isNew: boolean;
  onClose: () => void;
  onSave: (p: Partial<Link> & { id?: string }) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<Partial<Link>>(link ?? {});
  const [metaText, setMetaText] = useState("");
  const [metaError, setMetaError] = useState<string | null>(null);

  useMemo(() => {
    setForm(link ?? {});
    setMetaText(
      link?.metadata_json ? JSON.stringify(link.metadata_json, null, 2) : ""
    );
    setMetaError(null);
  }, [link]);

  if (!link) return null;

  const handleSave = () => {
    let metadata_json: any = null;
    if (metaText.trim()) {
      try {
        metadata_json = JSON.parse(metaText);
        setMetaError(null);
      } catch (e: any) {
        setMetaError("JSON inválido: " + e.message);
        return;
      }
    }
    const payload: Partial<Link> & { id?: string } = {
      link_type: form.link_type ?? null,
      platform_name: form.platform_name ?? null,
      campaign_name: form.campaign_name ?? null,
      short_label: form.short_label ?? null,
      destination_url: form.destination_url ?? null,
      fixed_link: !!form.fixed_link,
      valid_from: form.valid_from ? new Date(form.valid_from).toISOString() : null,
      valid_until: form.valid_until ? new Date(form.valid_until).toISOString() : null,
      active: form.active ?? true,
      metadata_json,
    };
    if (!isNew && form.id) payload.id = form.id;
    onSave(payload);
  };

  return (
    <Dialog open={!!link} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isNew ? "Novo link" : "Editar link"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Rótulo curto</Label>
              <Input
                value={form.short_label ?? ""}
                onChange={(e) => setForm({ ...form, short_label: e.target.value })}
              />
            </div>
            <div>
              <Label>Tipo</Label>
              <Select
                value={form.link_type ?? "fixed"}
                onValueChange={(v) => setForm({ ...form, link_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LINK_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Plataforma</Label>
              <Input
                value={form.platform_name ?? ""}
                onChange={(e) => setForm({ ...form, platform_name: e.target.value })}
              />
            </div>
            <div>
              <Label>Campanha</Label>
              <Input
                value={form.campaign_name ?? ""}
                onChange={(e) => setForm({ ...form, campaign_name: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label>URL de destino</Label>
            <Input
              value={form.destination_url ?? ""}
              onChange={(e) => setForm({ ...form, destination_url: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Válido a partir de</Label>
              <Input
                type="datetime-local"
                value={toInputDateTime(form.valid_from ?? null)}
                onChange={(e) => setForm({ ...form, valid_from: e.target.value || null })}
              />
            </div>
            <div>
              <Label>Válido até</Label>
              <Input
                type="datetime-local"
                value={toInputDateTime(form.valid_until ?? null)}
                onChange={(e) => setForm({ ...form, valid_until: e.target.value || null })}
              />
            </div>
          </div>
          <div>
            <Label>Metadata (JSON)</Label>
            <Textarea
              rows={4}
              value={metaText}
              onChange={(e) => setMetaText(e.target.value)}
              className="font-mono text-xs"
              placeholder='{"chave": "valor"}'
            />
            {metaError && <p className="text-xs text-destructive mt-1">{metaError}</p>}
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch
                checked={!!form.fixed_link}
                onCheckedChange={(v) => setForm({ ...form, fixed_link: v })}
              />
              <Label>Link fixo (sem expiração)</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.active ?? true}
                onCheckedChange={(v) => setForm({ ...form, active: v })}
              />
              <Label>Ativo</Label>
            </div>
          </div>
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
