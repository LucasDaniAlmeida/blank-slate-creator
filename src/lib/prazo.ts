/**
 * Apresentação do prazo de atualização no SIGUM.
 *
 * O cálculo de `dias_para_vencimento` é feito no banco. Aqui apenas formatamos
 * o valor retornado — nenhuma regra de prazo é recalculada no frontend.
 */

export type PrazoTone = "neutral" | "primary" | "success" | "warning" | "danger";

export type PrazoInfo = {
  label: string;
  tone: PrazoTone;
  /** Vencidos há mais tempo recebem ênfase um pouco maior. */
  strong: boolean;
};

/** Status de cobrança que indicam fluxo encerrado (não há mais prazo a cobrar). */
export function projetoConcluido(statusCobranca?: string | null): boolean {
  if (!statusCobranca) return false;
  return /(atualizado|cobrado|conclu|não se aplica|nao se aplica|cancel)/i.test(statusCobranca);
}

export function prazoInfo(
  dias: number | null | undefined,
  statusCobranca?: string | null,
): PrazoInfo | null {
  if (projetoConcluido(statusCobranca)) {
    return { label: "Concluído", tone: "success", strong: false };
  }
  if (dias == null || Number.isNaN(dias)) return null;

  if (dias < 0) {
    const atraso = Math.abs(dias);
    return {
      label: `Vencido há ${atraso} ${atraso === 1 ? "dia" : "dias"}`,
      tone: "danger",
      strong: atraso >= 5,
    };
  }
  if (dias === 0) return { label: "Vence hoje", tone: "warning", strong: true };
  if (dias === 1) return { label: "Vence amanhã", tone: "warning", strong: false };
  if (dias <= 5) return { label: `${dias} dias restantes`, tone: "primary", strong: false };
  return { label: `${dias} dias restantes`, tone: "neutral", strong: false };
}
