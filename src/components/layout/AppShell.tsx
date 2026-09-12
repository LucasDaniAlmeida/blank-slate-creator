import { useNavigate } from "@tanstack/react-router";
import { LogOut, Search } from "lucide-react";
import { useState, type ReactNode } from "react";

import { AppSidebar } from "@/components/layout/AppSidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { initials } from "@/lib/format";
import { ROLE_LABEL } from "@/lib/permissions";

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [term, setTerm] = useState("");
  const navigate = useNavigate();
  const { usuario, role, signOut } = useAuth();

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-surface px-4">
          <form
            className="relative max-w-md flex-1"
            onSubmit={(e) => {
              e.preventDefault();
              if (!term.trim()) return;
              void navigate({ to: "/projetos", search: { busca: term.trim() } });
            }}
          >
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Buscar projetos, empresas, CNPJ, número SIGUM..."
              className="h-9 pl-8"
            />
          </form>

          <div className="ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-accent">
                <span className="grid size-8 place-items-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
                  {initials(usuario?.nome)}
                </span>
                <span className="hidden sm:block">
                  <span className="block text-sm leading-tight font-medium">
                    {usuario?.nome ?? "Usuário"}
                  </span>
                  <span className="block text-[11px] text-muted-foreground">
                    {role ? ROLE_LABEL[role] : "Sem perfil"}
                  </span>
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                  {usuario?.matricula ? `Matrícula ${usuario.matricula}` : "Conta"}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => void signOut()}>
                  <LogOut className="size-4" />
                  Sair do sistema
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 py-5 lg:px-6">
          <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4">{children}</div>
        </main>
      </div>
    </div>
  );
}
