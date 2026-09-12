import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type Tone = "neutral" | "primary" | "success" | "warning" | "danger";

const toneStyles: Record<Tone, { icon: string; value: string }> = {
  neutral: { icon: "bg-muted text-muted-foreground", value: "text-foreground" },
  primary: { icon: "bg-primary-soft text-primary", value: "text-foreground" },
  success: { icon: "bg-success-soft text-success", value: "text-foreground" },
  warning: { icon: "bg-warning-soft text-warning", value: "text-foreground" },
  danger: { icon: "bg-danger-soft text-danger", value: "text-foreground" },
};

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "neutral",
  compact = false,
  loading = false,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  tone?: Tone;
  compact?: boolean;
  loading?: boolean;
}) {
  const styles = toneStyles[tone];
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card shadow-card",
        compact ? "px-3.5 py-3" : "px-4 py-4",
      )}
    >
      <div className="flex items-start gap-3">
        {Icon ? (
          <span
            className={cn(
              "grid shrink-0 place-items-center rounded-md",
              compact ? "size-7" : "size-9",
              styles.icon,
            )}
          >
            <Icon className={compact ? "size-3.5" : "size-4"} />
          </span>
        ) : null}
        <div className="min-w-0">
          <p className="truncate text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p
            className={cn(
              "tabular font-semibold leading-tight",
              compact ? "text-xl" : "text-2xl",
              styles.value,
            )}
          >
            {loading ? "—" : value}
          </p>
          {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
        </div>
      </div>
    </div>
  );
}
