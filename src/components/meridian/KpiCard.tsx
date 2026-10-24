import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatMoney, formatPct } from "@/lib/finance";

interface Props {
  label: string;
  value: number | string;
  delta?: number | null;
  money?: boolean;
  hint?: string;
  invertDelta?: boolean;
  currency?: string;
}

export function KpiCard({ label, value, delta, money = true, hint, invertDelta = false, currency = "NGN" }: Props) {
  const positive = delta !== null && delta !== undefined && delta > 0;
  const negative = delta !== null && delta !== undefined && delta < 0;
  const good = invertDelta ? negative : positive;
  const bad = invertDelta ? positive : negative;

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-[0_1px_2px_rgb(0_0_0/0.03)]">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="tabular mt-2 font-display text-xl font-semibold leading-tight text-card-foreground sm:text-2xl">
        {money && typeof value === "number" ? formatMoney(value, currency) : value}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {delta !== null && delta !== undefined ? (
          <span
            className={cn(
              "tabular inline-flex items-center gap-0.5 rounded-sm px-1.5 py-0.5 text-[11px] font-semibold",
              good && "bg-success/12 text-success",
              bad && "bg-destructive/12 text-destructive",
              !good && !bad && "bg-muted text-muted-foreground",
            )}
          >
            {positive ? <ArrowUpRight className="h-3 w-3" /> : negative ? <ArrowDownRight className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
            {formatPct(delta)}
          </span>
        ) : (
          <span className="text-[11px] text-muted-foreground">No prior period</span>
        )}
        <span className="text-[11px] text-muted-foreground">vs previous period</span>
      </div>
      {hint && <p className="mt-2 text-[11px] leading-snug text-muted-foreground">{hint}</p>}
    </div>
  );
}
