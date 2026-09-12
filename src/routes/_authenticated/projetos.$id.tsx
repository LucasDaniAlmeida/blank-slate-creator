import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ErrorState, InlineLoader } from "@/components/common/DataStates";
import { DetailGrid, DetailItem } from "@/components/common/FormKit";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ProjetoForm, projetoToForm } from "@/components/projetos/ProjetoForm";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, formatDateTime, formatNumber } from "@/lib/format";
import { prazoInfo } from "@/lib/prazo";

export const Route = createFileRoute("/_authenticated/projetos/$id")({
  head: () => ({
    meta: [
      { title: "Detalhe do projeto — Gestão de Projetos" },
      { name: "description", content: "Informações completas do projeto, cobrança e fiscalização." },
      { property: "og:title", content: "Detalhe do projeto — Gestão de Projetos" },
      { property: "og:description", content: "Informações completas do projeto." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProjetoDetalhe,
});

const SELECT =
  "*, empresas(id, nome_comercial, cnpj), localidades(id, cidade, estado, polo, regional), usuarios(id, nome), status_cobranca(nome), status_fiscalizacao(nome)";

function ProjetoDetalhe() {
  const { id } = Route.useParams();
  const { can } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const projeto = useQuery({
    queryKey: ["projeto", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("projetos").select(SELECT).eq("id", id).maybeSingle();
      if (error) throw new Error(error.message);
      return data as Record<string, unknown> | null;
    },
  });

  const remover = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("projetos").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["projetos"] });
      toast.success("Projeto excluído.");
      await navigate({ to: "/projetos", search: { busca: undefined } });
    },
    onError: (e) => toast.error(e.message),
  });

  if (projeto.isLoading) return <InlineLoader label="Carregando projeto..." />;
  if (projeto.error)
    return <ErrorState message={(projeto.error as Error).message} onRetry={() => void projeto.refetch()} />;
  if (!projeto.data)
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-sm shadow-card">
        Projeto não encontrado.
      </div>
    );

  const p = projeto.data;

  return (
    <>
      <PageHeader
        title={`Projeto ${String(p["numero_projeto"] ?? "")}`}
        description={`Cadastrado em ${formatDateTime(p["created_at"] as string | null)} · última atualização ${formatDateTime(p["updated_at"] as string | null)}`}
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link to="/projetos" search={{ busca: undefined }}>
                <ArrowLeft className="size-4" />
                Voltar
              </Link>
            </Button>
            {can("projetos.editar") && !editing ? (
              <Button size="sm" onClick={() => setEditing(true)}>
                <Pencil className="size-4" />
                Editar
              </Button>
            ) : null}
            {can("projetos.excluir") && !editing ? (
              <Button variant="outline" size="sm" onClick={() => setConfirming(true)}>
                <Trash2 className="size-4 text-danger" />
                Excluir
              </Button>
            ) : null}
          </>
        }
      />

      {editing ? (
        <ProjetoForm initial={projetoToForm(p)} projetoId={id} onCancel={() => setEditing(false)} />
      ) : (
        <>
          <section className="rounded-lg border border-border bg-card shadow-card">
            <header className="border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold">Informações do projeto</h2>
            </header>
            <DetailGrid>
              <DetailItem label="Empresa">
                {(p["empresas"] as { nome_comercial?: string } | null)?.nome_comercial ?? "—"}
              </DetailItem>
              <DetailItem label="Localidade">
                {p["localidades"]
                  ? `${(p["localidades"] as { cidade?: string }).cidade}/${(p["localidades"] as { estado?: string }).estado}`
                  : "—"}
              </DetailItem>
              <DetailItem label="Polo / Regional">
                {[
                  (p["localidades"] as { polo?: string } | null)?.polo,
                  (p["localidades"] as { regional?: string } | null)?.regional,
                ].filter(Boolean).join(" · ") || "—"}
              </DetailItem>
              <DetailItem label="Contrato SIGUM">{String(p["numero_contrato_sigum"] ?? "—")}</DetailItem>
              <DetailItem label="Analista">
                {(p["usuarios"] as { nome?: string } | null)?.nome ?? "—"}
              </DetailItem>
              <DetailItem label="Data de abertura">{formatDate(p["data_abertura"] as string | null)}</DetailItem>
              <DetailItem label="Data de resposta">{formatDate(p["data_resposta"] as string | null)}</DetailItem>
              <DetailItem label="Quantidade de postes">{formatNumber(Number(p["quantidade_postes"] ?? 0))}</DetailItem>
            </DetailGrid>
          </section>

          <section className="rounded-lg border border-border bg-card shadow-card">
            <header className="border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold">Cobrança e atualização no SIGUM</h2>
            </header>
            <DetailGrid>
              <DetailItem label="Status da cobrança">
                <StatusBadge label={(p["status_cobranca"] as { nome?: string } | null)?.nome ?? null} />
              </DetailItem>
              <DetailItem label="Início da cobrança">{formatDate(p["data_inicio_cobranca"] as string | null)}</DetailItem>
              <DetailItem label="Prazo SIGUM">
                {(() => {
                  const prazo = prazoInfo(
                    p["dias_para_vencimento"] as number | null,
                    (p["status_cobranca"] as { nome?: string } | null)?.nome,
                  );
                  return prazo ? (
                    <StatusBadge
                      label={prazo.label}
                      tone={prazo.tone}
                      {...(prazo.strong ? { className: "font-semibold" } : {})}
                    />
                  ) : (
                    "—"
                  );
                })()}
              </DetailItem>
              <DetailItem label="Número do chamado">{String(p["numero_chamado"] ?? "—")}</DetailItem>
              <DetailItem label="Atualização SIGUM">{formatDate(p["data_atualizacao_sigum"] as string | null)}</DetailItem>
              <DetailItem label="Projeto cadastrado no sistema de origem">
                {typeof p["projeto_cadastrado"] === "string"
                  ? p["projeto_cadastrado"] || "—"
                  : p["projeto_cadastrado"]
                    ? "Sim"
                    : "—"}
              </DetailItem>
              <DetailItem label="Observações">
                <span className="whitespace-pre-wrap">{String(p["observacoes"] ?? "—")}</span>
              </DetailItem>
            </DetailGrid>
          </section>

        </>
      )}

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir este projeto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. As notificações vinculadas permanecerão no sistema sem
              o vínculo com este projeto.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => remover.mutate()}>Excluir projeto</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
