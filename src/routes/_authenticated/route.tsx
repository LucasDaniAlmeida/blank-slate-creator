import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { AppShell } from "@/components/layout/AppShell";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { InlineLoader } from "@/components/common/DataStates";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/login" });
    return { user: data.user };
  },
  component: ProtectedLayout,
});

function ProtectedLayout() {
  return (
    <AuthProvider>
      <ShellGate />
    </AuthProvider>
  );
}

function ShellGate() {
  const { loading, usuario, role } = useAuth();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <InlineLoader label="Carregando sessão..." />
      </div>
    );
  }

  if (usuario && !usuario.ativo) {
    return (
      <div className="grid min-h-screen place-items-center px-4">
        <div className="max-w-md rounded-lg border border-border bg-card p-6 text-center shadow-card">
          <h1 className="text-base font-semibold">Acesso desativado</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Seu usuário está inativo. Procure um administrador do sistema para reativar o acesso.
          </p>
        </div>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="grid min-h-screen place-items-center px-4">
        <div className="max-w-md rounded-lg border border-border bg-card p-6 text-center shadow-card">
          <h1 className="text-base font-semibold">Perfil de acesso não definido</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sua conta ainda não possui um perfil de acesso vinculado. Solicite a liberação a um
            administrador.
          </p>
        </div>
      </div>
    );
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
