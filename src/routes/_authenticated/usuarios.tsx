import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Pencil, ShieldCheck, UserCheck, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { EmptyState, ErrorState, TableSkeleton } from "@/components/common/DataStates";
import { Td, Th, Tr } from "@/components/common/DataTable";
import { ALL, FilterBar, FilterSelect, SearchField } from "@/components/common/Filters";
import { Field, SelectField } from "@/components/common/FormKit";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { usePerfisAcesso } from "@/hooks/useLookups";
import { supabase } from "@/integrations/supabase/client";
import { formatDateTime, formatNumber } from "@/lib/format";
import { ROLE_LABEL, isRole } from "@/lib/permissions";

export const Route = createFileRoute("/_authenticated/usuarios")({
  head: () => ({
    meta: [
      { title: "Usuários — Gestão de Projetos, Cobrança e Fiscalização" },
      { name: "description", content: "Gerencie usuários, perfis de acesso e situação das contas." },
      { property: "og:title", content: "Usuários — Gestão de Projetos" },
      { property: "og:description", content: "Gerencie usuários e permissões do sistema." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: UsuariosPage,
});

type Row = {
  id: string;
  nome: string | null;
  matricula: string | null;
  cargo: string | null;
  ativo: boolean;
  perfil_id: string | null;
  updated_at: string;
  created_at: string;
  perfis_acesso: { id: string; nome: string } | null;
};

type EditValues = { nome: string; matricula: string; cargo: string; perfil_id: string; ativo: boolean };

function UsuariosPage() {
  const { can } = useAuth();
  const queryClient = useQueryClient();
  const perfis = usePerfisAcesso();
  const [busca, setBusca] = useState("");
  const [termo, setTermo] = useState("");
  const [perfil, setPerfil] = useState(ALL);
  const [situacao, setSituacao] = useState(ALL);
  const [editando, setEditando] = useState<{ id: string; values: EditValues } | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setTermo(busca.trim()), 350);
    return () => clearTimeout(t);
  }, [busca]);

  const lista = useQuery({
    queryKey: ["usuarios", { termo, perfil, situacao }],
    enabled: can("usuarios.ver"),
    queryFn: async () => {
      let query = supabase
        .from("usuarios")
        .select("id, nome, matricula, cargo, ativo, perfil_id, created_at, updated_at, perfis_acesso(id, nome)")
        .order("nome");
      if (termo) query = query.or(`nome.ilike.%${termo}%,matricula.ilike.%${termo}%,cargo.ilike.%${termo}%`);
      if (perfil !== ALL) query = query.eq("perfil_id", perfil);
      if (situacao !== ALL) query = query.eq("ativo", situacao === "ativos");
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return (data ?? []) as unknown as Row[];
    },
  });

  const salvar = useMutation({
    mutationFn: async () => {
      if (!editando) return;
      const { error } = await supabase
        .from("usuarios")
        .update({
          nome: editando.values.nome.trim() || null,
          matricula: editando.values.matricula.trim() || null,
          cargo: editando.values.cargo.trim() || null,
          perfil_id: editando.values.perfil_id || null,
          ativo: editando.values.ativo,
        })
        .eq("id", editando.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      await queryClient.invalidateQueries({ queryKey: ["lookup", "usuarios"] });
      toast.success("Usuário atualizado.");
      setEditando(null);
    },
    onError: (e) =>
      toast.error(
        /row-level security/i.test(e.message)
          ? "Apenas administradores podem alterar usuários."
          : e.message,
      ),
  });

  if (!can("usuarios.ver")) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-sm shadow-card">
        Esta área é restrita a administradores do sistema.
      </div>
    );
  }

  const rows = lista.data ?? [];
  const canClear = Boolean(busca) || perfil !== ALL || situacao !== ALL;
  const totalAtivos = rows.filter((u) => u.ativo).length;
  const admins = rows.filter((u) => u.perfis_acesso?.nome === "administrador").length;
  const analistas = rows.filter((u) => u.perfis_acesso?.nome === "analista").length;

  return (
    <>
      <PageHeader
        title="Usuários"
        description="Gerencie os usuários e seus perfis de acesso ao sistema."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard compact label="Total de usuários" value={formatNumber(rows.length)} icon={Users} tone="primary" loading={lista.isLoading} />
        <StatCard compact label="Ativos" value={formatNumber(totalAtivos)} icon={UserCheck} tone="success" loading={lista.isLoading} />
        <StatCard compact label="Administradores" value={formatNumber(admins)} icon={ShieldCheck} tone="warning" loading={lista.isLoading} />
        <StatCard compact label="Analistas" value={formatNumber(analistas)} icon={Users} tone="neutral" loading={lista.isLoading} />
      </div>

      <FilterBar
        canClear={canClear}
        onClear={() => {
          setBusca("");
          setPerfil(ALL);
          setSituacao(ALL);
        }}
      >
        <SearchField value={busca} onChange={setBusca} placeholder="Buscar por nome, matrícula ou cargo..." />
        <FilterSelect
          label="Perfil"
          value={perfil}
          onChange={setPerfil}
          options={(perfis.data ?? []).map((p) => ({
            value: p.id,
            label: isRole(p.nome) ? ROLE_LABEL[p.nome] : p.nome,
          }))}
        />
        <FilterSelect
          label="Situação"
          value={situacao}
          onChange={setSituacao}
          options={[
            { value: "ativos", label: "Ativos" },
            { value: "inativos", label: "Inativos" },
          ]}
        />
      </FilterBar>

      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-card">
        {lista.error ? (
          <ErrorState message={(lista.error as Error).message} onRetry={() => void lista.refetch()} />
        ) : (
          <>
            <div className="max-w-full overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <Th>Nome</Th>
                    <Th>Matrícula</Th>
                    <Th>Cargo</Th>
                    <Th>Perfil</Th>
                    <Th>Situação</Th>
                    <Th>Última atualização</Th>
                    <Th align="right">Ações</Th>
                  </tr>
                </thead>
                {lista.isLoading ? (
                  <TableSkeleton cols={7} />
                ) : (
                  <tbody>
                    {rows.map((u) => (
                      <Tr key={u.id}>
                        <Td className="font-medium">{u.nome ?? "—"}</Td>
                        <Td className="tabular">{u.matricula ?? "—"}</Td>
                        <Td>{u.cargo ?? "—"}</Td>
                        <Td>
                          <StatusBadge
                            label={
                              u.perfis_acesso
                                ? isRole(u.perfis_acesso.nome)
                                  ? ROLE_LABEL[u.perfis_acesso.nome]
                                  : u.perfis_acesso.nome
                                : "Sem perfil"
                            }
                            tone="primary"
                          />
                        </Td>
                        <Td>
                          <StatusBadge
                            label={u.ativo ? "Ativo" : "Inativo"}
                            tone={u.ativo ? "success" : "danger"}
                          />
                        </Td>
                        <Td className="tabular whitespace-nowrap">{formatDateTime(u.updated_at)}</Td>
                        <Td align="right">
                          {can("usuarios.gerenciar") ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7"
                              aria-label="Editar usuário"
                              onClick={() =>
                                setEditando({
                                  id: u.id,
                                  values: {
                                    nome: u.nome ?? "",
                                    matricula: u.matricula ?? "",
                                    cargo: u.cargo ?? "",
                                    perfil_id: u.perfil_id ?? "",
                                    ativo: u.ativo,
                                  },
                                })
                              }
                            >
                              <Pencil className="size-3.5" />
                            </Button>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </Td>
                      </Tr>
                    ))}
                  </tbody>
                )}
              </table>
            </div>

            {!lista.isLoading && rows.length === 0 ? (
              <EmptyState
                title="Nenhum usuário encontrado."
                description="Os usuários aparecem aqui após o primeiro acesso ao sistema."
              />
            ) : null}
          </>
        )}
      </div>

      <Dialog open={editando !== null} onOpenChange={(o) => (!o ? setEditando(null) : null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar usuário</DialogTitle>
            <DialogDescription>
              Alterar o perfil muda imediatamente as permissões do usuário no sistema.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome">
              <Input
                value={editando?.values.nome ?? ""}
                onChange={(e) =>
                  setEditando((s) => (s ? { ...s, values: { ...s.values, nome: e.target.value } } : s))
                }
                className="h-9"
              />
            </Field>
            <Field label="Matrícula">
              <Input
                value={editando?.values.matricula ?? ""}
                onChange={(e) =>
                  setEditando((s) => (s ? { ...s, values: { ...s.values, matricula: e.target.value } } : s))
                }
                className="h-9"
              />
            </Field>
            <Field label="Cargo">
              <Input
                value={editando?.values.cargo ?? ""}
                onChange={(e) =>
                  setEditando((s) => (s ? { ...s, values: { ...s.values, cargo: e.target.value } } : s))
                }
                className="h-9"
              />
            </Field>
            <Field label="Perfil de acesso">
              <SelectField
                value={editando?.values.perfil_id ?? ""}
                onChange={(v) =>
                  setEditando((s) =>
                    s ? { ...s, values: { ...s.values, perfil_id: v === "__none__" ? "" : v } } : s,
                  )
                }
                options={(perfis.data ?? []).map((p) => ({
                  value: p.id,
                  label: isRole(p.nome) ? ROLE_LABEL[p.nome] : p.nome,
                }))}
                emptyLabel="Sem perfil"
              />
            </Field>
            <div className="flex items-center gap-2 sm:col-span-2">
              <Switch
                id="ativo"
                checked={editando?.values.ativo ?? false}
                onCheckedChange={(c) =>
                  setEditando((s) => (s ? { ...s, values: { ...s.values, ativo: c } } : s))
                }
              />
              <label htmlFor="ativo" className="text-sm">
                Usuário ativo
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditando(null)}>
              Cancelar
            </Button>
            <Button onClick={() => salvar.mutate()} disabled={salvar.isPending}>
              {salvar.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Salvar alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
