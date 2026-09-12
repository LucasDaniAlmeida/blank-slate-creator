import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Field, FormCard, NONE, SelectField } from "@/components/common/FormKit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  empresaLabel,
  localidadeLabel,
  useEmpresasOptions,
  useLocalidadesOptions,
  useStatusCobranca,
  useUsuariosOptions,
} from "@/hooks/useLookups";
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/format";

export const STATUS_INICIAL_COBRANCA = "Pendente de atualização no SIGUM";

export type ProjetoFormValues = {
  numero_projeto: string;
  empresa_id: string;
  localidade_id: string;
  numero_contrato_sigum: string;
  data_abertura: string;
  data_resposta: string;
  analista_id: string;
  quantidade_postes: string;
  data_inicio_cobranca: string;
  status_cobranca_id: string;
  numero_chamado: string;
  data_atualizacao_sigum: string;
  observacoes: string;
  projeto_cadastrado: string;
};

export const emptyProjeto: ProjetoFormValues = {
  numero_projeto: "",
  empresa_id: "",
  localidade_id: "",
  numero_contrato_sigum: "",
  data_abertura: "",
  data_resposta: "",
  analista_id: "",
  quantidade_postes: "0",
  data_inicio_cobranca: "",
  status_cobranca_id: "",
  numero_chamado: "",
  data_atualizacao_sigum: "",
  observacoes: "",
  projeto_cadastrado: "",
};

/**
 * O "Início da cobrança" é calculado pelo banco a partir da data de resposta
 * (5 dias úteis com contrato / 30 dias corridos sem contrato), por isso o campo
 * nunca é enviado pelo formulário.
 */
function toDb(values: ProjetoFormValues, statusInicialId: string | null, criando: boolean) {
  const nullable = (v: string) => (v.trim() === "" ? null : v.trim());
  const timestamp = (v: string) => (v ? new Date(`${v}T12:00:00`).toISOString() : null);
  return {
    numero_projeto: values.numero_projeto.trim(),
    empresa_id: values.empresa_id,
    localidade_id: values.localidade_id,
    numero_contrato_sigum: nullable(values.numero_contrato_sigum),
    data_abertura: timestamp(values.data_abertura),
    data_resposta: timestamp(values.data_resposta),
    analista_id: values.analista_id || null,
    quantidade_postes: Number(values.quantidade_postes || 0),
    ...(criando && statusInicialId ? { status_cobranca_id: statusInicialId } : {}),
    numero_chamado: nullable(values.numero_chamado),
    data_atualizacao_sigum: values.numero_contrato_sigum.trim()
      ? timestamp(values.data_atualizacao_sigum)
      : null,
    observacoes: nullable(values.observacoes),
    projeto_cadastrado: nullable(values.projeto_cadastrado),
  };
}

/** Alguns bancos ainda têm `projeto_cadastrado` booleano — nesse caso enviamos o valor convertido. */
function isTipoInvalido(message: string): boolean {
  return /projeto_cadastrado|invalid input syntax for type boolean|22P02/i.test(message);
}

export function ProjetoForm({
  initial,
  projetoId,
  onCancel,
}: {
  initial: ProjetoFormValues;
  projetoId?: string;
  onCancel?: () => void;
}) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const empresas = useEmpresasOptions();
  const localidades = useLocalidadesOptions();
  const usuarios = useUsuariosOptions();
  const statusCobranca = useStatusCobranca();

  const statusInicial = useMemo(
    () =>
      (statusCobranca.data ?? []).find((s) =>
        s.nome.toLowerCase().includes("pendente de atualiza"),
      ) ?? null,
    [statusCobranca.data],
  );

  const statusAtualNome = useMemo(() => {
    if (values.status_cobranca_id) {
      const atual = (statusCobranca.data ?? []).find((s) => s.id === values.status_cobranca_id);
      if (atual) return atual.nome;
    }
    return projetoId ? "—" : (statusInicial?.nome ?? STATUS_INICIAL_COBRANCA);
  }, [statusCobranca.data, statusInicial, values.status_cobranca_id, projetoId]);

  const contratoInformado = values.numero_contrato_sigum.trim().length > 0;

  const set = <K extends keyof ProjetoFormValues>(key: K, value: ProjetoFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = toDb(values, statusInicial?.id ?? null, !projetoId);
      const legado = {
        ...payload,
        projeto_cadastrado: Boolean(values.projeto_cadastrado.trim()),
      } as unknown as typeof payload;

      if (projetoId) {
        let res = await supabase.from("projetos").update(payload as never).eq("id", projetoId);
        if (res.error && isTipoInvalido(res.error.message)) {
          res = await supabase.from("projetos").update(legado as never).eq("id", projetoId);
        }
        if (res.error) throw new Error(res.error.message);
        return projetoId;
      }

      let res = await supabase.from("projetos").insert(payload as never).select("id").single();
      if (res.error && isTipoInvalido(res.error.message)) {
        res = await supabase.from("projetos").insert(legado as never).select("id").single();
      }
      if (res.error) throw new Error(res.error.message);
      return (res.data as { id: string }).id;
    },
    onSuccess: async (id) => {
      await queryClient.invalidateQueries({ queryKey: ["projetos"] });
      await queryClient.invalidateQueries({ queryKey: ["projeto", id] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success(projetoId ? "Projeto atualizado com sucesso." : "Projeto criado com sucesso.");
      if (projetoId) onCancel?.();
      else await navigate({ to: "/projetos/$id", params: { id } });
    },
    onError: (error) => {
      toast.error(
        /row-level security/i.test(error.message)
          ? "Seu perfil não tem permissão para esta operação."
          : error.message,
      );
    },
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!values.numero_projeto.trim()) next.numero_projeto = "Informe o número do projeto.";
    if (!values.empresa_id) next.empresa_id = "Selecione a empresa.";
    if (!values.localidade_id) next.localidade_id = "Selecione a localidade.";
    if (Number(values.quantidade_postes) < 0 || Number.isNaN(Number(values.quantidade_postes)))
      next.quantidade_postes = "Quantidade inválida.";
    setErrors(next);
    if (Object.keys(next).length > 0) {
      toast.error("Verifique os campos obrigatórios.");
      return;
    }
    mutation.mutate();
  }

  const pick = (v: string) => (v === NONE ? "" : v);

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <FormCard title="Identificação" description="Dados principais do projeto.">
        <Field label="Número do projeto" required error={errors.numero_projeto}>
          <Input
            value={values.numero_projeto}
            onChange={(e) => set("numero_projeto", e.target.value)}
            placeholder="PROJ-2026-0001"
            className="h-9"
          />
        </Field>
        <Field label="Empresa" required error={errors.empresa_id}>
          <SelectField
            value={values.empresa_id}
            onChange={(v) => set("empresa_id", pick(v))}
            options={(empresas.data ?? []).map((e) => ({ value: e.id, label: empresaLabel(e) }))}
            allowEmpty={false}
            placeholder={empresas.isLoading ? "Carregando..." : "Selecione a empresa"}
          />
        </Field>
        <Field label="Localidade" required error={errors.localidade_id}>
          <SelectField
            value={values.localidade_id}
            onChange={(v) => set("localidade_id", pick(v))}
            options={(localidades.data ?? []).map((l) => ({ value: l.id, label: localidadeLabel(l) }))}
            allowEmpty={false}
            placeholder={localidades.isLoading ? "Carregando..." : "Selecione a localidade"}
          />
        </Field>
        <Field label="Número contrato SIGUM">
          <Input
            value={values.numero_contrato_sigum}
            onChange={(e) => set("numero_contrato_sigum", e.target.value)}
            className="h-9"
          />
        </Field>
        <Field label="Analista responsável">
          <SelectField
            value={values.analista_id}
            onChange={(v) => set("analista_id", pick(v))}
            options={(usuarios.data ?? [])
              .filter((u) => u.ativo)
              .map((u) => ({ value: u.id, label: u.nome ?? u.matricula ?? "Sem nome" }))}
          />
        </Field>
      </FormCard>

      <FormCard title="Cobrança" description="Prazo e status calculados automaticamente pelo banco.">
        <Field label="Data de abertura">
          <Input
            type="date"
            value={values.data_abertura}
            onChange={(e) => set("data_abertura", e.target.value)}
            className="h-9"
          />
        </Field>
        <Field
          label="Data de resposta"
          hint="Define o início da cobrança calculado pelo banco."
        >
          <Input
            type="date"
            value={values.data_resposta}
            onChange={(e) => set("data_resposta", e.target.value)}
            className="h-9"
          />
        </Field>
        <Field label="Quantidade de postes" error={errors.quantidade_postes}>
          <Input
            type="number"
            min={0}
            value={values.quantidade_postes}
            onChange={(e) => set("quantidade_postes", e.target.value)}
            className="h-9"
          />
        </Field>
        <Field
          label="Início da cobrança"
          hint="5 dias úteis para empresas com contrato; 30 dias corridos sem contrato."
        >
          <Input
            readOnly
            disabled
            value={
              values.data_inicio_cobranca
                ? formatDate(values.data_inicio_cobranca)
                : "Calculado após salvar"
            }
            className="h-9"
          />
        </Field>
        <Field label="Status da cobrança" hint="Somente leitura — atualizado pelo banco.">
          <Input readOnly disabled value={statusAtualNome} className="h-9" />
        </Field>
        <Field label="Número do chamado">
          <Input
            value={values.numero_chamado}
            onChange={(e) => set("numero_chamado", e.target.value)}
            className="h-9"
          />
        </Field>
      </FormCard>

      <FormCard title="Atualização no SIGUM" description="Registro da atualização e observações.">
        <Field
          label="Atualização SIGUM"
          hint={contratoInformado ? undefined : "Informe o número do contrato SIGUM para habilitar."}
        >
          <Input
            type="date"
            value={values.data_atualizacao_sigum}
            onChange={(e) => set("data_atualizacao_sigum", e.target.value)}
            disabled={!contratoInformado}
            className="h-9"
          />
        </Field>
        <Field label="Projeto cadastrado no sistema de origem">
          <Input
            value={values.projeto_cadastrado}
            onChange={(e) => set("projeto_cadastrado", e.target.value)}
            placeholder="Informe o cadastro"
            className="h-9"
          />
        </Field>
        <Field label="Observações" className="sm:col-span-2 lg:col-span-3">
          <Textarea
            value={values.observacoes}
            onChange={(e) => set("observacoes", e.target.value)}
            rows={3}
          />
        </Field>
      </FormCard>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => (onCancel ? onCancel() : void navigate({ to: "/projetos", search: {} }))}
          disabled={mutation.isPending}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          {projetoId ? "Salvar alterações" : "Criar projeto"}
        </Button>
      </div>
    </form>
  );
}

export function projetoToForm(row: Record<string, unknown>): ProjetoFormValues {
  const date = (v: unknown) => (typeof v === "string" ? v.slice(0, 10) : "");
  const text = (v: unknown) => (typeof v === "string" ? v : "");
  const cadastrado = (v: unknown) => {
    if (typeof v === "string") return v;
    if (v === true) return "Sim";
    return "";
  };
  return {
    numero_projeto: text(row.numero_projeto),
    empresa_id: text(row.empresa_id),
    localidade_id: text(row.localidade_id),
    numero_contrato_sigum: text(row.numero_contrato_sigum),
    data_abertura: date(row.data_abertura),
    data_resposta: date(row.data_resposta),
    analista_id: text(row.analista_id),
    quantidade_postes: String(row.quantidade_postes ?? 0),
    data_inicio_cobranca: date(row.data_inicio_cobranca),
    status_cobranca_id: text(row.status_cobranca_id),
    numero_chamado: text(row.numero_chamado),
    data_atualizacao_sigum: date(row.data_atualizacao_sigum),
    observacoes: text(row.observacoes),
    projeto_cadastrado: cadastrado(row.projeto_cadastrado),
  };
}
