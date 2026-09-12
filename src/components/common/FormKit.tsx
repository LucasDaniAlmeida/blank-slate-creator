import type { ReactNode } from "react";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const NONE = "__none__";

export function FormCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-card shadow-card">
      <header className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        {description ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        ) : null}
      </header>
      <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
      {footer ? (
        <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-border px-4 py-3">
          {footer}
        </footer>
      ) : null}
    </section>
  );
}

export function Field({
  label,
  required,
  error,
  hint,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <Label className="mb-1.5 block text-xs font-medium">
        {label} {required ? <span className="text-danger">*</span> : null}
      </Label>
      {children}
      {error ? <p className="mt-1 text-xs text-danger">{error}</p> : null}
      {!error && hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function SelectField({
  value,
  onChange,
  options,
  placeholder = "Selecione...",
  allowEmpty = true,
  emptyLabel = "Não informado",
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  allowEmpty?: boolean;
  emptyLabel?: string;
  disabled?: boolean;
}) {
  return (
    <Select value={value || NONE} onValueChange={onChange} disabled={disabled ?? false}>
      <SelectTrigger className="h-9 w-full bg-surface">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {allowEmpty ? <SelectItem value={NONE}>{emptyLabel}</SelectItem> : null}
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function DetailGrid({ children }: { children: ReactNode }) {
  return <dl className="grid gap-x-6 gap-y-4 p-4 sm:grid-cols-2 lg:grid-cols-3">{children}</dl>;
}

export function DetailItem({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm break-words text-foreground">{children}</dd>
    </div>
  );
}
