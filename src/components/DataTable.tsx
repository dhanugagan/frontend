import { ReactNode } from "react";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsUpDown } from "lucide-react";
import { Button } from "./Button";

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  sortKey?: string;
  className?: string;
  align?: "right";
}

interface Props<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  onRowClick?: (row: T) => void;
  selectedKey?: string | number | null;
  sort?: { key: string; order: "asc" | "desc" };
  onSort?: (key: string) => void;
  caption: string;
  loading?: boolean;
}

export function DataTable<T>({ columns, rows, rowKey, onRowClick, selectedKey, sort, onSort, caption, loading }: Props<T>) {
  return (
    <div className="overflow-x-auto">
      <table className={`w-full min-w-[640px] border-collapse ${loading ? "opacity-60" : ""}`} aria-busy={loading}>
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-white/[0.08] bg-ink-950/60">
            {columns.map((c) => {
              const active = sort && c.sortKey === sort.key;
              return (
                <th key={c.key} scope="col" className={`th ${c.align === "right" ? "text-right" : ""}`} aria-sort={active ? (sort!.order === "asc" ? "ascending" : "descending") : undefined}>
                  {c.sortKey && onSort ? (
                    <button type="button" onClick={() => onSort(c.sortKey!)} className="inline-flex items-center gap-1 whitespace-nowrap font-medium tracking-wide transition hover:text-cloud">
                      {c.header}
                      {active ? sort!.order === "asc" ? <ArrowUp className="h-3 w-3 text-brand-500" /> : <ArrowDown className="h-3 w-3 text-brand-500" /> : <ChevronsUpDown className="h-3 w-3 opacity-45" />}
                    </button>
                  ) : (
                    c.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.05]">
          {rows.map((r) => {
            const k = rowKey(r);
            const selected = selectedKey !== undefined && selectedKey !== null && selectedKey === k;
            return (
              <tr
                key={k}
                tabIndex={onRowClick ? 0 : undefined}
                onClick={() => onRowClick?.(r)}
                onKeyDown={(e) => onRowClick && (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onRowClick(r))}
                aria-selected={selected || undefined}
                className={`transition-colors duration-150 ${onRowClick ? "cursor-pointer hover:bg-brand-500/[0.05] focus-visible:outline-none focus-visible:bg-brand-500/[0.08]" : ""} ${selected ? "bg-brand-500/[0.11]" : ""}`}
              >
                {columns.map((c) => (
                  <td key={c.key} className={`td ${c.align === "right" ? "text-right" : ""} ${c.className ?? ""}`}>
                    {c.render(r)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function Pagination({ page, pages, total, pageSize, onPage, noun = "rows" }: { page: number; pages: number; total: number; pageSize: number; onPage: (p: number) => void; noun?: string }) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.07] px-4 py-3 text-xs text-silver">
      <span>
        <span className="num text-cloud">{from.toLocaleString()}–{to.toLocaleString()}</span> of <span className="num text-cloud">{total.toLocaleString()}</span> {noun}
      </span>
      <div className="flex items-center gap-1.5">
        <Button size="sm" variant="ghost" aria-label="Previous page" disabled={page <= 1} onClick={() => onPage(page - 1)} icon={<ChevronLeft className="h-4 w-4" />} />
        <span className="num px-1.5 text-cloud/85">Page {page} / {Math.max(1, pages)}</span>
        <Button size="sm" variant="ghost" aria-label="Next page" disabled={page >= pages} onClick={() => onPage(page + 1)} icon={<ChevronRight className="h-4 w-4" />} />
      </div>
    </nav>
  );
}
