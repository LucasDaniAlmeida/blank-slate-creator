import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import { can as canDo, isRole, type Capability, type Role } from "@/lib/permissions";

export type UsuarioAtual = {
  id: string;
  nome: string | null;
  matricula: string | null;
  cargo: string | null;
  ativo: boolean;
  perfil_id: string | null;
  perfil_nome: string | null;
};

type AuthValue = {
  session: Session | null;
  user: User | null;
  usuario: UsuarioAtual | null;
  role: Role | null;
  loading: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
  can: (capability: Capability) => boolean;
};

const AuthContext = createContext<AuthValue | null>(null);

async function loadUsuario(userId: string): Promise<UsuarioAtual | null> {
  const { data, error } = await supabase
    .from("usuarios")
    .select("id, nome, matricula, cargo, ativo, perfil_id, perfis_acesso(nome)")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return null;
  const perfil = (data as { perfis_acesso?: { nome: string } | null }).perfis_acesso;
  return {
    id: data.id,
    nome: data.nome,
    matricula: data.matricula,
    cargo: data.cargo,
    ativo: data.ativo,
    perfil_id: data.perfil_id,
    perfil_nome: perfil?.nome ?? null,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [usuario, setUsuario] = useState<UsuarioAtual | null>(null);
  const [loading, setLoading] = useState(true);

  const hydrate = useCallback(async (nextSession: Session | null) => {
    setSession(nextSession);
    if (nextSession?.user) {
      setUsuario(await loadUsuario(nextSession.user.id));
    } else {
      setUsuario(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (active) void hydrate(data.session);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!active) return;
      if (event === "TOKEN_REFRESHED") {
        setSession(nextSession);
        return;
      }
      void hydrate(nextSession);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [hydrate]);

  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    await hydrate(data.session);
  }, [hydrate]);

  const value = useMemo<AuthValue>(() => {
    const role = isRole(usuario?.perfil_nome) ? usuario.perfil_nome : null;
    return {
      session,
      user: session?.user ?? null,
      usuario,
      role,
      loading,
      refresh,
      signOut: async () => {
        await supabase.auth.signOut();
      },
      can: (capability: Capability) => canDo(role, capability),
    };
  }, [session, usuario, loading, refresh]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
