import { cn } from "@/lib/utils";

type Tone = "neutral" | "primary" | "success" | "warning" | "danger";

const toneClass: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground border-border",
  primary: "bg-primary-soft text-primary border-primary/20",
  success: "bg-success-soft text-success border-success/20",
  warning: "bg-warning-soft text-warning border-warning/25",
  danger: "bg-danger-soft text-danger border-danger/20",
};

/** Deriva o tom a partir do nome do status vindo do banco (sem hardcodar a lista). */
export function toneForStatus(nome?: string | null): Tone {
  if (!nome) return "neutral";
  const n = nome.toLowerCase();
  if (/(conclu|realizada|cobrado|em dia|ativ|iniciada)/.test(n)) return "success";
  if (/(andamento|agendada|negocia)/.test(n)) return "primary";
  if (/(pendente|aguard)/.test(n)) return "warning";
  if (/(atras|cancel|não realizada|nao realizada|inativ)/.test(n)) return "danger";
  return "neutral";
}

export function StatusBadge({
  label,
  tone,
  className,
}: {
  label?: string | null | undefined;
  tone?: Tone | undefined;
  className?: string | undefined;
}) {
  if (!label) return <span className="text-muted-foreground">—</span>;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        toneClass[tone ?? toneForStatus(label)],
        className,
      )}
    >
      {label}
    </span>
  );
}
