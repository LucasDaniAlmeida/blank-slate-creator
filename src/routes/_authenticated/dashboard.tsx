import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock,
  FileText,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { EmptyState, ErrorState, InlineLoader } from "@/components/common/DataStates";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { TableShell, Td, Th, Tr } from "@/components/common/DataTable";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, formatNumber, percent } from "@/lib/format";
import {
  projetoComPendencia,
  projetoEmAtraso,
  projetoEmDia,
  situacaoNotificacao,
  situacaoTone,
} from "@/lib/situacao";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Gestão de Projetos, Cobrança e Fiscalização" },
      {
        name: "description",
        content:
          "Visão geral da operação: projetos, notificações, status de cobrança e fiscalização.",
      },
      { property: "og:title", content: "Dashboard — Gestão de Projetos" },
      { property: "og:description", content: "Visão geral da operação de cobrança e fiscalização." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Dashboard,
});

const CHART_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "var(--color-muted-foreground)",
];

type ProjetoRow = {
  id: string;
  numero_projeto: string;
  data_abertura: string | null;
  data_inicio_cobranca: string | null;
  data_fiscalizacao: string | null;
  created_at: string;
  empresas: { nome_comercial: string } | null;
  localidades: { cidade: string; estado: string } | null;
  usuarios: { nome: string | null } | null;
  status_cobranca: { nome: string } | null;
  status_fiscalizacao: { nome: string } | null;
};

type NotificacaoRow = {
  id: string;
  numero_notificacao: string;
  ano: number;
  created_at: string;
  protocolo_faturamento: string | null;
  data_verificacao_revelia: string | null;
  data_retirada_adequacao_pe: string | null;
  data_abertura_protocolo_faturamento: string | null;
  projetos: { numero_projeto: string } | null;
  empresas: { nome_comercial: string } | null;
};

function useDashboardData() {
  return useQuery({
    queryKey: ["dashboard"],
    staleTime: 60_000,
    queryFn: async () => {
      const [projetos, notificacoes] = await Promise.all([
        supabase
          .from("projetos")
          .select(
            "id, numero_projeto, data_abertura, data_inicio_cobranca, data_fiscalizacao, created_at, empresas(nome_comercial), localidades(cidade, estado), usuarios(nome), status_cobranca(nome), status_fiscalizacao(nome)",
          )
          .order("created_at", { ascending: false })
          .limit(1000),
        supabase
          .from("notificacoes")
          .select(
            "id, numero_notificacao, ano, created_at, protocolo_faturamento, data_verificacao_revelia, data_retirada_adequacao_pe, data_abertura_protocolo_faturamento, projetos(numero_projeto), empresas(nome_comercial)",
          )
          .order("created_at", { ascending: false })
          .limit(1000),
      ]);
      if (projetos.error) throw new Error(projetos.error.message);
      if (notificacoes.error) throw new Error(notificacoes.error.message);
      return {
        projetos: (projetos.data ?? []) as unknown as ProjetoRow[],
        notificacoes: (notificacoes.data ?? []) as unknown as NotificacaoRow[],
      };
    },
  });
}

function groupCount<T>(rows: T[], key: (row: T) => string) {
  const map = new Map<string, number>();
  rows.forEach((r) => {
    const k = key(r);
    map.set(k, (map.get(k) ?? 0) + 1);
  });
  return [...map.entries()].map(([name, value]) => ({ name, value }));
}

function Panel({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-card shadow-card">
      <header className="flex items-center justify-between border-b border-border px-3.5 py-2.5">
        <h2 className="text-sm font-semibold">{title}</h2>
        {action}
      </header>
      <div className="p-3.5">{children}</div>
    </section>
  );
}

function DonutPanel({
  title,
  total,
  totalLabel,
  data,
}: {
  title: string;
  total: number;
  totalLabel: string;
  data: { name: string; value: number }[];
}) {
  return (
    <Panel title={title}>
      {data.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Sem dados no período.</p>
      ) : (
        <div className="flex items-center gap-4">
          <div className="relative size-[150px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={48}
                  outerRadius={70}
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {data.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid var(--color-border)",
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <div className="text-center">
                <p className="tabular text-xl font-semibold">{formatNumber(total)}</p>
                <p className="text-[10px] text-muted-foreground">{totalLabel}</p>
              </div>
            </div>
          </div>
          <ul className="min-w-0 flex-1 space-y-1.5">
            {data.map((d, i) => (
              <li key={d.name} className="flex items-center gap-2 text-xs">
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                />
                <span className="min-w-0 flex-1 truncate text-muted-foreground">{d.name}</span>
                <span className="tabular font-medium">{d.value}</span>
                <span className="tabular w-10 text-right text-muted-foreground">
                  {percent(d.value, total)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  );
}

function Dashboard() {
  const { data, isLoading, error, refetch } = useDashboardData();

  if (isLoading) return <InlineLoader label="Carregando indicadores..." />;
  if (error)
    return <ErrorState message={(error as Error).message} onRetry={() => void refetch()} />;

  const projetos = data?.projetos ?? [];
  const notificacoes = data?.notificacoes ?? [];

  const emDia = projetos.filter(projetoEmDia).length;
  const emAtraso = projetos.filter(projetoEmAtraso).length;
  const comPendencia = projetos.filter(projetoComPendencia).length;

  const situacoes = notificacoes.map(situacaoNotificacao);
  const notifEmDia = situacoes.filter((s) => s === "Em dia").length;
  const notifAndamento = situacoes.filter((s) => s === "Em andamento").length;
  const notifAtrasadas = situacoes.filter((s) => s === "Atrasada").length;

  const porCobranca = groupCount(projetos, (p) => p.status_cobranca?.nome ?? "Sem informação");
  const porFiscalizacao = groupCount(
    projetos,
    (p) => p.status_fiscalizacao?.nome ?? "Não iniciada",
  );
  const porLocalidade = groupCount(projetos, (p) =>
    p.localidades ? `${p.localidades.cidade}/${p.localidades.estado}` : "Sem localidade",
  )
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const porMes = (() => {
    const map = new Map<string, number>();
    notificacoes.forEach((n) => {
      const d = new Date(n.created_at);
      const k = `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getFullYear()).slice(2)}`;
      map.set(k, (map.get(k) ?? 0) + 1);
    });
    return [...map.entries()].map(([name, value]) => ({ name, value })).reverse();
  })();

  const vazio = projetos.length === 0 && notificacoes.length === 0;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Visão geral da operação de projetos, cobrança e fiscalização."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total de projetos"
          value={formatNumber(projetos.length)}
          hint="Registros cadastrados"
          icon={FileText}
          tone="primary"
        />
        <StatCard
          label="Em dia"
          value={formatNumber(emDia)}
          hint={`${percent(emDia, projetos.length)} do total`}
          icon={CheckCircle2}
          tone="success"
        />
        <StatCard
          label="Em atraso (cobrança)"
          value={formatNumber(emAtraso)}
          hint={`${percent(emAtraso, projetos.length)} do total`}
          icon={Clock}
          tone="warning"
        />
        <StatCard
          label="Com pendências (fiscalização)"
          value={formatNumber(comPendencia)}
          hint={`${percent(comPendencia, projetos.length)} do total`}
          icon={AlertTriangle}
          tone="danger"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total de notificações"
          value={formatNumber(notificacoes.length)}
          icon={Bell}
          tone="primary"
          compact
        />
        <StatCard label="Em dia" value={formatNumber(notifEmDia)} tone="success" compact icon={CheckCircle2} />
        <StatCard
          label="Em andamento"
          value={formatNumber(notifAndamento)}
          tone="warning"
          compact
          icon={TrendingUp}
        />
        <StatCard
          label="Atrasadas"
          value={formatNumber(notifAtrasadas)}
          tone="danger"
          compact
          icon={AlertTriangle}
        />
      </div>

      {vazio ? (
        <div className="rounded-lg border border-border bg-card shadow-card">
          <EmptyState
            title="Nenhum dado operacional ainda"
            description="Cadastre empresas, localidades e projetos para que os indicadores sejam calculados."
          />
        </div>
      ) : (
        <>
          <div className="grid gap-3 lg:grid-cols-3">
            <DonutPanel
              title="Status da cobrança"
              total={projetos.length}
              totalLabel="projetos"
              data={porCobranca}
            />
            <DonutPanel
              title="Status da fiscalização"
              total={projetos.length}
              totalLabel="projetos"
              data={porFiscalizacao}
            />
            <Panel title="Projetos por localidade">
              {porLocalidade.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">Sem dados.</p>
              ) : (
                <div className="h-[150px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={porLocalidade} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 10 }}
                        stroke="var(--color-muted-foreground)"
                        interval={0}
                      />
                      <YAxis tick={{ fontSize: 10 }} stroke="var(--color-muted-foreground)" allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 8,
                          border: "1px solid var(--color-border)",
                          fontSize: 12,
                        }}
                      />
                      <Bar dataKey="value" fill="var(--color-chart-1)" radius={[3, 3, 0, 0]} maxBarSize={34} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Panel>
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Panel
                title="Últimos projetos"
                action={
                  <Link to="/projetos" className="text-xs font-medium text-primary hover:underline">
                    Ver todos
                  </Link>
                }
              >
                <TableShell>
                  <thead>
                    <tr>
                      <Th>Projeto</Th>
                      <Th>Empresa</Th>
                      <Th>Localidade</Th>
                      <Th>Cobrança</Th>
                      <Th>Fiscalização</Th>
                      <Th>Abertura</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {projetos.slice(0, 5).map((p) => (
                      <Tr key={p.id}>
                        <Td className="font-medium">{p.numero_projeto}</Td>
                        <Td className="max-w-[200px] truncate">{p.empresas?.nome_comercial ?? "—"}</Td>
                        <Td>{p.localidades ? `${p.localidades.cidade}/${p.localidades.estado}` : "—"}</Td>
                        <Td>
                          <StatusBadge label={p.status_cobranca?.nome} />
                        </Td>
                        <Td>
                          <StatusBadge label={p.status_fiscalizacao?.nome} />
                        </Td>
                        <Td className="tabular">{formatDate(p.data_abertura)}</Td>
                      </Tr>
                    ))}
                  </tbody>
                </TableShell>
              </Panel>
            </div>

            <Panel title="Notificações por mês">
              {porMes.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">Sem dados.</p>
              ) : (
                <div className="h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={porMes} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="var(--color-muted-foreground)" />
                      <YAxis tick={{ fontSize: 10 }} stroke="var(--color-muted-foreground)" allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 8,
                          border: "1px solid var(--color-border)",
                          fontSize: 12,
                        }}
                      />
                      <Bar dataKey="value" fill="var(--color-chart-1)" radius={[3, 3, 0, 0]} maxBarSize={26} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Panel>
          </div>

          <Panel
            title="Últimas notificações"
            action={
              <Link to="/notificacoes" className="text-xs font-medium text-primary hover:underline">
                Ver todas
              </Link>
            }
          >
            <TableShell>
              <thead>
                <tr>
                  <Th>Número</Th>
                  <Th>Ano</Th>
                  <Th>Projeto</Th>
                  <Th>Empresa notificada</Th>
                  <Th>Situação</Th>
                  <Th>Emissão</Th>
                </tr>
              </thead>
              <tbody>
                {notificacoes.slice(0, 5).map((n) => {
                  const s = situacaoNotificacao(n);
                  return (
                    <Tr key={n.id}>
                      <Td className="font-medium">{n.numero_notificacao}</Td>
                      <Td className="tabular">{n.ano}</Td>
                      <Td>{n.projetos?.numero_projeto ?? "—"}</Td>
                      <Td className="max-w-[220px] truncate">{n.empresas?.nome_comercial ?? "—"}</Td>
                      <Td>
                        <StatusBadge label={s} tone={situacaoTone(s)} />
                      </Td>
                      <Td className="tabular">{formatDate(n.created_at)}</Td>
                    </Tr>
                  );
                })}
              </tbody>
            </TableShell>
          </Panel>
        </>
      )}
    </>
  );
}
