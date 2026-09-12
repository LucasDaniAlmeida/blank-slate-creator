/**
 * Regras de situação derivadas dos dados reais (o banco não possui coluna de
 * status para notificações — a situação vem das datas do processo).
 */

export type Situacao = "Em dia" | "Em andamento" | "Pendente" | "Atrasada";

const DIA = 86_400_000;

export type NotificacaoSituacaoInput = {
  data_abertura_protocolo_faturamento?: string | null;
  data_retirada_adequacao_pe?: string | null;
  data_verificacao_revelia?: string | null;
  protocolo_faturamento?: string | null;
  created_at?: string | null;
};

export function situacaoNotificacao(n: NotificacaoSituacaoInput): Situacao {
  if (n.data_abertura_protocolo_faturamento || n.protocolo_faturamento) return "Em dia";
  if (n.data_retirada_adequacao_pe) return "Em andamento";
  const referencia = n.data_verificacao_revelia ?? n.created_at;
  if (referencia) {
    const dias = (Date.now() - new Date(referencia).getTime()) / DIA;
    if (dias > 30) return "Atrasada";
    return "Em andamento";
  }
  return "Pendente";
}

export type ProjetoSituacaoInput = {
  data_inicio_cobranca?: string | null;
  data_resposta?: string | null;
  data_abertura?: string | null;
  data_fiscalizacao?: string | null;
  status_cobranca?: { nome: string } | null;
  status_fiscalizacao?: { nome: string } | null;
};

/** Projeto em atraso de cobrança: cobrança prevista/iniciada e ainda não concluída. */
export function projetoEmAtraso(p: ProjetoSituacaoInput): boolean {
  const cobranca = p.status_cobranca?.nome?.toLowerCase() ?? "";
  if (/cobrado|não se aplica|nao se aplica|cancelado/.test(cobranca)) return false;
  const referencia = p.data_inicio_cobranca ?? p.data_abertura;
  if (!referencia) return false;
  return (Date.now() - new Date(referencia).getTime()) / DIA > 30;
}

/** Pendência de fiscalização: status pendente/não iniciada ou sem data de fiscalização. */
export function projetoComPendencia(p: ProjetoSituacaoInput): boolean {
  const fisc = p.status_fiscalizacao?.nome?.toLowerCase() ?? "";
  if (/realizada|cancelada/.test(fisc)) return false;
  return /pendente|agendada|não iniciada|nao iniciada|andamento/.test(fisc) || !p.data_fiscalizacao;
}

export function projetoEmDia(p: ProjetoSituacaoInput): boolean {
  return !projetoEmAtraso(p) && !projetoComPendencia(p);
}

export function situacaoTone(s: Situacao) {
  switch (s) {
    case "Em dia":
      return "success" as const;
    case "Em andamento":
      return "primary" as const;
    case "Pendente":
      return "warning" as const;
    default:
      return "danger" as const;
  }
}
