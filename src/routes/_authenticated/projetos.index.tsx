import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, CalendarClock, Clock, FileText, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { EmptyState, ErrorState, TableSkeleton } from "@/components/common/DataStates";
import { ALL, FilterBar, FilterSelect, SearchField } from "@/components/common/Filters";
import { PageHeader } from "@/components/common/PageHeader";
import { Pagination, TableShell, Td, Th, Tr } from "@/components/common/DataTable";
import { StatCard } from "@/components/common/StatCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  empresaLabel,
  localidadeLabel,
  useEmpresasOptions,
  useLocalidadesOptions,
  useStatusCobranca,
  useStatusFiscalizacao,
} from "@/hooks/useLookups";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, formatNumber } from "@/lib/format";

const PAGE_SIZE = 15;

export const Route = createFileRoute("/_authenticated/projetos/")({
  validateSearch: (search: Record<string, unknown>) => ({
    busca: typeof search.busca === "string" ? search.busca : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Projetos — Gestão de Projetos, Cobrança e Fiscalização" },
      {
        name: "description",
        content: "Listagem e gerenciamento dos projetos cadastrados, com filtros e status.",
      },
      { property: "og:title", content: "Projetos — Gestão de Projetos" },
      { property: "og:description", content: "Gerenciamento dos projetos cadastrados no sistema." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProjetosPage,
});

type Row = {
  id: string;
  numero_projeto: string;
  numero_contrato_sigum: string | null;
  solicitante: string | null;
  data_abertura: string | null;
  data_inicio_cobranca: string | null;
  data_fiscalizacao: string | null;
  quantidade_postes: number;
  projeto_cadastrado: boolean;
  created_at: string;
  empresas: { nome_comercial: string } | null;
  localidades: { cidade: string; estado: string } | null;
  usuarios: { nome: string | null } | null;
  status_cobranca: { nome: string } | null;
  status_fiscalizacao: { nome: string } | null;
};

const SELECT =
  "id, numero_projeto, numero_contrato_sigum, solicitante, data_abertura, data_inicio_cobranca, data_fiscalizacao, quantidade_postes, projeto_cadastrado, created_at, empresas(nome_comercial), localidades(cidade, estado), usuarios(nome), status_cobranca(nome), status_fiscalizacao(nome)";

function ProjetosPage() {
  const { busca: buscaInicial } = Route.useSearch();
  const navigate = useNavigate();
  const { can } = useAuth();

  const [busca, setBusca] = useState(buscaInicial ?? "");
  const [termo, setTermo] = useState(buscaInicial ?? "");
  const [empresa, setEmpresa] = useState(ALL);
  const [localidade, setLocalidade] = useState(ALL);
  const [cobranca, setCobranca] = useState(ALL);
  const [fiscalizacao, setFiscalizacao] = useState(ALL);
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState({ key: "created_at", asc: false });

  useEffect(() => {
    const t = setTimeout(() => {
      setTermo(busca.trim());
      setPage(0);
    }, 350);
    return () => clearTimeout(t);
  }, [busca]);

  const empresas = useEmpresasOptions();
  const localidades = useLocalidadesOptions();
  const statusCobranca = useStatusCobranca();
  const statusFiscalizacao = useStatusFiscalizacao();

  const filtros = { termo, empresa, localidade, cobranca, fiscalizacao };

  const lista = useQuery({
    queryKey: ["projetos", filtros, page, sort],
    queryFn: async () => {
      let query = supabase.from("projetos").select(SELECT, { count: "exact" });
      if (termo) {
        query = query.or(
          `numero_projeto.ilike.%${termo}%,numero_contrato_sigum.ilike.%${termo}%,solicitante.ilike.%${termo}%,numero_chamado.ilike.%${termo}%`,
        );
      }
      if (empresa !== ALL) query = query.eq("empresa_id", empresa);
      if (localidade !== ALL) query = query.eq("localidade_id", localidade);
      if (cobranca !== ALL) query = query.eq("status_cobranca_id", cobranca);
      if (fiscalizacao !== ALL) query = query.eq("status_fiscalizacao_id", fiscalizacao);

      const { data, error, count } = await query
        .order(sort.key, { ascending: sort.asc })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
      if (error) throw new Error(error.message);
      return { rows: (data ?? []) as unknown as Row[], total: count ?? 0 };
    },
  });

  const canClear =
    Boolean(busca) || [empresa, localidade, cobranca, fiscalizacao].some((v) => v !== ALL);

  const empresaOptions = useMemo(
    () => (empresas.data ?? []).map((e) => ({ value: e.id, label: empresaLabel(e) })),
    [empresas.data],
  );
  const localidadeOptions = useMemo(
    () => (localidades.data ?? []).map((l) => ({ value: l.id, label: localidadeLabel(l) })),
    [localidades.data],
  );

  function toggleSort(key: string) {
    setSort((s) => (s.key === key ? { key, asc: !s.asc } : { key, asc: true }));
  }

  const rows = lista.data?.rows ?? [];

  return (
    <>
      <PageHeader
        title="Projetos"
        description="Gerencie os projetos cadastrados, acompanhando cobrança e fiscalização."
        actions={
          can("projetos.criar") ? (
            <Button asChild size="sm">
              <Link to="/projetos/novo">
                <Plus className="size-4" />
                Novo Projeto
              </Link>
            </Button>
          ) : null
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          compact
          label="Total de projetos"
          value="128"
          icon={FileText}
          tone="primary"
        />
        <StatCard
          compact
          label="Vence amanhã"
          value="7"
          icon={CalendarClock}
          tone="warning"
        />
        <StatCard
          compact
          label="2 a 5 dias"
          value="19"
          icon={Clock}
          tone="primary"
        />
        <StatCard
          compact
          label="+5 dias"
          value="86"
          icon={CalendarClock}
          tone="success"
        />
        <StatCard
          compact
          label="Vencidos"
          value="16"
          icon={AlertTriangle}
          tone="danger"
        />
      </div>

      <FilterBar
        canClear={canClear}
        onClear={() => {
          setBusca("");
          setEmpresa(ALL);
          setLocalidade(ALL);
          setCobranca(ALL);
          setFiscalizacao(ALL);
          setPage(0);
          void navigate({ to: "/projetos", search: {} });
        }}
      >
        <SearchField
          value={busca}
          onChange={setBusca}
          placeholder="Buscar por projeto, contrato SIGUM, solicitante, chamado..."
        />
        <FilterSelect
          label="Empresa"
          value={empresa}
          onChange={(v) => {
            setEmpresa(v);
            setPage(0);
          }}
          options={empresaOptions}
          className="min-w-[200px]"
        />
        <FilterSelect
          label="Localidade"
          value={localidade}
          onChange={(v) => {
            setLocalidade(v);
            setPage(0);
          }}
          options={localidadeOptions}
        />
        <FilterSelect
          label="Status cobrança"
          value={cobranca}
          onChange={(v) => {
            setCobranca(v);
            setPage(0);
          }}
          options={(statusCobranca.data ?? []).map((s) => ({ value: s.id, label: s.nome }))}
        />
        <FilterSelect
          label="Status fiscalização"
          value={fiscalizacao}
          onChange={(v) => {
            setFiscalizacao(v);
            setPage(0);
          }}
          options={(statusFiscalizacao.data ?? []).map((s) => ({ value: s.id, label: s.nome }))}
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
                    <Th sortKey="numero_projeto" sort={sort} onSort={toggleSort}>
                      Projeto
                    </Th>
                    <Th>Empresa</Th>
                    <Th>Localidade</Th>
                    <Th>Responsável</Th>
                    <Th align="right" sortKey="quantidade_postes" sort={sort} onSort={toggleSort}>
                      Postes
                    </Th>
                    <Th>Status cobrança</Th>
                    <Th>Status fiscalização</Th>
                    <Th sortKey="data_abertura" sort={sort} onSort={toggleSort}>
                      Abertura
                    </Th>
                  </tr>
                </thead>
                {lista.isLoading ? (
                  <TableSkeleton cols={8} />
                ) : (
                  <tbody>
                    {rows.map((p) => (
                      <Tr key={p.id} onClick={() => void navigate({ to: "/projetos/$id", params: { id: p.id } })}>
                        <Td className="font-medium whitespace-nowrap">{p.numero_projeto}</Td>
                        <Td className="max-w-[220px] truncate">{p.empresas?.nome_comercial ?? "—"}</Td>
                        <Td className="whitespace-nowrap">
                          {p.localidades ? localidadeLabel(p.localidades) : "—"}
                        </Td>
                        <Td className="max-w-[140px] truncate">{p.usuarios?.nome ?? "—"}</Td>
                        <Td align="right" className="tabular">
                          {formatNumber(p.quantidade_postes)}
                        </Td>
                        <Td>
                          <StatusBadge label={p.status_cobranca?.nome} />
                        </Td>
                        <Td>
                          <StatusBadge label={p.status_fiscalizacao?.nome} />
                        </Td>
                        <Td className="tabular whitespace-nowrap">{formatDate(p.data_abertura)}</Td>
                      </Tr>
                    ))}
                  </tbody>
                )}
              </table>
            </div>

            {!lista.isLoading && rows.length === 0 ? (
              <EmptyState
                title="Nenhum projeto encontrado."
                description={
                  canClear
                    ? "Ajuste a busca ou limpe os filtros para ver mais resultados."
                    : "Cadastre o primeiro projeto para começar o acompanhamento."
                }
                action={
                  can("projetos.criar") && !canClear ? (
                    <Button asChild size="sm">
                      <Link to="/projetos/novo">
                        <Plus className="size-4" />
                        Novo Projeto
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
                itemLabel="projetos"
              />
            ) : null}
          </>
        )}
      </div>
    </>
  );
}
