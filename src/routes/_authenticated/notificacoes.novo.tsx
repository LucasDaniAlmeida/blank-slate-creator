import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { emptyNotificacao, NotificacaoForm } from "@/components/notificacoes/NotificacaoForm";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/notificacoes/novo")({
  head: () => ({
    meta: [
      { title: "Nova notificação — Gestão de Projetos" },
      { name: "description", content: "Registro de nova notificação com numeração automática." },
      { property: "og:title", content: "Nova notificação — Gestão de Projetos" },
      { property: "og:description", content: "Registro de nova notificação." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NovaNotificacao,
});

function NovaNotificacao() {
  const { can } = useAuth();

  if (!can("notificacoes.criar")) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-sm shadow-card">
        Seu perfil não possui permissão para criar notificações.
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Nova Notificação"
        description="O número da notificação é gerado pelo banco de dados no momento do registro."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link to="/notificacoes">
              <ArrowLeft className="size-4" />
              Voltar
            </Link>
          </Button>
        }
      />
      <NotificacaoForm initial={emptyNotificacao} />
    </>
  );
}
