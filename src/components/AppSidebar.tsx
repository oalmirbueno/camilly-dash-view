import { LayoutDashboard, Send, AlertTriangle, Route, FileText, Link2, Sparkles } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

type Item = { title: string; url: string; icon: typeof LayoutDashboard };

const groups: { label: string; items: Item[] }[] = [
  {
    label: "Operação",
    items: [
      { title: "Dashboard", url: "/", icon: LayoutDashboard },
      { title: "Envios", url: "/mensagens", icon: Send },
      { title: "Rotas", url: "/rotas", icon: Route },
    ],
  },
  {
    label: "Conteúdo",
    items: [
      { title: "Templates", url: "/templates", icon: FileText },
      { title: "Links", url: "/links", icon: Link2 },
    ],
  },
  {
    label: "Saúde",
    items: [{ title: "Erros", url: "/erros", icon: AlertTriangle }],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r border-border bg-card">
      {/* Brand / Hub header */}
      <div className="px-4 py-5 border-b border-border bg-gradient-to-b from-card to-background">
        {!collapsed ? (
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 flex items-center justify-center bg-foreground text-background shrink-0">
              <Sparkles className="h-4 w-4 text-gold" />
            </div>
            <div className="min-w-0">
              <p className="section-label leading-none mb-1.5">Hub</p>
              <h1 className="font-display text-lg leading-none text-foreground truncate">
                Camilly
              </h1>
              <p className="text-[11px] text-muted-foreground mt-1 tracking-wide">
                Automação Bet
              </p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="h-9 w-9 flex items-center justify-center bg-foreground text-background">
              <Sparkles className="h-4 w-4 text-gold" />
            </div>
          </div>
        )}
        {!collapsed && <div className="mt-4 h-px shimmer-line" />}
      </div>

      <SidebarContent className="px-2 py-3">
        {groups.map((group) => (
          <SidebarGroup key={group.label} className="mb-2">
            {!collapsed && (
              <SidebarGroupLabel className="section-label px-2 mb-1">
                {group.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className="h-10">
                      <NavLink
                        to={item.url}
                        end={item.url === "/"}
                        className="group relative flex items-center gap-3 px-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent/40 hover:text-foreground"
                        activeClassName="!bg-foreground !text-background font-medium hover:!bg-foreground"
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span className="truncate">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {!collapsed && (
        <div className="mt-auto px-4 py-4 border-t border-border">
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="sparkle-dot" />
            <span className="tracking-wider uppercase">Sistema online</span>
          </div>
        </div>
      )}
    </Sidebar>
  );
}
