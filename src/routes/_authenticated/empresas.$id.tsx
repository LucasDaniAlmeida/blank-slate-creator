import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Pencil } from "lucide-react";
import { useState } from "react";

import { ErrorState, InlineLoader } from "@/components/common/DataStates";
import { DetailGrid, DetailItem } from "@/components/common/FormKit";
import { PageHeader } from "@/components/common/PageHeader";
import { TableShell, Td, Th, Tr } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmpresaForm, empresaToForm, type Contato } from "@/components/empresas/EmpresaForm";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { formatCNPJ, formatDate, formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/empresas/$id")({
  head: () => ({
    meta: [
      { title: "Detalhe da empresa — Gestão de Projetos" },
      { name: "description", content: "Dados cadastrais, contatos e projetos vinculados à empresa." },
      { property: "og:title", content: "Detalhe da empresa — Gestão de Projetos" },
      { property: "og:description", content: "Dados cadastrais e projetos da empresa." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: EmpresaDetalhe,
});

function EmpresaDetalhe() {
  const { id } = Route.useParams();
  const { can } = useAuth();
  const [editing, setEditing] = useState(false);

  const empresa = useQuery({
    queryKey: ["empresa", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("empresas").select("*").eq("id", id).maybeSingle();
      if (error) throw new Error(error.message);
      return data as Record<string, any> | null;
    },
  });

  const projetos = useQuery({
    queryKey: ["empresa", id, "projetos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projetos")
        .select("id, numero_projeto, data_abertura, status_cobranca(nome), localidades(cidade, estado)")
        .eq("empresa_id", id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw new Error(error.message);
      return (data ?? []) as unknown as {
        id: string;
        numero_projeto: string;
        data_abertura: string | null;
        status_cobranca: { nome: string } | null;
        localidades: { cidade: string; estado: string } | null;
      }[];
    },
  });

  if (empresa.isLoading) return <InlineLoader label="Carregando empresa..." />;
  if (empresa.error)
    return <ErrorState message={(empresa.error as Error).message} onRetry={() => void empresa.refetch()} />;
  if (!empresa.data)
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-sm shadow-card">
        Empresa não encontrada.
      </div>
    );

  const e = empresa.data;
  const contatos = (Array.isArray(e.contatos) ? e.contatos : []) as Contato[];

  return (
    <>
      <PageHeader
        title={e.nome_comercial}
        description={`${formatCNPJ(e.cnpj)} · cadastrada em ${formatDateTime(e.created_at)}`}
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link to="/empresas">
                <ArrowLeft className="size-4" />
                Voltar
              </Link>
            </Button>
            {can("empresas.editar") && !editing ? (
              <Button size="sm" onClick={() => setEditing(true)}>
                <Pencil className="size-4" />
                Editar
              </Button>
            ) : null}
          </>
        }
      />

      {editing ? (
        <EmpresaForm initial={empresaToForm(e)} empresaId={id} onCancel={() => setEditing(false)} />
      ) : (
        <>
          <section className="rounded-lg border border-border bg-card shadow-card">
            <header className="border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold">Dados cadastrais</h2>
            </header>
            <DetailGrid>
              <DetailItem label="CNPJ">{formatCNPJ(e.cnpj)}</DetailItem>
              <DetailItem label="Nome fantasia">{e.nome_fantasia ?? "—"}</DetailItem>
              <DetailItem label="Número SIGUM">{e.numero_sigum ?? "—"}</DetailItem>
              <DetailItem label="Código do contrato">{e.codigo_contrato ?? "—"}</DetailItem>
              <DetailItem label="UC">{e.uc ?? "—"}</DetailItem>
              <DetailItem label="Responsável">{e.responsavel ?? "—"}</DetailItem>
              <DetailItem label="E-mails">
                {(e.emails ?? []).length > 0 ? (
                  <ul className="space-y-0.5">
                    {(e.emails as string[]).map((mail) => (
                      <li key={mail}>
                        <a href={`mailto:${mail}`} className="text-primary hover:underline">
                          {mail}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  "—"
                )}
              </DetailItem>
              <DetailItem label="Endereço de correspondência">
                <span className="whitespace-pre-wrap">{e.endereco_correspondencia ?? "—"}</span>
              </DetailItem>
            </DetailGrid>
          </section>

          <section className="rounded-lg border border-border bg-card shadow-card">
            <header className="border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold">Contatos</h2>
            </header>
            {contatos.length === 0 ? (
              <p className="px-4 py-6 text-sm text-muted-foreground">Nenhum contato cadastrado.</p>
            ) : (
              <div className="p-4">
                <TableShell>
                  <thead>
                    <tr>
                      <Th>Nome</Th>
                      <Th>Cargo</Th>
                      <Th>Telefone</Th>
                      <Th>E-mail</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {contatos.map((c, i) => (
                      <Tr key={i}>
                        <Td className="font-medium">{c.nome || "—"}</Td>
                        <Td>{c.cargo || "—"}</Td>
                        <Td className="tabular">{c.telefone || "—"}</Td>
                        <Td>{c.email || "—"}</Td>
                      </Tr>
                    ))}
                  </tbody>
                </TableShell>
              </div>
            )}
          </section>

          <section className="rounded-lg border border-border bg-card shadow-card">
            <header className="border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold">Projetos vinculados</h2>
            </header>
            {projetos.data && projetos.data.length > 0 ? (
              <div className="p-4">
                <TableShell>
                  <thead>
                    <tr>
                      <Th>Projeto</Th>
                      <Th>Localidade</Th>
                      <Th>Status cobrança</Th>
                      <Th>Abertura</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {projetos.data.map((p) => (
                      <Tr key={p.id}>
                        <Td className="font-medium">
                          <Link to="/projetos/$id" params={{ id: p.id }} className="text-primary hover:underline">
                            {p.numero_projeto}
                          </Link>
                        </Td>
                        <Td>{p.localidades ? `${p.localidades.cidade}/${p.localidades.estado}` : "—"}</Td>
                        <Td>
                          <StatusBadge label={p.status_cobranca?.nome} />
                        </Td>
                        <Td className="tabular">{formatDate(p.data_abertura)}</Td>
                      </Tr>
                    ))}
                  </tbody>
                </TableShell>
              </div>
            ) : (
              <p className="px-4 py-6 text-sm text-muted-foreground">
                Nenhum projeto vinculado a esta empresa.
              </p>
            )}
          </section>
        </>
      )}
    </>
  );
}
