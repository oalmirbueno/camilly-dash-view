import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import { LogIn, LogOut } from "lucide-react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b border-border bg-card/60 backdrop-blur px-4 sticky top-0 z-30">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              <div className="hidden sm:flex items-center gap-2">
                <span className="sparkle-dot" />
                <span className="section-label text-[9px]">Painel operacional</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {loading ? null : user ? (
                <>
                  <span className="text-[11px] text-muted-foreground hidden sm:inline tracking-wider uppercase">
                    {user.email}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={signOut}
                    className="rounded-none uppercase tracking-wider text-[11px] h-8"
                  >
                    <LogOut className="h-3.5 w-3.5 mr-1.5" />
                    Sair
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/login")}
                  className="rounded-none uppercase tracking-wider text-[11px] h-8 border-foreground/20"
                >
                  <LogIn className="h-3.5 w-3.5 mr-1.5" />
                  Entrar
                </Button>
              )}
            </div>
          </header>
          <main className="flex-1 p-6 sm:p-8 overflow-auto max-w-[1400px] w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
