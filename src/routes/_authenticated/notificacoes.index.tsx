import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, Bell, CheckCircle2, Plus, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

import { EmptyState, ErrorState, TableSkeleton } from "@/components/common/DataStates";
import { Pagination, Td, Th, Tr } from "@/components/common/DataTable";
import { ALL, DateRangeField, FilterBar, FilterSelect, SearchField } from "@/components/common/Filters";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { empresaLabel, useEmpresasOptions } from "@/hooks/useLookups";
import { supabase } from "@/lib/supabase";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { situacaoNotificacao, situacaoTone } from "@/lib/situacao";

const PAGE_SIZE = 15;

export const Route = createFileRoute("/_authenticated/notificacoes/")({
  head: () => ({
    meta: [
      { title: "Notificações — Gestão de Projetos, Cobrança e Fiscalização" },
      {
        name: "description",
        content: "Acompanhe as notificações emitidas, protocolos e valores arrecadados.",
      },
      { property: "og:title", content: "Notificações — Gestão de Projetos" },
      { property: "og:description", content: "Acompanhamento das notificações emitidas." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NotificacoesPage,
});

type Row = {
  id: string;
  numero_notificacao: string;
  ano: number;
  quantidade_pontos: number;
  valor_arrecadado: number;
  protocolo_faturamento: string | null;
  data_verificacao_revelia: string | null;
  data_retirada_adequacao_pe: string | null;
  data_abertura_protocolo_faturamento: string | null;
  created_at: string;
  projetos: { numero_projeto: string } | null;
  empresas: { nome_comercial: string } | null;
};

const SELECT =
  "id, numero_notificacao, ano, quantidade_pontos, valor_arrecadado, protocolo_faturamento, data_verificacao_revelia, data_retirada_adequacao_pe, data_abertura_protocolo_faturamento, created_at, projetos(numero_projeto), empresas(nome_comercial)";

function NotificacoesPage() {
  const navigate = useNavigate();
  const { can } = useAuth();
  const [busca, setBusca] = useState("");
  const [termo, setTermo] = useState("");
  const [empresa, setEmpresa] = useState(ALL);
  const [ano, setAno] = useState(ALL);
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
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

  const lista = useQuery({
    queryKey: ["notificacoes", { termo, empresa, ano, de, ate }, page, sort],
    queryFn: async () => {
      let query = supabase.from("notificacoes").select(SELECT, { count: "exact" });
      if (termo)
        query = query.or(
          `numero_notificacao.ilike.%${termo}%,protocolo_faturamento.ilike.%${termo}%`,
        );
      if (empresa !== ALL) query = query.eq("empresa_notificada_id", empresa);
      if (ano !== ALL) query = query.eq("ano", Number(ano));
      if (de) query = query.gte("created_at", `${de}T00:00:00`);
      if (ate) query = query.lte("created_at", `${ate}T23:59:59`);
      const { data, error, count } = await query
        .order(sort.key, { ascending: sort.asc })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
      if (error) throw new Error(error.message);
      return { rows: (data ?? []) as unknown as Row[], total: count ?? 0 };
    },
  });

  const resumo = useQuery({
    queryKey: ["notificacoes", "resumo"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notificacoes")
        .select(
          "protocolo_faturamento, data_verificacao_revelia, data_retirada_adequacao_pe, data_abertura_protocolo_faturamento, created_at, ano",
        )
        .limit(1000);
      if (error) throw new Error(error.message);
      const rows = (data ?? []) as Row[];
      const situacoes = rows.map(situacaoNotificacao);
      return {
        total: rows.length,
        emDia: situacoes.filter((s) => s === "Em dia").length,
        andamento: situacoes.filter((s) => s === "Em andamento" || s === "Pendente").length,
        atrasadas: situacoes.filter((s) => s === "Atrasada").length,
        anos: [...new Set(rows.map((r) => r.ano))].sort((a, b) => b - a),
      };
    },
  });

  const canClear = Boolean(busca || de || ate) || empresa !== ALL || ano !== ALL;
  const rows = lista.data?.rows ?? [];

  function toggleSort(key: string) {
    setSort((s) => (s.key === key ? { key, asc: !s.asc } : { key, asc: true }));
  }

  return (
    <>
      <PageHeader
        title="Notificações"
        description="Acompanhe as notificações emitidas e a evolução de cada protocolo."
        actions={
          can("notificacoes.criar") ? (
            <Button asChild size="sm">
              <Link to="/notificacoes/novo">
                <Plus className="size-4" />
                Nova Notificação
              </Link>
            </Button>
          ) : null
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard compact label="Total de notificações" value={formatNumber(resumo.data?.total ?? 0)} icon={Bell} tone="primary" loading={resumo.isLoading} />
        <StatCard compact label="Em dia" value={formatNumber(resumo.data?.emDia ?? 0)} icon={CheckCircle2} tone="success" loading={resumo.isLoading} />
        <StatCard compact label="Em andamento" value={formatNumber(resumo.data?.andamento ?? 0)} icon={TrendingUp} tone="warning" loading={resumo.isLoading} />
        <StatCard compact label="Atrasadas" value={formatNumber(resumo.data?.atrasadas ?? 0)} icon={AlertTriangle} tone="danger" loading={resumo.isLoading} />
      </div>

      <FilterBar
        canClear={canClear}
        onClear={() => {
          setBusca("");
          setEmpresa(ALL);
          setAno(ALL);
          setDe("");
          setAte("");
          setPage(0);
        }}
      >
        <SearchField value={busca} onChange={setBusca} placeholder="Buscar por número ou protocolo..." />
        <FilterSelect
          label="Empresa notificada"
          value={empresa}
          onChange={(v) => {
            setEmpresa(v);
            setPage(0);
          }}
          options={(empresas.data ?? []).map((e) => ({ value: e.id, label: empresaLabel(e) }))}
          className="min-w-[200px]"
        />
        <FilterSelect
          label="Ano"
          value={ano}
          onChange={(v) => {
            setAno(v);
            setPage(0);
          }}
          options={(resumo.data?.anos ?? []).map((a) => ({ value: String(a), label: String(a) }))}
          className="min-w-[120px]"
        />
        <DateRangeField
          from={de}
          to={ate}
          onFrom={(v) => {
            setDe(v);
            setPage(0);
          }}
          onTo={(v) => {
            setAte(v);
            setPage(0);
          }}
          label="Emissão"
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
                    <Th sortKey="numero_notificacao" sort={sort} onSort={toggleSort}>
                      Número
                    </Th>
                    <Th sortKey="ano" sort={sort} onSort={toggleSort}>
                      Ano
                    </Th>
                    <Th>Projeto</Th>
                    <Th>Empresa notificada</Th>
                    <Th align="right" sortKey="quantidade_pontos" sort={sort} onSort={toggleSort}>
                      Pontos
                    </Th>
                    <Th align="right" sortKey="valor_arrecadado" sort={sort} onSort={toggleSort}>
                      Valor arrecadado
                    </Th>
                    <Th>Situação</Th>
                    <Th sortKey="created_at" sort={sort} onSort={toggleSort}>
                      Emissão
                    </Th>
                  </tr>
                </thead>
                {lista.isLoading ? (
                  <TableSkeleton cols={8} />
                ) : (
                  <tbody>
                    {rows.map((n) => {
                      const s = situacaoNotificacao(n);
                      return (
                        <Tr
                          key={n.id}
                          onClick={() => void navigate({ to: "/notificacoes/$id", params: { id: n.id } })}
                        >
                          <Td className="font-medium whitespace-nowrap">{n.numero_notificacao}</Td>
                          <Td className="tabular">{n.ano}</Td>
                          <Td className="whitespace-nowrap">{n.projetos?.numero_projeto ?? "—"}</Td>
                          <Td className="max-w-[240px] truncate">{n.empresas?.nome_comercial ?? "—"}</Td>
                          <Td align="right" className="tabular">
                            {formatNumber(n.quantidade_pontos)}
                          </Td>
                          <Td align="right" className="tabular">
                            {formatCurrency(n.valor_arrecadado)}
                          </Td>
                          <Td>
                            <StatusBadge label={s} tone={situacaoTone(s)} />
                          </Td>
                          <Td className="tabular whitespace-nowrap">{formatDate(n.created_at)}</Td>
                        </Tr>
                      );
                    })}
                  </tbody>
                )}
              </table>
            </div>

            {!lista.isLoading && rows.length === 0 ? (
              <EmptyState
                title="Nenhuma notificação encontrada."
                description={
                  canClear
                    ? "Ajuste os filtros para ampliar o resultado."
                    : "Registre a primeira notificação — a numeração é gerada automaticamente."
                }
                action={
                  can("notificacoes.criar") && !canClear ? (
                    <Button asChild size="sm">
                      <Link to="/notificacoes/novo">
                        <Plus className="size-4" />
                        Nova Notificação
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
                itemLabel="notificações"
              />
            ) : null}
          </>
        )}
      </div>
    </>
  );
}
