import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, CalendarClock, FileText, Plus, Timer, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { EmptyState, ErrorState, TableSkeleton } from "@/components/common/DataStates";
import { ALL, FilterBar, FilterSelect, SearchField } from "@/components/common/Filters";
import { PageHeader } from "@/components/common/PageHeader";
import { Pagination, Td, Th, Tr } from "@/components/common/DataTable";

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
} from "@/hooks/useLookups";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, formatNumber } from "@/lib/format";
import { prazoInfo } from "@/lib/prazo";

const PAGE_SIZE = 15;

export const Route = createFileRoute("/_authenticated/projetos/")({
  validateSearch: (search: Record<string, unknown>) => ({
    busca: typeof search.busca === "string" ? search.busca : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Projetos — Acompanhamento de atualização no SIGUM" },
      {
        name: "description",
        content:
          "Listagem de projetos com acompanhamento do prazo de atualização no SIGUM e status de cobrança.",
      },
      { property: "og:title", content: "Projetos — Acompanhamento SIGUM" },
      {
        property: "og:description",
        content: "Prazos de atualização no SIGUM e status de cobrança dos projetos.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProjetosPage,
});

type Row = {
  id: string;
  numero_projeto: string;
  numero_contrato_sigum: string | null;
  data_abertura: string | null;
  data_resposta: string | null;
  data_inicio_cobranca: string | null;
  data_atualizacao_sigum: string | null;
  quantidade_postes: number;
  created_at: string;
  dias_para_vencimento?: number | null;
  empresas: { nome_comercial: string } | null;
  localidades: { cidade: string; estado: string } | null;
  usuarios: { nome: string | null } | null;
  status_cobranca: { nome: string } | null;
};

/** Mantém a string de select fora da checagem de tipos (performance do tsc). */
const sel = (s: string): string => s;

const BASE_COLS =
  "id, numero_projeto, numero_contrato_sigum, data_abertura, data_resposta, data_inicio_cobranca, data_atualizacao_sigum, quantidade_postes, created_at, empresas(nome_comercial), localidades(cidade, estado), usuarios(nome), status_cobranca(nome)";

/** A coluna de prazo é calculada no banco; se ainda não existir, degradamos sem quebrar a tela. */
const PRAZO_COL = "dias_para_vencimento";

function isPrazoMissing(message: string): boolean {
  return /dias_para_vencimento/i.test(message);
}

function ProjetosPage() {
  const { busca: buscaInicial } = Route.useSearch();
  const navigate = useNavigate();
  const { can } = useAuth();

  const [busca, setBusca] = useState(buscaInicial ?? "");
  const [termo, setTermo] = useState(buscaInicial ?? "");
  const [empresa, setEmpresa] = useState(ALL);
  const [localidade, setLocalidade] = useState(ALL);
  const [cobranca, setCobranca] = useState(ALL);
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

  const filtros = { termo, empresa, localidade, cobranca };

  const lista = useQuery({
    queryKey: ["projetos", filtros, page, sort],
    queryFn: async () => {
      const run = async (comPrazo: boolean) => {
        let query = supabase
          .from("projetos")
          .select(sel(comPrazo ? `${BASE_COLS}, ${PRAZO_COL}` : BASE_COLS), { count: "exact" });
        if (termo) {
          query = query.or(
            `numero_projeto.ilike.%${termo}%,numero_contrato_sigum.ilike.%${termo}%,numero_chamado.ilike.%${termo}%`,
          );
        }
        if (empresa !== ALL) query = query.eq("empresa_id", empresa);
        if (localidade !== ALL) query = query.eq("localidade_id", localidade);
        if (cobranca !== ALL) query = query.eq("status_cobranca_id", cobranca);
        return query
          .order(sort.key, { ascending: sort.asc })
          .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
      };

      let res = await run(true);
      let prazoDisponivel = true;
      if (res.error && isPrazoMissing(res.error.message)) {
        prazoDisponivel = false;
        res = await run(false);
      }
      if (res.error) throw new Error(res.error.message);
      return {
        rows: (res.data ?? []) as unknown as Row[],
        total: res.count ?? 0,
        prazoDisponivel,
      };
    },
  });

  const kpis = useQuery({
    queryKey: ["projetos", "kpis"],
    staleTime: 60_000,
    queryFn: async () => {
      const total = await supabase.from("projetos").select("id", { count: "exact", head: true });
      if (total.error) throw new Error(total.error.message);

      const prazos = await supabase.from("projetos").select(sel(PRAZO_COL)).limit(5000);
      if (prazos.error) {
        if (isPrazoMissing(prazos.error.message)) {
          return { total: total.count ?? 0, prazoDisponivel: false, amanha: 0, dois5: 0, vencidos: 0, mais5: 0 };
        }
        throw new Error(prazos.error.message);
      }

      const dias = ((prazos.data ?? []) as unknown as { dias_para_vencimento: number | null }[])
        .map((r) => r.dias_para_vencimento)
        .filter((d): d is number => d != null);

      return {
        total: total.count ?? 0,
        prazoDisponivel: true,
        amanha: dias.filter((d) => d === 1).length,
        dois5: dias.filter((d) => d >= 2 && d <= 5).length,
        vencidos: dias.filter((d) => d < 0).length,
        mais5: dias.filter((d) => d > 5).length,
      };
    },
  });

  const canClear = Boolean(busca) || [empresa, localidade, cobranca].some((v) => v !== ALL);

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
  const prazoIndisponivel = lista.data?.prazoDisponivel === false || kpis.data?.prazoDisponivel === false;

  return (
    <>
      <PageHeader
        title="Projetos"
        description="Acompanhe o prazo de atualização no SIGUM e a cobrança de cada projeto."
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
          value={formatNumber(kpis.data?.total ?? 0)}
          icon={FileText}
          tone="primary"
          loading={kpis.isLoading}
        />
        <StatCard
          compact
          label="Vence amanhã"
          value={formatNumber(kpis.data?.amanha ?? 0)}
          icon={CalendarClock}
          tone="warning"
          loading={kpis.isLoading}
        />
        <StatCard
          compact
          label="2 a 5 dias"
          value={formatNumber(kpis.data?.dois5 ?? 0)}
          icon={Timer}
          tone="primary"
          loading={kpis.isLoading}
        />
        <StatCard
          compact
          label="Vencidos"
          value={formatNumber(kpis.data?.vencidos ?? 0)}
          icon={AlertTriangle}
          tone="danger"
          loading={kpis.isLoading}
        />
        <StatCard
          compact
          label="+5 dias"
          value={formatNumber(kpis.data?.mais5 ?? 0)}
          icon={TrendingUp}
          tone="neutral"
          loading={kpis.isLoading}
        />
      </div>

      {prazoIndisponivel ? (
        <p className="rounded-lg border border-border bg-card px-3.5 py-2.5 text-xs text-muted-foreground shadow-card">
          O prazo de atualização no SIGUM ainda não é retornado pelo banco de dados, por isso os
          indicadores de prazo aparecem zerados.
        </p>
      ) : null}

      <FilterBar
        canClear={canClear}
        onClear={() => {
          setBusca("");
          setEmpresa(ALL);
          setLocalidade(ALL);
          setCobranca(ALL);
          setPage(0);
          void navigate({ to: "/projetos", search: {} });
        }}
      >
        <SearchField
          value={busca}
          onChange={setBusca}
          placeholder="Buscar por projeto, contrato SIGUM, chamado..."
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
                    <Th>Prazo SIGUM</Th>
                    <Th>Status cobrança</Th>
                    <Th sortKey="data_inicio_cobranca" sort={sort} onSort={toggleSort}>
                      Início cobrança
                    </Th>
                  </tr>
                </thead>
                {lista.isLoading ? (
                  <TableSkeleton cols={8} />
                ) : (
                  <tbody>
                    {rows.map((p) => {
                      const prazo = prazoInfo(p.dias_para_vencimento, p.status_cobranca?.nome);
                      return (
                        <Tr
                          key={p.id}
                          onClick={() => void navigate({ to: "/projetos/$id", params: { id: p.id } })}
                        >
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
                            {prazo ? (
                              <StatusBadge
                                label={prazo.label}
                                tone={prazo.tone}
                                className={prazo.strong ? "font-semibold" : undefined}
                              />
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </Td>
                          <Td>
                            <StatusBadge label={p.status_cobranca?.nome ?? null} />
                          </Td>
                          <Td className="tabular whitespace-nowrap">
                            {formatDate(p.data_inicio_cobranca)}
                          </Td>
                        </Tr>
                      );
                    })}
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
