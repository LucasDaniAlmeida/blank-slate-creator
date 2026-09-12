import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { emptyEmpresa, EmpresaForm } from "@/components/empresas/EmpresaForm";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/empresas/novo")({
  head: () => ({
    meta: [
      { title: "Nova empresa — Gestão de Projetos" },
      { name: "description", content: "Cadastro de nova empresa com contatos e contratos." },
      { property: "og:title", content: "Nova empresa — Gestão de Projetos" },
      { property: "og:description", content: "Cadastro de nova empresa." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NovaEmpresa,
});

function NovaEmpresa() {
  const { can } = useAuth();

  if (!can("empresas.criar")) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-sm shadow-card">
        Seu perfil não possui permissão para cadastrar empresas.
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Nova Empresa"
        description="Informe os dados cadastrais, contatos e canais de correspondência."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link to="/empresas">
              <ArrowLeft className="size-4" />
              Voltar
            </Link>
          </Button>
        }
      />
      <EmpresaForm initial={emptyEmpresa} />
    </>
  );
}
