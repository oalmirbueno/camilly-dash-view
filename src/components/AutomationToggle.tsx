import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Power, PowerOff, Loader2, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Link } from "react-router-dom";

type Props = {
  paused: boolean;
};

/**
 * Pílula clicável de status da automação Camilly.
 * - Leitura: qualquer um vê
 * - Escrita: somente usuário autenticado, via RPC `set_camilly_paused(paused boolean)`
 * - Confirmação obrigatória em AlertDialog antes de chamar a RPC
 */
export function AutomationToggle({ paused }: Props) {
  const { session } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const isAuthed = !!session;
  const nextPaused = !paused; // estado desejado ao confirmar

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("set_camilly_paused" as any, {
        paused: nextPaused,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: nextPaused ? "Automação pausada" : "Automação ativada",
        description: nextPaused
          ? "Os envios estão suspensos até ser retomada."
          : "A automação voltou a operar normalmente.",
      });
      queryClient.invalidateQueries({ queryKey: ["vw_camilly_dashboard_summary"] });
      setOpen(false);
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "Não foi possível alterar o estado",
        description: err?.message ?? "Erro ao chamar set_camilly_paused.",
      });
    },
  });

  // Sem login: pílula apenas informativa, com hint de login
  if (!isAuthed) {
    return (
      <Link
        to="/login"
        title="Faça login para alterar o estado da automação"
        className={`group flex items-center gap-2.5 px-5 py-2.5 border transition-colors ${
          paused
            ? "border-destructive/40 bg-destructive/10 hover:bg-destructive/15"
            : "border-success/40 bg-success/10 hover:bg-success/15"
        }`}
      >
        {paused ? (
          <PowerOff className="h-4 w-4 text-destructive" />
        ) : (
          <Power className="h-4 w-4 text-success" />
        )}
        <span
          className={`text-xs font-bold uppercase tracking-[0.2em] ${
            paused ? "text-destructive" : "text-success"
          }`}
        >
          {paused ? "Pausada" : "Ativa"}
        </span>
        <Lock className="h-3 w-3 text-muted-foreground opacity-60 group-hover:opacity-100" />
      </Link>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={mutation.isPending}
        className={`flex items-center gap-2.5 px-5 py-2.5 border transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-wait ${
          paused
            ? "border-destructive/40 bg-destructive/10 hover:bg-destructive/20"
            : "border-success/40 bg-success/10 hover:bg-success/20"
        }`}
        title={paused ? "Clique para ativar a automação" : "Clique para pausar a automação"}
      >
        {mutation.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : paused ? (
          <PowerOff className="h-4 w-4 text-destructive" />
        ) : (
          <Power className="h-4 w-4 text-success" />
        )}
        <span
          className={`text-xs font-bold uppercase tracking-[0.2em] ${
            paused ? "text-destructive" : "text-success"
          }`}
        >
          {paused ? "Pausada" : "Ativa"}
        </span>
      </button>

      <AlertDialog open={open} onOpenChange={(v) => !mutation.isPending && setOpen(v)}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-2xl">
              {nextPaused ? "Pausar automação?" : "Ativar automação?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm leading-relaxed">
              {nextPaused ? (
                <>
                  Ao confirmar, a automação Camilly será <strong>suspensa</strong>.
                  Nenhuma nova mensagem será capturada, processada ou enviada até
                  que seja reativada manualmente.
                </>
              ) : (
                <>
                  Ao confirmar, a automação Camilly voltará a <strong>operar
                  normalmente</strong> — captura, processamento e envios serão
                  retomados imediatamente.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={mutation.isPending}
              className="rounded-none"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={mutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                mutation.mutate();
              }}
              className={`rounded-none ${
                nextPaused
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : "bg-success text-success-foreground hover:bg-success/90"
              }`}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Aplicando…
                </>
              ) : nextPaused ? (
                "Sim, pausar"
              ) : (
                "Sim, ativar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
