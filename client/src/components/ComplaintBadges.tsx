import { cn } from "@/lib/utils";

export const STATUS_STYLES: Record<string, string> = {
  Pending: "bg-slate-100 text-slate-700 ring-slate-200",
  "Checked In": "bg-sky-50 text-sky-700 ring-sky-100",
  "In Progress": "bg-amber-50 text-amber-800 ring-amber-100",
  Resolved: "bg-emerald-50 text-emerald-700 ring-emerald-100",
};

export const PRIORITY_STYLES: Record<string, string> = {
  Low: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  Medium: "bg-amber-50 text-amber-800 ring-amber-100",
  High: "bg-rose-50 text-rose-700 ring-rose-100",
};

export function StatusPill({ status, className }: { status: string; className?: string }) {
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset", STATUS_STYLES[status] ?? STATUS_STYLES.Pending, className)}>{status}</span>;
}

export function PriorityPill({ priority, className }: { priority: string; className?: string }) {
  return <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset", PRIORITY_STYLES[priority] ?? PRIORITY_STYLES.Low, className)}><span className="h-1.5 w-1.5 rounded-full bg-current" />{priority}</span>;
}

export function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}
