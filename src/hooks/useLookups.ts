import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

async function unwrap<T>(promise: PromiseLike<{ data: T | null; error: { message: string } | null }>) {
  const { data, error } = await promise;
  if (error) throw new Error(error.message);
  return (data ?? []) as T;
}

export type Option = { value: string; label: string };

export function useEmpresasOptions() {
  return useQuery({
    queryKey: ["lookup", "empresas"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const rows = await unwrap(
        supabase
          .from("empresas")
          .select("id, nome_comercial, nome_fantasia, cnpj")
          .order("nome_comercial"),
      );
      return rows as { id: string; nome_comercial: string; nome_fantasia: string | null; cnpj: string }[];
    },
  });
}

export function useLocalidadesOptions() {
  return useQuery({
    queryKey: ["lookup", "localidades"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const rows = await unwrap(
        supabase
          .from("localidades")
          .select("id, cidade, estado, polo, regional")
          .order("cidade"),
      );
      return rows as {
        id: string;
        cidade: string;
        estado: string;
        polo: string | null;
        regional: string | null;
      }[];
    },
  });
}

export function useUsuariosOptions() {
  return useQuery({
    queryKey: ["lookup", "usuarios"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const rows = await unwrap(
        supabase.from("usuarios").select("id, nome, matricula, ativo").order("nome"),
      );
      return rows as { id: string; nome: string | null; matricula: string | null; ativo: boolean }[];
    },
  });
}

export function useStatusCobranca() {
  return useQuery({
    queryKey: ["lookup", "status_cobranca"],
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const rows = await unwrap(
        supabase.from("status_cobranca").select("id, nome, ordem, ativo").order("ordem"),
      );
      return rows as { id: string; nome: string; ordem: number; ativo: boolean }[];
    },
  });
}

export function useStatusFiscalizacao() {
  return useQuery({
    queryKey: ["lookup", "status_fiscalizacao"],
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const rows = await unwrap(
        supabase.from("status_fiscalizacao").select("id, nome, ordem, ativo").order("ordem"),
      );
      return rows as { id: string; nome: string; ordem: number; ativo: boolean }[];
    },
  });
}

export function usePerfisAcesso() {
  return useQuery({
    queryKey: ["lookup", "perfis_acesso"],
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const rows = await unwrap(
        supabase.from("perfis_acesso").select("id, nome, descricao, ativo").order("nome"),
      );
      return rows as { id: string; nome: string; descricao: string | null; ativo: boolean }[];
    },
  });
}

export function empresaLabel(e: { nome_comercial: string; nome_fantasia: string | null }) {
  return e.nome_fantasia && e.nome_fantasia !== e.nome_comercial
    ? `${e.nome_comercial} (${e.nome_fantasia})`
    : e.nome_comercial;
}

export function localidadeLabel(l: { cidade: string; estado: string }) {
  return `${l.cidade}/${l.estado}`;
}
