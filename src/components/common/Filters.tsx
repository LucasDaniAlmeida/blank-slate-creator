import { Search, X } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const ALL = "__all__";

export function FilterBar({
  children,
  onClear,
  canClear,
}: {
  children: ReactNode;
  onClear?: () => void;
  canClear?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card px-3.5 py-3 shadow-card">
      {children}
      {onClear ? (
        <Button
          variant="ghost"
          size="sm"
          className="h-9 text-muted-foreground"
          disabled={!canClear}
          onClick={onClear}
        >
          <X className="size-3.5" />
          Limpar filtros
        </Button>
      ) : null}
    </div>
  );
}

export function SearchField({
  value,
  onChange,
  placeholder = "Buscar...",
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative min-w-[220px] flex-1", className)}>
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 pl-8"
      />
    </div>
  );
}

export function FilterSelect({
  label,
  value,
  onChange,
  options,
  allLabel = "Todos",
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  allLabel?: string;
  className?: string;
}) {
  return (
    <div className={cn("min-w-[170px]", className)}>
      <label className="mb-1 block text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9 w-full bg-surface">
          <SelectValue placeholder={allLabel} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{allLabel}</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function DateRangeField({
  from,
  to,
  onFrom,
  onTo,
  label = "Período",
}: {
  from: string;
  to: string;
  onFrom: (v: string) => void;
  onTo: (v: string) => void;
  label?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <Input type="date" value={from} onChange={(e) => onFrom(e.target.value)} className="h-9 w-[140px]" />
        <span className="text-xs text-muted-foreground">até</span>
        <Input type="date" value={to} onChange={(e) => onTo(e.target.value)} className="h-9 w-[140px]" />
      </div>
    </div>
  );
}
