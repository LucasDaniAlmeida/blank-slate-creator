import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, Plus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Field, FormCard } from "@/components/common/FormKit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { maskCNPJ, maskPhone, onlyDigits } from "@/lib/format";

export type Contato = { nome: string; telefone: string; email: string; cargo?: string };

export type EmpresaFormValues = {
  cnpj: string;
  nome_comercial: string;
  nome_fantasia: string;
  numero_sigum: string;
  codigo_contrato: string;
  uc: string;
  emails: string;
  responsavel: string;
  endereco_correspondencia: string;
  contatos: Contato[];
};

export const emptyEmpresa: EmpresaFormValues = {
  cnpj: "",
  nome_comercial: "",
  nome_fantasia: "",
  numero_sigum: "",
  codigo_contrato: "",
  uc: "",
  emails: "",
  responsavel: "",
  endereco_correspondencia: "",
  contatos: [],
};

export function EmpresaForm({
  initial,
  empresaId,
  onCancel,
}: {
  initial: EmpresaFormValues;
  empresaId?: string;
  onCancel?: () => void;
}) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const set = <K extends keyof EmpresaFormValues>(k: K, v: EmpresaFormValues[K]) =>
    setValues((s) => ({ ...s, [k]: v }));

  const mutation = useMutation({
    mutationFn: async () => {
      const nullable = (v: string) => (v.trim() === "" ? null : v.trim());
      const payload = {
        cnpj: onlyDigits(values.cnpj),
        nome_comercial: values.nome_comercial.trim(),
        nome_fantasia: nullable(values.nome_fantasia),
        numero_sigum: nullable(values.numero_sigum),
        codigo_contrato: nullable(values.codigo_contrato),
        uc: nullable(values.uc),
        emails: values.emails
          .split(/[;,\n]/)
          .map((e) => e.trim())
          .filter(Boolean),
        contatos: values.contatos.filter((c) => c.nome || c.telefone || c.email),
        responsavel: nullable(values.responsavel),
        endereco_correspondencia: nullable(values.endereco_correspondencia),
      };
      if (empresaId) {
        const { error } = await supabase.from("empresas").update(payload).eq("id", empresaId);
        if (error) throw new Error(error.message);
        return empresaId;
      }
      const { data, error } = await supabase.from("empresas").insert(payload).select("id").single();
      if (error) throw new Error(error.message);
      return data.id as string;
    },
    onSuccess: async (id) => {
      await queryClient.invalidateQueries({ queryKey: ["empresas"] });
      await queryClient.invalidateQueries({ queryKey: ["empresa", id] });
      await queryClient.invalidateQueries({ queryKey: ["lookup", "empresas"] });
      toast.success(empresaId ? "Empresa atualizada." : "Empresa cadastrada.");
      if (empresaId) onCancel?.();
      else await navigate({ to: "/empresas/$id", params: { id } });
    },
    onError: (e) =>
      toast.error(
        /row-level security/i.test(e.message)
          ? "Seu perfil não tem permissão para esta operação."
          : /duplicate|unique/i.test(e.message)
            ? "Já existe uma empresa com este CNPJ."
            : e.message,
      ),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (onlyDigits(values.cnpj).length !== 14) next.cnpj = "Informe um CNPJ válido (14 dígitos).";
    if (!values.nome_comercial.trim()) next.nome_comercial = "Informe o nome comercial.";
    const invalido = values.emails
      .split(/[;,\n]/)
      .map((v) => v.trim())
      .filter(Boolean)
      .find((v) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v));
    if (invalido) next.emails = `E-mail inválido: ${invalido}`;
    setErrors(next);
    if (Object.keys(next).length > 0) {
      toast.error("Verifique os campos obrigatórios.");
      return;
    }
    mutation.mutate();
  }

  function updateContato(index: number, patch: Partial<Contato>) {
    set(
      "contatos",
      values.contatos.map((c, i) => (i === index ? { ...c, ...patch } : c)),
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <FormCard title="Identificação" description="Dados cadastrais da empresa.">
        <Field label="CNPJ" required error={errors.cnpj}>
          <Input
            value={values.cnpj}
            onChange={(e) => set("cnpj", maskCNPJ(e.target.value))}
            placeholder="00.000.000/0000-00"
            className="h-9"
            inputMode="numeric"
          />
        </Field>
        <Field label="Nome comercial" required error={errors.nome_comercial}>
          <Input
            value={values.nome_comercial}
            onChange={(e) => set("nome_comercial", e.target.value)}
            className="h-9"
          />
        </Field>
        <Field label="Nome fantasia">
          <Input value={values.nome_fantasia} onChange={(e) => set("nome_fantasia", e.target.value)} className="h-9" />
        </Field>
        <Field label="Número SIGUM">
          <Input value={values.numero_sigum} onChange={(e) => set("numero_sigum", e.target.value)} className="h-9" />
        </Field>
        <Field label="Código do contrato">
          <Input
            value={values.codigo_contrato}
            onChange={(e) => set("codigo_contrato", e.target.value)}
            className="h-9"
          />
        </Field>
        <Field label="UC">
          <Input value={values.uc} onChange={(e) => set("uc", e.target.value)} className="h-9" />
        </Field>
      </FormCard>

      <FormCard title="Comunicação" description="E-mails, responsável e endereço de correspondência.">
        <Field
          label="E-mails"
          error={errors.emails}
          hint="Separe múltiplos e-mails por vírgula ou linha."
          className="sm:col-span-2"
        >
          <Textarea value={values.emails} onChange={(e) => set("emails", e.target.value)} rows={3} />
        </Field>
        <Field label="Responsável">
          <Input value={values.responsavel} onChange={(e) => set("responsavel", e.target.value)} className="h-9" />
        </Field>
        <Field label="Endereço de correspondência" className="sm:col-span-2 lg:col-span-3">
          <Textarea
            value={values.endereco_correspondencia}
            onChange={(e) => set("endereco_correspondencia", e.target.value)}
            rows={2}
          />
        </Field>
      </FormCard>

      <section className="rounded-lg border border-border bg-card shadow-card">
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold">Contatos</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Pessoas de contato vinculadas à empresa.</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => set("contatos", [...values.contatos, { nome: "", telefone: "", email: "", cargo: "" }])}
          >
            <Plus className="size-4" />
            Adicionar contato
          </Button>
        </header>
        <div className="p-4">
          {values.contatos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum contato adicionado.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {values.contatos.map((c, i) => (
                <div key={i} className="grid gap-3 rounded-md border border-border p-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Field label="Nome">
                    <Input
                      value={c.nome}
                      onChange={(e) => updateContato(i, { nome: e.target.value })}
                      className="h-9"
                    />
                  </Field>
                  <Field label="Cargo">
                    <Input
                      value={c.cargo ?? ""}
                      onChange={(e) => updateContato(i, { cargo: e.target.value })}
                      className="h-9"
                    />
                  </Field>
                  <Field label="Telefone">
                    <Input
                      value={c.telefone}
                      onChange={(e) => updateContato(i, { telefone: maskPhone(e.target.value) })}
                      className="h-9"
                    />
                  </Field>
                  <div className="flex items-end gap-2">
                    <Field label="E-mail" className="flex-1">
                      <Input
                        value={c.email}
                        onChange={(e) => updateContato(i, { email: e.target.value })}
                        className="h-9"
                      />
                    </Field>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="mb-0.5"
                      onClick={() =>
                        set(
                          "contatos",
                          values.contatos.filter((_, idx) => idx !== i),
                        )
                      }
                      aria-label="Remover contato"
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => (onCancel ? onCancel() : void navigate({ to: "/empresas" }))}
          disabled={mutation.isPending}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          {empresaId ? "Salvar alterações" : "Cadastrar empresa"}
        </Button>
      </div>
    </form>
  );
}

export function empresaToForm(row: Record<string, any>): EmpresaFormValues {
  return {
    cnpj: row.cnpj ?? "",
    nome_comercial: row.nome_comercial ?? "",
    nome_fantasia: row.nome_fantasia ?? "",
    numero_sigum: row.numero_sigum ?? "",
    codigo_contrato: row.codigo_contrato ?? "",
    uc: row.uc ?? "",
    emails: Array.isArray(row.emails) ? row.emails.join(", ") : "",
    responsavel: row.responsavel ?? "",
    endereco_correspondencia: row.endereco_correspondencia ?? "",
    contatos: Array.isArray(row.contatos)
      ? (row.contatos as Contato[]).map((c) => ({
          nome: c?.nome ?? "",
          telefone: c?.telefone ?? "",
          email: c?.email ?? "",
          cargo: c?.cargo ?? "",
        }))
      : [],
  };
}
