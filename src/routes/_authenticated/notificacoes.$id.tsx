import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Pencil } from "lucide-react";
import { useState } from "react";

import { ErrorState, InlineLoader } from "@/components/common/DataStates";
import { DetailGrid, DetailItem } from "@/components/common/FormKit";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { NotificacaoForm, notificacaoToForm } from "@/components/notificacoes/NotificacaoForm";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { formatCurrency, formatDate, formatDateTime, formatNumber } from "@/lib/format";
import { situacaoNotificacao, situacaoTone } from "@/lib/situacao";

export const Route = createFileRoute("/_authenticated/notificacoes/$id")({
  head: () => ({
    meta: [
      { title: "Detalhe da notificação — Gestão de Projetos" },
      { name: "description", content: "Informações completas da notificação e seu processo." },
      { property: "og:title", content: "Detalhe da notificação — Gestão de Projetos" },
      { property: "og:description", content: "Informações completas da notificação." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NotificacaoDetalhe,
});

function NotificacaoDetalhe() {
  const { id } = Route.useParams();
  const { can } = useAuth();
  const [editing, setEditing] = useState(false);

  const query = useQuery({
    queryKey: ["notificacao", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notificacoes")
        .select("*, projetos(id, numero_projeto), empresas(id, nome_comercial, cnpj)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data as Record<string, any> | null;
    },
  });

  if (query.isLoading) return <InlineLoader label="Carregando notificação..." />;
  if (query.error)
    return <ErrorState message={(query.error as Error).message} onRetry={() => void query.refetch()} />;
  if (!query.data)
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-sm shadow-card">
        Notificação não encontrada.
      </div>
    );

  const n = query.data;
  const situacao = situacaoNotificacao(n);

  return (
    <>
      <PageHeader
        title={`Notificação ${n.numero_notificacao}`}
        description={`Registrada em ${formatDateTime(n.created_at)} · numeração gerada pelo banco de dados`}
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link to="/notificacoes">
                <ArrowLeft className="size-4" />
                Voltar
              </Link>
            </Button>
            {can("notificacoes.editar") && !editing ? (
              <Button size="sm" onClick={() => setEditing(true)}>
                <Pencil className="size-4" />
                Editar
              </Button>
            ) : null}
          </>
        }
      />

      {editing ? (
        <NotificacaoForm initial={notificacaoToForm(n)} notificacaoId={id} onCancel={() => setEditing(false)} />
      ) : (
        <section className="rounded-lg border border-border bg-card shadow-card">
          <header className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold">Dados da notificação</h2>
            <StatusBadge label={situacao} tone={situacaoTone(situacao)} />
          </header>
          <DetailGrid>
            <DetailItem label="Número">{n.numero_notificacao}</DetailItem>
            <DetailItem label="Ano">{n.ano}</DetailItem>
            <DetailItem label="Sequencial">{n.numero_sequencial}</DetailItem>
            <DetailItem label="Projeto">
              {n.projetos ? (
                <Link
                  to="/projetos/$id"
                  params={{ id: n.projetos.id }}
                  className="text-primary hover:underline"
                >
                  {n.projetos.numero_projeto}
                </Link>
              ) : (
                "Sem projeto vinculado"
              )}
            </DetailItem>
            <DetailItem label="Empresa notificada">{n.empresas?.nome_comercial ?? "—"}</DetailItem>
            <DetailItem label="Protocolo de faturamento">{n.protocolo_faturamento ?? "—"}</DetailItem>
            <DetailItem label="Abertura do protocolo">
              {formatDate(n.data_abertura_protocolo_faturamento)}
            </DetailItem>
            <DetailItem label="Verificação de revelia">{formatDate(n.data_verificacao_revelia)}</DetailItem>
            <DetailItem label="Retirada / adequação PE">
              {formatDate(n.data_retirada_adequacao_pe)}
            </DetailItem>
            <DetailItem label="Dias de ocupação">
              {n.qtde_dias_ocupacao == null ? "—" : formatNumber(n.qtde_dias_ocupacao)}
            </DetailItem>
            <DetailItem label="Quantidade de pontos">{formatNumber(n.quantidade_pontos)}</DetailItem>
            <DetailItem label="Valor arrecadado">{formatCurrency(n.valor_arrecadado)}</DetailItem>
            <DetailItem label="Observação">
              <span className="whitespace-pre-wrap">{n.observacao ?? "—"}</span>
            </DetailItem>
          </DetailGrid>
        </section>
      )}
    </>
  );
}
