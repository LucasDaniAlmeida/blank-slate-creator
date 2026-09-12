import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Building, Loader2, MapPin, Network, Pencil, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { EmptyState, ErrorState, TableSkeleton } from "@/components/common/DataStates";
import { Pagination, Td, Th, Tr } from "@/components/common/DataTable";
import { ALL, FilterBar, FilterSelect, SearchField } from "@/components/common/Filters";
import { Field } from "@/components/common/FormKit";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, formatNumber } from "@/lib/format";

const PAGE_SIZE = 15;

export const Route = createFileRoute("/_authenticated/localidades")({
  head: () => ({
    meta: [
      { title: "Localidades — Gestão de Projetos, Cobrança e Fiscalização" },
      { name: "description", content: "Cadastro de cidades, polos e regionais utilizados nos projetos." },
      { property: "og:title", content: "Localidades — Gestão de Projetos" },
      { property: "og:description", content: "Cadastro de cidades, polos e regionais." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LocalidadesPage,
});

type Row = {
  id: string;
  cidade: string;
  polo: string | null;
  regional: string | null;
  estado: string;
  created_at: string;
};

type FormValues = { cidade: string; estado: string; polo: string; regional: string };
const emptyForm: FormValues = { cidade: "", estado: "", polo: "", regional: "" };

function LocalidadesPage() {
  const { can } = useAuth();
  const queryClient = useQueryClient();
  const [busca, setBusca] = useState("");
  const [termo, setTermo] = useState("");
  const [estado, setEstado] = useState(ALL);
  const [polo, setPolo] = useState(ALL);
  const [regional, setRegional] = useState(ALL);
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState({ key: "cidade", asc: true });
  const [editando, setEditando] = useState<{ id?: string; values: FormValues } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const t = setTimeout(() => {
      setTermo(busca.trim());
      setPage(0);
    }, 350);
    return () => clearTimeout(t);
  }, [busca]);

  const todas = useQuery({
    queryKey: ["localidades", "todas"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("localidades")
        .select("id, cidade, estado, polo, regional")
        .limit(1000);
      if (error) throw new Error(error.message);
      return (data ?? []) as Row[];
    },
  });

  const lista = useQuery({
    queryKey: ["localidades", { termo, estado, polo, regional }, page, sort],
    queryFn: async () => {
      let query = supabase
        .from("localidades")
        .select("id, cidade, polo, regional, estado, created_at", { count: "exact" });
      if (termo) query = query.or(`cidade.ilike.%${termo}%,polo.ilike.%${termo}%,regional.ilike.%${termo}%`);
      if (estado !== ALL) query = query.eq("estado", estado);
      if (polo !== ALL) query = query.eq("polo", polo);
      if (regional !== ALL) query = query.eq("regional", regional);
      const { data, error, count } = await query
        .order(sort.key, { ascending: sort.asc })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
      if (error) throw new Error(error.message);
      return { rows: (data ?? []) as Row[], total: count ?? 0 };
    },
  });

  const salvar = useMutation({
    mutationFn: async () => {
      if (!editando) return;
      const payload = {
        cidade: editando.values.cidade.trim(),
        estado: editando.values.estado.trim().toUpperCase(),
        polo: editando.values.polo.trim() || null,
        regional: editando.values.regional.trim() || null,
      };
      if (editando.id) {
        const { error } = await supabase.from("localidades").update(payload).eq("id", editando.id);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from("localidades").insert(payload);
        if (error) throw new Error(error.message);
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["localidades"] });
      await queryClient.invalidateQueries({ queryKey: ["lookup", "localidades"] });
      toast.success(editando?.id ? "Localidade atualizada." : "Localidade cadastrada.");
      setEditando(null);
    },
    onError: (e) =>
      toast.error(
        /row-level security/i.test(e.message)
          ? "Seu perfil não tem permissão para esta operação."
          : e.message,
      ),
  });

  const opcoes = useMemo(() => {
    const rows = todas.data ?? [];
    return {
      estados: [...new Set(rows.map((r) => r.estado))].sort(),
      polos: [...new Set(rows.map((r) => r.polo).filter(Boolean))].sort() as string[],
      regionais: [...new Set(rows.map((r) => r.regional).filter(Boolean))].sort() as string[],
    };
  }, [todas.data]);

  const rows = lista.data?.rows ?? [];
  const canClear = Boolean(busca) || [estado, polo, regional].some((v) => v !== ALL);

  function toggleSort(key: string) {
    setSort((s) => (s.key === key ? { key, asc: !s.asc } : { key, asc: true }));
  }

  function submitForm(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!editando?.values.cidade.trim()) next.cidade = "Informe a cidade.";
    if ((editando?.values.estado.trim().length ?? 0) !== 2) next.estado = "Informe a UF com 2 letras.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    salvar.mutate();
  }

  return (
    <>
      <PageHeader
        title="Localidades"
        description="Cidades, polos e regionais utilizados no cadastro de projetos."
        actions={
          can("localidades.criar") ? (
            <Button size="sm" onClick={() => setEditando({ values: emptyForm })}>
              <Plus className="size-4" />
              Nova Localidade
            </Button>
          ) : null
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard compact label="Total de localidades" value={formatNumber(todas.data?.length ?? 0)} icon={MapPin} tone="primary" loading={todas.isLoading} />
        <StatCard compact label="Estados" value={formatNumber(opcoes.estados.length)} icon={Network} tone="success" loading={todas.isLoading} />
        <StatCard compact label="Regionais" value={formatNumber(opcoes.regionais.length)} icon={Building} tone="warning" loading={todas.isLoading} />
        <StatCard compact label="Polos" value={formatNumber(opcoes.polos.length)} icon={Building} tone="neutral" loading={todas.isLoading} />
      </div>

      <FilterBar
        canClear={canClear}
        onClear={() => {
          setBusca("");
          setEstado(ALL);
          setPolo(ALL);
          setRegional(ALL);
          setPage(0);
        }}
      >
        <SearchField value={busca} onChange={setBusca} placeholder="Buscar por cidade, polo ou regional..." />
        <FilterSelect
          label="Estado"
          value={estado}
          onChange={(v) => {
            setEstado(v);
            setPage(0);
          }}
          options={opcoes.estados.map((e) => ({ value: e, label: e }))}
          className="min-w-[120px]"
        />
        <FilterSelect
          label="Polo"
          value={polo}
          onChange={(v) => {
            setPolo(v);
            setPage(0);
          }}
          options={opcoes.polos.map((p) => ({ value: p, label: p }))}
        />
        <FilterSelect
          label="Regional"
          value={regional}
          onChange={(v) => {
            setRegional(v);
            setPage(0);
          }}
          options={opcoes.regionais.map((r) => ({ value: r, label: r }))}
        />
      </FilterBar>

      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-card">
        {lista.error ? (
          <ErrorState message={(lista.error as Error).message} onRetry={() => void lista.refetch()} />
        ) : (
          <>
            <div className="max-w-full overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <Th sortKey="cidade" sort={sort} onSort={toggleSort}>
                      Cidade
                    </Th>
                    <Th sortKey="estado" sort={sort} onSort={toggleSort}>
                      UF
                    </Th>
                    <Th sortKey="polo" sort={sort} onSort={toggleSort}>
                      Polo
                    </Th>
                    <Th sortKey="regional" sort={sort} onSort={toggleSort}>
                      Regional
                    </Th>
                    <Th>Cadastro</Th>
                    <Th align="right">Ações</Th>
                  </tr>
                </thead>
                {lista.isLoading ? (
                  <TableSkeleton cols={6} />
                ) : (
                  <tbody>
                    {rows.map((l) => (
                      <Tr key={l.id}>
                        <Td className="font-medium">{l.cidade}</Td>
                        <Td>{l.estado}</Td>
                        <Td>{l.polo ?? "—"}</Td>
                        <Td>{l.regional ?? "—"}</Td>
                        <Td className="tabular">{formatDate(l.created_at)}</Td>
                        <Td align="right">
                          {can("localidades.editar") ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7"
                              aria-label="Editar localidade"
                              onClick={() =>
                                setEditando({
                                  id: l.id,
                                  values: {
                                    cidade: l.cidade,
                                    estado: l.estado,
                                    polo: l.polo ?? "",
                                    regional: l.regional ?? "",
                                  },
                                })
                              }
                            >
                              <Pencil className="size-3.5" />
                            </Button>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </Td>
                      </Tr>
                    ))}
                  </tbody>
                )}
              </table>
            </div>

            {!lista.isLoading && rows.length === 0 ? (
              <EmptyState
                title="Nenhuma localidade encontrada."
                description={
                  canClear ? "Ajuste os filtros aplicados." : "Cadastre as cidades atendidas pela operação."
                }
              />
            ) : null}

            {rows.length > 0 ? (
              <Pagination
                page={page}
                pageSize={PAGE_SIZE}
                total={lista.data?.total ?? 0}
                onPage={setPage}
                itemLabel="localidades"
              />
            ) : null}
          </>
        )}
      </div>

      <Dialog open={editando !== null} onOpenChange={(o) => (!o ? setEditando(null) : null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editando?.id ? "Editar localidade" : "Nova localidade"}</DialogTitle>
            <DialogDescription>
              Cidade e UF são obrigatórios. Polo e regional são opcionais.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitForm} className="grid gap-4 sm:grid-cols-2">
            <Field label="Cidade" required error={errors.cidade}>
              <Input
                value={editando?.values.cidade ?? ""}
                onChange={(e) =>
                  setEditando((s) => (s ? { ...s, values: { ...s.values, cidade: e.target.value } } : s))
                }
                className="h-9"
              />
            </Field>
            <Field label="UF" required error={errors.estado}>
              <Input
                maxLength={2}
                value={editando?.values.estado ?? ""}
                onChange={(e) =>
                  setEditando((s) =>
                    s ? { ...s, values: { ...s.values, estado: e.target.value.toUpperCase() } } : s,
                  )
                }
                className="h-9"
              />
            </Field>
            <Field label="Polo">
              <Input
                value={editando?.values.polo ?? ""}
                onChange={(e) =>
                  setEditando((s) => (s ? { ...s, values: { ...s.values, polo: e.target.value } } : s))
                }
                className="h-9"
              />
            </Field>
            <Field label="Regional">
              <Input
                value={editando?.values.regional ?? ""}
                onChange={(e) =>
                  setEditando((s) => (s ? { ...s, values: { ...s.values, regional: e.target.value } } : s))
                }
                className="h-9"
              />
            </Field>
            <DialogFooter className="sm:col-span-2">
              <Button type="button" variant="outline" onClick={() => setEditando(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={salvar.isPending}>
                {salvar.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
