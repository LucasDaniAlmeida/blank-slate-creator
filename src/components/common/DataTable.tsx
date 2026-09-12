import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function TableShell({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-card">
      <div className="max-w-full overflow-x-auto">
        <table className="w-full border-collapse text-sm">{children}</table>
      </div>
    </div>
  );
}

export function Th({
  children,
  sortKey,
  sort,
  onSort,
  className,
  align = "left",
}: {
  children: ReactNode;
  sortKey?: string;
  sort?: { key: string; asc: boolean };
  onSort?: (key: string) => void;
  className?: string;
  align?: "left" | "right" | "center";
}) {
  const active = sortKey && sort?.key === sortKey;
  const sortable = Boolean(sortKey && onSort);
  return (
    <th
      className={cn(
        "sticky top-0 z-10 bg-muted/60 px-3 py-2.5 text-[11px] font-semibold tracking-wide whitespace-nowrap text-muted-foreground uppercase",
        align === "right" && "text-right",
        align === "center" && "text-center",
        align === "left" && "text-left",
        sortable && "cursor-pointer select-none hover:text-foreground",
        className,
      )}
      onClick={sortable ? () => onSort!(sortKey!) : undefined}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {active ? (
          sort!.asc ? (
            <ChevronUp className="size-3" />
          ) : (
            <ChevronDown className="size-3" />
          )
        ) : null}
      </span>
    </th>
  );
}

export function Td({
  children,
  className,
  align = "left",
}: {
  children: ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
}) {
  return (
    <td
      className={cn(
        "px-3 py-2.5 align-middle text-foreground",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className,
      )}
    >
      {children}
    </td>
  );
}

export function Tr({
  children,
  onClick,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        "border-t border-border transition-colors hover:bg-accent/50",
        onClick && "cursor-pointer",
        className,
      )}
    >
      {children}
    </tr>
  );
}

export function Pagination({
  page,
  pageSize,
  total,
  onPage,
  itemLabel = "registros",
}: {
  page: number;
  pageSize: number;
  total: number;
  onPage: (page: number) => void;
  itemLabel?: string;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const first = total === 0 ? 0 : page * pageSize + 1;
  const last = Math.min(total, (page + 1) * pageSize);
  const window: number[] = [];
  for (let p = Math.max(0, page - 2); p < Math.min(pages, Math.max(0, page - 2) + 5); p += 1) {
    window.push(p);
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-3.5 py-2.5">
      <p className="text-xs text-muted-foreground">
        Mostrando <span className="tabular">{first}</span> a <span className="tabular">{last}</span> de{" "}
        <span className="tabular">{total}</span> {itemLabel}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="size-7"
          disabled={page === 0}
          onClick={() => onPage(page - 1)}
          aria-label="Página anterior"
        >
          <ChevronLeft className="size-3.5" />
        </Button>
        {window.map((p) => (
          <Button
            key={p}
            variant={p === page ? "default" : "outline"}
            size="icon"
            className="size-7 text-xs"
            onClick={() => onPage(p)}
          >
            {p + 1}
          </Button>
        ))}
        <Button
          variant="outline"
          size="icon"
          className="size-7"
          disabled={page >= pages - 1}
          onClick={() => onPage(page + 1)}
          aria-label="Próxima página"
        >
          <ChevronRight className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
