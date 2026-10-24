import { useMemo, useState } from "react";
import { Download, FileSpreadsheet, Printer } from "lucide-react";
import { useStore } from "@/lib/store";
import {
  cogsOf,
  downloadFile,
  expensesOf,
  formatDate,
  formatMoney,
  formatPct,
  inRange,
  monthlySeries,
  previousRange,
  productPerformance,
  resolveRange,
  revenueByCategory,
  revenueOf,
  saleTotal,
  salesRevenue,
  toCsv,
  type DateRange,
} from "@/lib/finance";
import { PageHeader } from "./PageHeader";
import { DateRangePicker } from "./DateRangePicker";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type ReportType =
  | "daily"
  | "weekly"
  | "monthly"
  | "quarterly"
  | "annual"
  | "pnl"
  | "revenue"
  | "expense"
  | "sales"
  | "customer"
  | "budget";

const REPORTS: { id: ReportType; name: string; group: string; blurb: string }[] = [
  { id: "daily", name: "Daily business summary", group: "Operational", blurb: "Today's income, spend and orders" },
  { id: "weekly", name: "Weekly performance", group: "Operational", blurb: "Last 7 days compared with the week before" },
  { id: "monthly", name: "Monthly financial report", group: "Financial", blurb: "Revenue, costs and profit for the month" },
  { id: "quarterly", name: "Quarterly report", group: "Financial", blurb: "Quarter-to-date figures with prior-quarter comparison" },
  { id: "annual", name: "Annual report", group: "Financial", blurb: "Year-to-date figures with monthly breakdown" },
  { id: "pnl", name: "Profit & loss summary", group: "Financial", blurb: "Gross and net profit with margin analysis" },
  { id: "revenue", name: "Revenue by stream", group: "Financial", blurb: "Income split by category" },
  { id: "expense", name: "Expense analysis", group: "Financial", blurb: "Spending by category with shares" },
  { id: "sales", name: "Sales performance", group: "Commercial", blurb: "Orders, value and product ranking" },
  { id: "customer", name: "Customer activity", group: "Commercial", blurb: "Acquisition, activity and top accounts" },
  { id: "budget", name: "Budget performance", group: "Financial", blurb: "Planned vs actual spend by category" },
];

export function ReportBuilder() {
  const { dataset, can } = useStore();
  const [type, setType] = useState<ReportType>("pnl");
  const [range, setRange] = useState<DateRange>(() => resolveRange("month"));
  const currency = dataset.business.currency;

  const report = useMemo(() => {
    const tx = dataset.transactions.filter((t) => inRange(t.date, range));
    const prevRange = previousRange(range);
    const prevTx = dataset.transactions.filter((t) => inRange(t.date, prevRange));
    const sales = dataset.sales.filter((s) => s.status !== "cancelled" && inRange(s.date, range));
    const prevSales = dataset.sales.filter((s) => s.status !== "cancelled" && inRange(s.date, prevRange));
    const revenue = revenueOf(tx, dataset.categories);
    const prevRevenue = revenueOf(prevTx, dataset.categories);
    const expenses = expensesOf(tx, dataset.categories);
    const cogs = cogsOf(tx, dataset.categories);

    const lines: { label: string; value: string; muted?: boolean; strong?: boolean }[] = [];
    let rows: (string | number)[][] = [];

    switch (type) {
      case "daily":
      case "weekly": {
        lines.push({ label: "Revenue", value: formatMoney(revenue, currency), strong: true }, { label: "Expenses", value: formatMoney(expenses, currency) }, { label: "Net profit", value: formatMoney(revenue - expenses, currency), strong: true }, { label: "Orders", value: String(sales.length) }, { label: "New customers", value: String(dataset.customers.filter((c) => inRange(c.firstPurchase, range)).length) });
        rows = [["Date", "Description", "Category", "Type", "Amount"], ...tx.map((t) => [t.date, t.description, dataset.categories.find((c) => c.id === t.categoryId)?.name ?? "", dataset.categories.find((c) => c.id === t.categoryId)?.kind ?? "", t.amount])];
        break;
      }
      case "monthly":
      case "quarterly":
      case "annual": {
        const months = monthlySeries(dataset, 13);
        lines.push({ label: "Revenue", value: formatMoney(revenue, currency), strong: true }, { label: "Expenses", value: formatMoney(expenses, currency) }, { label: "Net profit", value: formatMoney(revenue - expenses, currency), strong: true }, { label: "Revenue growth", value: formatPct(prevRevenue ? (revenue - prevRevenue) / prevRevenue : null) });
        rows = [["Month", "Revenue", "Expenses", "Profit", "Target"], ...months.map((m) => [m.label, m.revenue, m.expenses, m.profit, m.target])];
        break;
      }
      case "pnl": {
        lines.push(
          { label: "Revenue", value: formatMoney(revenue, currency) },
          { label: "Cost of sales", value: formatMoney(-cogs, currency), muted: true },
          { label: "Gross profit", value: formatMoney(revenue - cogs, currency), strong: true },
          { label: "Operating expenses", value: formatMoney(-(expenses - cogs), currency), muted: true },
          { label: "Net profit", value: formatMoney(revenue - expenses, currency), strong: true },
          { label: "Gross margin", value: formatPct(revenue ? (revenue - cogs) / revenue : null) },
          { label: "Net margin", value: formatPct(revenue ? (revenue - expenses) / revenue : null) },
        );
        rows = [["Line item", "Amount"], ["Revenue", revenue], ["Cost of sales", cogs], ["Gross profit", revenue - cogs], ["Operating expenses", expenses - cogs], ["Net profit", revenue - expenses]];
        break;
      }
      case "revenue": {
        const cats = revenueByCategory(dataset, range);
        lines.push({ label: "Total revenue", value: formatMoney(revenue, currency), strong: true }, { label: "Streams", value: String(cats.length) });
        rows = [["Category", "Revenue", "Share"], ...cats.map((c) => [c.name, c.value, revenue ? Math.round((c.value / revenue) * 100) + "%" : "0%"])];
        break;
      }
      case "expense": {
        const cats = dataset.categories.filter((c) => c.kind === "expense").map((c) => ({ name: c.name, value: tx.filter((t) => t.categoryId === c.id).reduce((s, t) => s + t.amount, 0) })).filter((c) => c.value > 0).sort((a, b) => b.value - a.value);
        lines.push({ label: "Total expenses", value: formatMoney(expenses, currency), strong: true }, { label: "Largest category", value: cats[0]?.name ?? "—" });
        rows = [["Category", "Amount", "Share"], ...cats.map((c) => [c.name, c.value, expenses ? Math.round((c.value / expenses) * 100) + "%" : "0%"])];
        break;
      }
      case "sales": {
        const products = productPerformance(dataset, range);
        lines.push({ label: "Sales value", value: formatMoney(salesRevenue(sales), currency), strong: true }, { label: "Orders", value: String(sales.length) }, { label: "Average order", value: formatMoney(sales.length ? salesRevenue(sales) / sales.length : 0, currency) });
        rows = [["Product", "Units", "Revenue", "Margin"], ...products.map((p) => [p.name, p.units, p.revenue, Math.round(p.margin * 100) + "%"])];
        break;
      }
      case "customer": {
        const newC = dataset.customers.filter((c) => inRange(c.firstPurchase, range));
        const spendMap = new Map<string, number>();
        sales.forEach((s) => spendMap.set(s.customerId, (spendMap.get(s.customerId) ?? 0) + saleTotal(s)));
        const top = [...spendMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
        lines.push({ label: "New customers", value: String(newC.length), strong: true }, { label: "Active customers", value: String(spendMap.size) }, { label: "Revenue from customers", value: formatMoney(salesRevenue(sales), currency) });
        rows = [["Customer", "Spend", "Orders"], ...top.map(([id, v]) => [dataset.customers.find((c) => c.id === id)?.company ?? id, v, sales.filter((s) => s.customerId === id).length])];
        break;
      }
      case "budget": {
        const budgets = dataset.budgets.filter((b) => b.period === range.from.slice(0, 7));
        const list = budgets.map((b) => {
          const actual = tx.filter((t) => t.categoryId === b.categoryId).reduce((s, t) => s + t.amount, 0);
          return { name: dataset.categories.find((c) => c.id === b.categoryId)?.name ?? b.categoryId, planned: b.planned, actual, variance: b.planned - actual };
        });
        lines.push({ label: "Budgeted", value: formatMoney(list.reduce((s, b) => s + b.planned, 0), currency), strong: true }, { label: "Actual", value: formatMoney(list.reduce((s, b) => s + b.actual, 0), currency) }, { label: "Variance", value: formatMoney(list.reduce((s, b) => s + b.variance, 0), currency) });
        rows = [["Category", "Planned", "Actual", "Variance"], ...list.map((b) => [b.name, b.planned, b.actual, b.variance])];
        break;
      }
    }
    const totalRowNote =
      type === "daily" || type === "weekly"
        ? `Compared with the previous period: revenue ${formatPct(prevRevenue ? (revenue - prevRevenue) / prevRevenue : null)}, orders ${prevSales.length} previously.`
        : `Previous period revenue was ${formatMoney(prevRevenue, currency)}.`;
    return { lines, rows, totalRowNote };
  }, [dataset, range, type, currency]);

  const meta = REPORTS.find((r) => r.id === type)!;

  const exportCsv = () => {
    downloadFile(`${type}-report-${range.from}-to-${range.to}.csv`, toCsv(report.rows));
    toast.success("CSV downloaded");
  };

  return (
    <div className="fv-rise">
      <PageHeader
        title="Reports"
        description="Build a report for any period, review it on screen, then download or print to PDF."
        actions={<DateRangePicker value={range} onChange={setRange} />}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
        <div className="no-print rounded-lg border border-border bg-card p-3">
          <p className="px-1 pb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Report type</p>
          <div className="space-y-3">
            {["Operational", "Financial", "Commercial"].map((group) => (
              <div key={group}>
                <p className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">{group}</p>
                <div className="space-y-0.5">
                  {REPORTS.filter((r) => r.group === group).map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setType(r.id)}
                      className={`w-full rounded-md px-2.5 py-1.5 text-left text-xs transition-colors ${type === r.id ? "bg-primary/10 font-semibold text-primary" : "text-muted-foreground hover:bg-muted"}`}
                    >
                      {r.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card">
          <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-lg font-semibold">{meta.name}</h2>
                <Badge variant="secondary" className="text-[10px]">{meta.group}</Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{dataset.business.legalName}</span> · {range.from} to {range.to} · generated {formatDate(new Date().toISOString().slice(0, 10))}
              </p>
            </div>
            <div className="flex gap-2 no-print">
              {can("reports.export") ? (
                <>
                  <Button variant="outline" size="sm" onClick={exportCsv}>
                    <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" /> CSV
                  </Button>
                  <Button size="sm" onClick={() => window.print()}>
                    <Printer className="mr-1.5 h-3.5 w-3.5" /> PDF
                  </Button>
                </>
              ) : (
                <span className="text-xs text-muted-foreground">Your role can review reports but not export them.</span>
              )}
            </div>
          </div>

          <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
            {report.lines.map((l) => (
              <div key={l.label} className={`rounded-md border border-border p-3 ${l.strong ? "bg-muted/50" : ""}`}>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{l.label}</p>
                <p className={`tabular mt-1 font-display text-lg ${l.muted ? "text-muted-foreground" : "font-semibold"}`}>{l.value}</p>
              </div>
            ))}
          </div>

          <div className="overflow-x-auto px-5 pb-2">
            <table className="w-full min-w-[420px] text-sm">
              <tbody>
                {report.rows.map((row, i) => (
                  <tr key={i} className={i === 0 ? "border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground" : "border-b border-border/60 last:border-0"}>
                    {row.map((cell, j) => (
                      <td key={j} className={`py-2 ${j === 0 ? (i === 0 ? "font-medium" : "font-medium text-card-foreground") : "tabular text-right"}`}>
                        {typeof cell === "number" && !Number.isInteger(row[1]) ? formatMoney(cell, currency) : typeof cell === "number" && i > 0 && j > 0 && String(cell).length > 3 ? formatMoney(cell, currency) : cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="border-t border-border px-5 py-3 text-[11px] leading-relaxed text-muted-foreground">
            {report.totalRowNote} Figures come from recorded transactions and orders only; capital inflows such as loans are excluded from revenue and profit. Cash-flow figures that rely on received amounts are estimates until payments reconcile to bank statements.
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground no-print">
        <Download className="h-3.5 w-3.5" />
        CSV opens directly in Excel and Google Sheets. Use the PDF button to save a print-ready copy of this report.
      </div>
    </div>
  );
}
