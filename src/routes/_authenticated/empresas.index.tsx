import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Building2, FileText, Mail, Plus } from "lucide-react";
import { useEffect, useState } from "react";

import { EmptyState, ErrorState, TableSkeleton } from "@/components/common/DataStates";
import { Pagination, Td, Th, Tr } from "@/components/common/DataTable";
import { ALL, FilterBar, FilterSelect, SearchField } from "@/components/common/Filters";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatCNPJ, formatNumber } from "@/lib/format";

const PAGE_SIZE = 15;

export const Route = createFileRoute("/_authenticated/empresas/")({
  head: () => ({
    meta: [
      { title: "Empresas — Gestão de Projetos, Cobrança e Fiscalização" },
      { name: "description", content: "Cadastro e gerenciamento das empresas, contratos e contatos." },
      { property: "og:title", content: "Empresas — Gestão de Projetos" },
      { property: "og:description", content: "Cadastro das empresas do sistema." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: EmpresasPage,
});

type Row = {
  id: string;
  cnpj: string;
  nome_comercial: string;
  nome_fantasia: string | null;
  uc: string | null;
  codigo_contrato: string | null;
  numero_sigum: string | null;
  responsavel: string | null;
  emails: string[];
  created_at: string;
};

function EmpresasPage() {
  const navigate = useNavigate();
  const { can } = useAuth();
  const [busca, setBusca] = useState("");
  const [termo, setTermo] = useState("");
  const [contrato, setContrato] = useState(ALL);
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState({ key: "nome_comercial", asc: true });

  useEffect(() => {
    const t = setTimeout(() => {
      setTermo(busca.trim());
      setPage(0);
    }, 350);
    return () => clearTimeout(t);
  }, [busca]);

  const lista = useQuery({
    queryKey: ["empresas", { termo, contrato }, page, sort],
    queryFn: async () => {
      let query = supabase
        .from("empresas")
        .select(
          "id, cnpj, nome_comercial, nome_fantasia, uc, codigo_contrato, numero_sigum, responsavel, emails, created_at",
          { count: "exact" },
        );
      if (termo)
        query = query.or(
          `nome_comercial.ilike.%${termo}%,nome_fantasia.ilike.%${termo}%,cnpj.ilike.%${termo}%,numero_sigum.ilike.%${termo}%,uc.ilike.%${termo}%`,
        );
      if (contrato === "com") query = query.not("codigo_contrato", "is", null);
      if (contrato === "sem") query = query.is("codigo_contrato", null);
      const { data, error, count } = await query
        .order(sort.key, { ascending: sort.asc })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
      if (error) throw new Error(error.message);
      return { rows: (data ?? []) as unknown as Row[], total: count ?? 0 };
    },
  });

  const resumo = useQuery({
    queryKey: ["empresas", "resumo"],
    staleTime: 60_000,
    queryFn: async () => {
      const [empresas, projetos] = await Promise.all([
        supabase.from("empresas").select("id, emails, codigo_contrato").limit(1000),
        supabase.from("projetos").select("empresa_id").limit(1000),
      ]);
      if (empresas.error) throw new Error(empresas.error.message);
      if (projetos.error) throw new Error(projetos.error.message);
      const rows = empresas.data ?? [];
      const comProjeto = new Set((projetos.data ?? []).map((p) => p.empresa_id));
      return {
        total: rows.length,
        comContrato: rows.filter((r) => r.codigo_contrato).length,
        comEmail: rows.filter((r) => (r.emails ?? []).length > 0).length,
        comProjetos: rows.filter((r) => comProjeto.has(r.id)).length,
      };
    },
  });

  const rows = lista.data?.rows ?? [];
  const canClear = Boolean(busca) || contrato !== ALL;

  function toggleSort(key: string) {
    setSort((s) => (s.key === key ? { key, asc: !s.asc } : { key, asc: true }));
  }

  return (
    <>
      <PageHeader
        title="Empresas"
        description="Gerencie as empresas cadastradas, contratos e canais de contato."
        actions={
          can("empresas.criar") ? (
            <Button asChild size="sm">
              <Link to="/empresas/novo">
                <Plus className="size-4" />
                Nova Empresa
              </Link>
            </Button>
          ) : null
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard compact label="Total de empresas" value={formatNumber(resumo.data?.total ?? 0)} icon={Building2} tone="primary" loading={resumo.isLoading} />
        <StatCard compact label="Com contrato" value={formatNumber(resumo.data?.comContrato ?? 0)} icon={FileText} tone="success" loading={resumo.isLoading} />
        <StatCard compact label="Com e-mail cadastrado" value={formatNumber(resumo.data?.comEmail ?? 0)} icon={Mail} tone="warning" loading={resumo.isLoading} />
        <StatCard compact label="Com projetos" value={formatNumber(resumo.data?.comProjetos ?? 0)} icon={FileText} tone="neutral" loading={resumo.isLoading} />
      </div>

      <FilterBar
        canClear={canClear}
        onClear={() => {
          setBusca("");
          setContrato(ALL);
          setPage(0);
        }}
      >
        <SearchField value={busca} onChange={setBusca} placeholder="Buscar por CNPJ, nome, SIGUM, UC..." />
        <FilterSelect
          label="Contrato"
          value={contrato}
          onChange={(v) => {
            setContrato(v);
            setPage(0);
          }}
          options={[
            { value: "com", label: "Com contrato" },
            { value: "sem", label: "Sem contrato" },
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
                    <Th sortKey="cnpj" sort={sort} onSort={toggleSort}>
                      CNPJ
                    </Th>
                    <Th sortKey="nome_comercial" sort={sort} onSort={toggleSort}>
                      Nome comercial
                    </Th>
                    <Th>Nome fantasia</Th>
                    <Th>UC</Th>
                    <Th>Contrato SIGUM</Th>
                    <Th>Responsável</Th>
                    <Th>E-mails</Th>
                  </tr>
                </thead>
                {lista.isLoading ? (
                  <TableSkeleton cols={7} />
                ) : (
                  <tbody>
                    {rows.map((e) => (
                      <Tr key={e.id} onClick={() => void navigate({ to: "/empresas/$id", params: { id: e.id } })}>
                        <Td className="tabular whitespace-nowrap">{formatCNPJ(e.cnpj)}</Td>
                        <Td className="max-w-[240px] truncate font-medium">{e.nome_comercial}</Td>
                        <Td className="max-w-[160px] truncate">{e.nome_fantasia ?? "—"}</Td>
                        <Td>{e.uc ?? "—"}</Td>
                        <Td className="whitespace-nowrap">{e.codigo_contrato ?? e.numero_sigum ?? "—"}</Td>
                        <Td className="max-w-[150px] truncate">{e.responsavel ?? "—"}</Td>
                        <Td className="max-w-[220px] truncate text-muted-foreground">
                          {(e.emails ?? []).length > 0 ? e.emails.join(", ") : "—"}
                        </Td>
                      </Tr>
                    ))}
                  </tbody>
                )}
              </table>
            </div>

            {!lista.isLoading && rows.length === 0 ? (
              <EmptyState
                title="Nenhuma empresa encontrada."
                description={
                  canClear
                    ? "Ajuste a busca ou limpe os filtros."
                    : "Cadastre a primeira empresa para vincular projetos e notificações."
                }
                action={
                  can("empresas.criar") && !canClear ? (
                    <Button asChild size="sm">
                      <Link to="/empresas/novo">
                        <Plus className="size-4" />
                        Nova Empresa
                      </Link>
                    </Button>
                  ) : null
                }
              />
            ) : null}

            {rows.length > 0 ? (
              <Pagination
                page={page}
                pageSize={PAGE_SIZE}
                total={lista.data?.total ?? 0}
                onPage={setPage}
                itemLabel="empresas"
              />
            ) : null}
          </>
        )}
      </div>
    </>
  );
}
