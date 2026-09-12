import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { emptyProjeto, ProjetoForm } from "@/components/projetos/ProjetoForm";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/projetos/novo")({
  head: () => ({
    meta: [
      { title: "Novo projeto — Gestão de Projetos" },
      { name: "description", content: "Cadastro de novo projeto de cobrança e fiscalização." },
      { property: "og:title", content: "Novo projeto — Gestão de Projetos" },
      { property: "og:description", content: "Cadastro de novo projeto." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NovoProjeto,
});

function NovoProjeto() {
  const { can } = useAuth();

  if (!can("projetos.criar")) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-sm shadow-card">
        Seu perfil não possui permissão para criar projetos.
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Novo Projeto"
        description="Preencha as informações do projeto. Campos marcados são obrigatórios."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link to="/projetos" search={{}}>
              <ArrowLeft className="size-4" />
              Voltar
            </Link>
          </Button>
        }
      />
      <ProjetoForm initial={emptyProjeto} />
    </>
  );
}
