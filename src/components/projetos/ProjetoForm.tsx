import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Field, FormCard, NONE, SelectField } from "@/components/common/FormKit";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  empresaLabel,
  localidadeLabel,
  useEmpresasOptions,
  useLocalidadesOptions,
  useStatusCobranca,
  useStatusFiscalizacao,
  useUsuariosOptions,
} from "@/hooks/useLookups";
import { supabase } from "@/integrations/supabase/client";

export type ProjetoFormValues = {
  numero_projeto: string;
  empresa_id: string;
  localidade_id: string;
  numero_contrato_sigum: string;
  solicitante: string;
  data_abertura: string;
  data_resposta: string;
  analista_id: string;
  quantidade_postes: string;
  data_inicio_cobranca: string;
  status_cobranca_id: string;
  numero_chamado: string;
  data_atualizacao_sigum: string;
  data_fiscalizacao: string;
  status_fiscalizacao_id: string;
  observacoes: string;
  projeto_cadastrado: boolean;
};

export const emptyProjeto: ProjetoFormValues = {
  numero_projeto: "",
  empresa_id: "",
  localidade_id: "",
  numero_contrato_sigum: "",
  solicitante: "",
  data_abertura: "",
  data_resposta: "",
  analista_id: "",
  quantidade_postes: "0",
  data_inicio_cobranca: "",
  status_cobranca_id: "",
  numero_chamado: "",
  data_atualizacao_sigum: "",
  data_fiscalizacao: "",
  status_fiscalizacao_id: "",
  observacoes: "",
  projeto_cadastrado: false,
};

function toDb(values: ProjetoFormValues) {
  const nullable = (v: string) => (v.trim() === "" ? null : v.trim());
  const timestamp = (v: string) => (v ? new Date(`${v}T12:00:00`).toISOString() : null);
  return {
    numero_projeto: values.numero_projeto.trim(),
    empresa_id: values.empresa_id,
    localidade_id: values.localidade_id,
    numero_contrato_sigum: nullable(values.numero_contrato_sigum),
    solicitante: nullable(values.solicitante),
    data_abertura: timestamp(values.data_abertura),
    data_resposta: timestamp(values.data_resposta),
    analista_id: values.analista_id || null,
    quantidade_postes: Number(values.quantidade_postes || 0),
    data_inicio_cobranca: nullable(values.data_inicio_cobranca),
    status_cobranca_id: values.status_cobranca_id || null,
    numero_chamado: nullable(values.numero_chamado),
    data_atualizacao_sigum: timestamp(values.data_atualizacao_sigum),
    data_fiscalizacao: nullable(values.data_fiscalizacao),
    status_fiscalizacao_id: values.status_fiscalizacao_id || null,
    observacoes: nullable(values.observacoes),
    projeto_cadastrado: values.projeto_cadastrado,
  };
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
  const statusFiscalizacao = useStatusFiscalizacao();

  const set = <K extends keyof ProjetoFormValues>(key: K, value: ProjetoFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = toDb(values);
      if (projetoId) {
        const { error } = await supabase.from("projetos").update(payload).eq("id", projetoId);
        if (error) throw new Error(error.message);
        return projetoId;
      }
      const { data, error } = await supabase.from("projetos").insert(payload).select("id").single();
      if (error) throw new Error(error.message);
      return data.id as string;
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
        <Field label="Solicitante">
          <Input
            value={values.solicitante}
            onChange={(e) => set("solicitante", e.target.value)}
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

      <FormCard title="Cobrança" description="Acompanhamento financeiro do projeto.">
        <Field label="Data de abertura">
          <Input
            type="date"
            value={values.data_abertura}
            onChange={(e) => set("data_abertura", e.target.value)}
            className="h-9"
          />
        </Field>
        <Field label="Data de resposta">
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
        <Field label="Início da cobrança">
          <Input
            type="date"
            value={values.data_inicio_cobranca}
            onChange={(e) => set("data_inicio_cobranca", e.target.value)}
            className="h-9"
          />
        </Field>
        <Field label="Status da cobrança">
          <SelectField
            value={values.status_cobranca_id}
            onChange={(v) => set("status_cobranca_id", pick(v))}
            options={(statusCobranca.data ?? []).map((s) => ({ value: s.id, label: s.nome }))}
          />
        </Field>
        <Field label="Número do chamado">
          <Input
            value={values.numero_chamado}
            onChange={(e) => set("numero_chamado", e.target.value)}
            className="h-9"
          />
        </Field>
      </FormCard>

      <FormCard title="Fiscalização e registro" description="Situação da fiscalização e observações.">
        <Field label="Atualização SIGUM">
          <Input
            type="date"
            value={values.data_atualizacao_sigum}
            onChange={(e) => set("data_atualizacao_sigum", e.target.value)}
            className="h-9"
          />
        </Field>
        <Field label="Data da fiscalização">
          <Input
            type="date"
            value={values.data_fiscalizacao}
            onChange={(e) => set("data_fiscalizacao", e.target.value)}
            className="h-9"
          />
        </Field>
        <Field label="Status da fiscalização">
          <SelectField
            value={values.status_fiscalizacao_id}
            onChange={(v) => set("status_fiscalizacao_id", pick(v))}
            options={(statusFiscalizacao.data ?? []).map((s) => ({ value: s.id, label: s.nome }))}
          />
        </Field>
        <Field label="Observações" className="sm:col-span-2 lg:col-span-3">
          <Textarea
            value={values.observacoes}
            onChange={(e) => set("observacoes", e.target.value)}
            rows={3}
          />
        </Field>
        <div className="flex items-center gap-2 sm:col-span-2 lg:col-span-3">
          <Checkbox
            id="cadastrado"
            checked={values.projeto_cadastrado}
            onCheckedChange={(c) => set("projeto_cadastrado", c === true)}
          />
          <label htmlFor="cadastrado" className="text-sm">
            Projeto cadastrado no sistema de origem
          </label>
        </div>
      </FormCard>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => (onCancel ? onCancel() : void navigate({ to: "/projetos" }))}
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
  return {
    numero_projeto: text(row.numero_projeto),
    empresa_id: text(row.empresa_id),
    localidade_id: text(row.localidade_id),
    numero_contrato_sigum: text(row.numero_contrato_sigum),
    solicitante: text(row.solicitante),
    data_abertura: date(row.data_abertura),
    data_resposta: date(row.data_resposta),
    analista_id: text(row.analista_id),
    quantidade_postes: String(row.quantidade_postes ?? 0),
    data_inicio_cobranca: date(row.data_inicio_cobranca),
    status_cobranca_id: text(row.status_cobranca_id),
    numero_chamado: text(row.numero_chamado),
    data_atualizacao_sigum: date(row.data_atualizacao_sigum),
    data_fiscalizacao: date(row.data_fiscalizacao),
    status_fiscalizacao_id: text(row.status_fiscalizacao_id),
    observacoes: text(row.observacoes),
    projeto_cadastrado: Boolean(row.projeto_cadastrado),
  };
}
