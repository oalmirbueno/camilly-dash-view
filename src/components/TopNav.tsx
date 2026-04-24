import { NavLink } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  LayoutDashboard,
  Send,
  AlertTriangle,
  Route as RouteIcon,
  FileText,
  Link2,
  Sparkles,
  LogIn,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Item = { title: string; url: string; icon: typeof LayoutDashboard };

const navItems: Item[] = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Envios", url: "/mensagens", icon: Send },
  { title: "Rotas", url: "/rotas", icon: RouteIcon },
  { title: "Templates", url: "/templates", icon: FileText },
  { title: "Links", url: "/links", icon: Link2 },
  { title: "Erros", url: "/erros", icon: AlertTriangle },
];

export function TopNav() {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/85 backdrop-blur-md">
      {/* Shimmer line on top */}
      <div className="h-px shimmer-line" />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <div className="h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <NavLink to="/" className="flex items-center gap-3 shrink-0 group">
            <div className="h-9 w-9 flex items-center justify-center bg-foreground text-background">
              <Sparkles className="h-4 w-4 text-gold" />
            </div>
            <div className="hidden sm:block leading-none">
              <p className="section-label text-[9px] mb-1">Hub</p>
              <p className="font-display text-lg text-foreground leading-none">Camilly</p>
            </div>
          </NavLink>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">
            {navItems.map((item) => (
              <NavLink
                key={item.url}
                to={item.url}
                end={item.url === "/"}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 px-3.5 h-10 text-[13px] font-medium tracking-wide transition-colors border-b-2",
                    isActive
                      ? "text-foreground border-gold"
                      : "text-muted-foreground border-transparent hover:text-foreground hover:border-border",
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                <span>{item.title}</span>
              </NavLink>
            ))}
          </nav>

          {/* Auth + mobile toggle */}
          <div className="flex items-center gap-2 shrink-0">
            {loading ? null : user ? (
              <>
                <span className="text-[11px] text-muted-foreground hidden xl:inline tracking-wider uppercase">
                  {user.email}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={signOut}
                  className="rounded-none uppercase tracking-wider text-[11px] h-9 hidden sm:inline-flex"
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
                className="rounded-none uppercase tracking-wider text-[11px] h-9 border-foreground/20 hidden sm:inline-flex"
              >
                <LogIn className="h-3.5 w-3.5 mr-1.5" />
                Entrar
              </Button>
            )}

            <button
              onClick={() => setMobileOpen((o) => !o)}
              className="lg:hidden h-10 w-10 flex items-center justify-center border border-border text-foreground hover:bg-accent/40"
              aria-label="Menu"
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-border bg-card">
          <nav className="max-w-[1400px] mx-auto px-4 py-3 flex flex-col gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.url}
                to={item.url}
                end={item.url === "/"}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 h-11 text-sm font-medium",
                    isActive
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:bg-accent/40 hover:text-foreground",
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                <span>{item.title}</span>
              </NavLink>
            ))}
            {!user && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setMobileOpen(false);
                  navigate("/login");
                }}
                className="rounded-none uppercase tracking-wider text-[11px] h-10 mt-2 sm:hidden"
              >
                <LogIn className="h-3.5 w-3.5 mr-1.5" />
                Entrar
              </Button>
            )}
            {user && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setMobileOpen(false);
                  signOut();
                }}
                className="rounded-none uppercase tracking-wider text-[11px] h-10 mt-2 sm:hidden justify-start"
              >
                <LogOut className="h-3.5 w-3.5 mr-1.5" />
                Sair ({user.email})
              </Button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
