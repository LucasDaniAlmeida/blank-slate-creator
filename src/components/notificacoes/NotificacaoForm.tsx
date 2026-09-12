import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Field, FormCard, NONE, SelectField } from "@/components/common/FormKit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { empresaLabel, useEmpresasOptions } from "@/hooks/useLookups";
import { supabase } from "@/integrations/supabase/client";

export type NotificacaoFormValues = {
  projeto_id: string;
  empresa_notificada_id: string;
  protocolo_faturamento: string;
  data_verificacao_revelia: string;
  data_retirada_adequacao_pe: string;
  qtde_dias_ocupacao: string;
  data_abertura_protocolo_faturamento: string;
  quantidade_pontos: string;
  valor_arrecadado: string;
  observacao: string;
};

export const emptyNotificacao: NotificacaoFormValues = {
  projeto_id: "",
  empresa_notificada_id: "",
  protocolo_faturamento: "",
  data_verificacao_revelia: "",
  data_retirada_adequacao_pe: "",
  qtde_dias_ocupacao: "",
  data_abertura_protocolo_faturamento: "",
  quantidade_pontos: "0",
  valor_arrecadado: "0",
  observacao: "",
};

function useProjetosOptions() {
  return useQuery({
    queryKey: ["lookup", "projetos"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projetos")
        .select("id, numero_projeto, empresas(nome_comercial)")
        .order("numero_projeto")
        .limit(500);
      if (error) throw new Error(error.message);
      return (data ?? []) as unknown as {
        id: string;
        numero_projeto: string;
        empresas: { nome_comercial: string } | null;
      }[];
    },
  });
}

function toDb(values: NotificacaoFormValues) {
  const nullable = (v: string) => (v.trim() === "" ? null : v.trim());
  const num = (v: string) => (v.trim() === "" ? null : Number(v.replace(",", ".")));
  return {
    // numero_notificacao / ano / numero_sequencial são gerados pelo banco.
    projeto_id: values.projeto_id || null,
    empresa_notificada_id: values.empresa_notificada_id || null,
    protocolo_faturamento: nullable(values.protocolo_faturamento),
    data_verificacao_revelia: nullable(values.data_verificacao_revelia),
    data_retirada_adequacao_pe: nullable(values.data_retirada_adequacao_pe),
    qtde_dias_ocupacao: num(values.qtde_dias_ocupacao),
    data_abertura_protocolo_faturamento: nullable(values.data_abertura_protocolo_faturamento),
    quantidade_pontos: Number(values.quantidade_pontos || 0),
    valor_arrecadado: Number(String(values.valor_arrecadado || 0).replace(",", ".")),
    observacao: nullable(values.observacao),
  };
}

export function NotificacaoForm({
  initial,
  notificacaoId,
  onCancel,
}: {
  initial: NotificacaoFormValues;
  notificacaoId?: string;
  onCancel?: () => void;
}) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof NotificacaoFormValues, string>>>({});
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const projetos = useProjetosOptions();
  const empresas = useEmpresasOptions();

  const set = <K extends keyof NotificacaoFormValues>(k: K, v: NotificacaoFormValues[K]) =>
    setValues((s) => ({ ...s, [k]: v }));
  const pick = (v: string) => (v === NONE ? "" : v);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = toDb(values);
      if (notificacaoId) {
        const { error } = await supabase
          .from("notificacoes")
          .update(payload)
          .eq("id", notificacaoId);
        if (error) throw new Error(error.message);
        return { id: notificacaoId, numero: null as string | null };
      }
      const { data, error } = await supabase
        .from("notificacoes")
        .insert(payload as never)
        .select("id, numero_notificacao")
        .single();
      if (error) throw new Error(error.message);
      return { id: data.id as string, numero: data.numero_notificacao as string };
    },
    onSuccess: async ({ id, numero }) => {
      await queryClient.invalidateQueries({ queryKey: ["notificacoes"] });
      await queryClient.invalidateQueries({ queryKey: ["notificacao", id] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success(
        numero ? `Notificação ${numero} registrada.` : "Notificação atualizada com sucesso.",
      );
      if (notificacaoId) onCancel?.();
      else await navigate({ to: "/notificacoes/$id", params: { id } });
    },
    onError: (error) =>
      toast.error(
        /row-level security/i.test(error.message)
          ? "Seu perfil não tem permissão para esta operação."
          : error.message,
      ),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: Partial<Record<keyof NotificacaoFormValues, string>> = {};
    if (!values.empresa_notificada_id) next.empresa_notificada_id = "Selecione a empresa notificada.";
    if (Number(values.quantidade_pontos) < 0) next.quantidade_pontos = "Quantidade inválida.";
    setErrors(next);
    if (Object.keys(next).length > 0) {
      toast.error("Verifique os campos obrigatórios.");
      return;
    }
    mutation.mutate();
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <FormCard
        title="Vínculos"
        description="A numeração da notificação é gerada automaticamente pelo banco de dados."
      >
        <Field label="Projeto" hint="Opcional — a notificação pode existir sem projeto.">
          <SelectField
            value={values.projeto_id}
            onChange={(v) => set("projeto_id", pick(v))}
            options={(projetos.data ?? []).map((p) => ({
              value: p.id,
              label: `${p.numero_projeto}${p.empresas ? ` · ${p.empresas.nome_comercial}` : ""}`,
            }))}
            emptyLabel="Sem projeto vinculado"
            placeholder={projetos.isLoading ? "Carregando..." : "Selecione o projeto"}
          />
        </Field>
        <Field label="Empresa notificada" required error={errors.empresa_notificada_id}>
          <SelectField
            value={values.empresa_notificada_id}
            onChange={(v) => set("empresa_notificada_id", pick(v))}
            options={(empresas.data ?? []).map((e) => ({ value: e.id, label: empresaLabel(e) }))}
            allowEmpty={false}
            placeholder={empresas.isLoading ? "Carregando..." : "Selecione a empresa"}
          />
        </Field>
      </FormCard>

      <FormCard title="Processo" description="Datas e protocolos do processo de notificação.">
        <Field label="Protocolo de faturamento">
          <Input
            value={values.protocolo_faturamento}
            onChange={(e) => set("protocolo_faturamento", e.target.value)}
            className="h-9"
          />
        </Field>
        <Field label="Abertura do protocolo">
          <Input
            type="date"
            value={values.data_abertura_protocolo_faturamento}
            onChange={(e) => set("data_abertura_protocolo_faturamento", e.target.value)}
            className="h-9"
          />
        </Field>
        <Field label="Verificação de revelia">
          <Input
            type="date"
            value={values.data_verificacao_revelia}
            onChange={(e) => set("data_verificacao_revelia", e.target.value)}
            className="h-9"
          />
        </Field>
        <Field label="Retirada / adequação PE">
          <Input
            type="date"
            value={values.data_retirada_adequacao_pe}
            onChange={(e) => set("data_retirada_adequacao_pe", e.target.value)}
            className="h-9"
          />
        </Field>
        <Field label="Dias de ocupação">
          <Input
            type="number"
            min={0}
            value={values.qtde_dias_ocupacao}
            onChange={(e) => set("qtde_dias_ocupacao", e.target.value)}
            className="h-9"
          />
        </Field>
        <Field label="Quantidade de pontos" error={errors.quantidade_pontos}>
          <Input
            type="number"
            min={0}
            value={values.quantidade_pontos}
            onChange={(e) => set("quantidade_pontos", e.target.value)}
            className="h-9"
          />
        </Field>
        <Field label="Valor arrecadado (R$)">
          <Input
            type="number"
            step="0.01"
            min={0}
            value={values.valor_arrecadado}
            onChange={(e) => set("valor_arrecadado", e.target.value)}
            className="h-9"
          />
        </Field>
        <Field label="Observação" className="sm:col-span-2 lg:col-span-3">
          <Textarea
            value={values.observacao}
            onChange={(e) => set("observacao", e.target.value)}
            rows={3}
          />
        </Field>
      </FormCard>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => (onCancel ? onCancel() : void navigate({ to: "/notificacoes" }))}
          disabled={mutation.isPending}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          {notificacaoId ? "Salvar alterações" : "Registrar notificação"}
        </Button>
      </div>
    </form>
  );
}

export function notificacaoToForm(row: Record<string, unknown>): NotificacaoFormValues {
  const date = (v: unknown) => (typeof v === "string" ? v.slice(0, 10) : "");
  const text = (v: unknown) => (typeof v === "string" ? v : "");
  return {
    projeto_id: text(row["projeto_id"]),
    empresa_notificada_id: text(row["empresa_notificada_id"]),
    protocolo_faturamento: text(row["protocolo_faturamento"]),
    data_verificacao_revelia: date(row["data_verificacao_revelia"]),
    data_retirada_adequacao_pe: date(row["data_retirada_adequacao_pe"]),
    qtde_dias_ocupacao: row["qtde_dias_ocupacao"] == null ? "" : String(row["qtde_dias_ocupacao"]),
    data_abertura_protocolo_faturamento: date(row["data_abertura_protocolo_faturamento"]),
    quantidade_pontos: String(row["quantidade_pontos"] ?? 0),
    valor_arrecadado: String(row["valor_arrecadado"] ?? 0),
    observacao: text(row["observacao"]),
  };
}
