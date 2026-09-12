import { Link, useRouterState } from "@tanstack/react-router";
import {
  Building2,
  ChevronsLeft,
  ChevronsRight,
  FileBarChart,
  FileText,
  LayoutDashboard,
  LogOut,
  MapPin,
  ScrollText,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { initials } from "@/lib/format";
import { ROLE_LABEL, type Capability } from "@/lib/permissions";
import { cn } from "@/lib/utils";

type Item = { to: string; label: string; icon: LucideIcon; capability: Capability };
type Group = { label?: string; items: Item[] };

const GROUPS: Group[] = [
  {
    items: [{ to: "/", label: "Dashboard", icon: LayoutDashboard, capability: "projetos.ver" }],
  },
  {
    label: "Operação",
    items: [
      { to: "/projetos", label: "Projetos", icon: FileText, capability: "projetos.ver" },
      { to: "/notificacoes", label: "Notificações", icon: FileBarChart, capability: "notificacoes.ver" },
    ],
  },
  {
    label: "Cadastros",
    items: [
      { to: "/empresas", label: "Empresas", icon: Building2, capability: "empresas.ver" },
      { to: "/localidades", label: "Localidades", icon: MapPin, capability: "localidades.ver" },
    ],
  },
  {
    label: "Administração",
    items: [
      { to: "/usuarios", label: "Usuários", icon: Users, capability: "usuarios.ver" },
      { to: "/auditoria", label: "Auditoria", icon: ScrollText, capability: "auditoria.ver" },
    ],
  },
];

export function AppSidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const { usuario, role, can, signOut } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const isActive = (to: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to));

  return (
    <aside
      className={cn(
        "flex shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200",
        collapsed ? "w-[64px]" : "w-[236px]",
      )}
    >
      <div className="flex h-14 items-center gap-2.5 border-b border-sidebar-border px-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
          <FileBarChart className="size-4" />
        </span>
        {!collapsed ? (
          <div className="min-w-0">
            <p className="truncate text-sm leading-tight font-semibold">Gestão de Projetos</p>
            <p className="truncate text-[11px] text-sidebar-muted">Cobrança e Fiscalização</p>
          </div>
        ) : null}
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {GROUPS.map((group, gi) => {
          const items = group.items.filter((i) => can(i.capability));
          if (items.length === 0) return null;
          return (
            <div key={group.label ?? gi} className={gi > 0 ? "mt-5" : undefined}>
              {group.label && !collapsed ? (
                <p className="mb-1.5 px-2 text-[10px] font-semibold tracking-wider text-sidebar-muted uppercase">
                  {group.label}
                </p>
              ) : null}
              <ul className="space-y-0.5">
                {items.map((item) => {
                  const active = isActive(item.to);
                  return (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        title={collapsed ? item.label : undefined}
                        className={cn(
                          "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                          active
                            ? "bg-sidebar-primary font-medium text-sidebar-primary-foreground"
                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                          collapsed && "justify-center px-0",
                        )}
                      >
                        <item.icon className="size-4 shrink-0" />
                        {!collapsed ? <span className="truncate">{item.label}</span> : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-2">
        <button
          onClick={onToggle}
          className={cn(
            "mb-1 flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-xs text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            collapsed && "justify-center px-0",
          )}
        >
          {collapsed ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}
          {!collapsed ? "Recolher menu" : null}
        </button>
        <div
          className={cn(
            "flex items-center gap-2.5 rounded-md px-2 py-2",
            collapsed && "justify-center px-0",
          )}
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-sidebar-accent text-xs font-semibold text-sidebar-accent-foreground">
            {initials(usuario?.nome)}
          </span>
          {!collapsed ? (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm leading-tight font-medium">
                {usuario?.nome ?? "Usuário"}
              </p>
              <p className="truncate text-[11px] text-sidebar-muted">
                {role ? ROLE_LABEL[role] : "Sem perfil"}
              </p>
            </div>
          ) : null}
          {!collapsed ? (
            <button
              onClick={() => void signOut()}
              title="Sair"
              className="rounded-md p-1.5 text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <LogOut className="size-4" />
            </button>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
