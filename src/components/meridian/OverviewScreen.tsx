import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles } from "lucide-react";
import { useStore } from "@/lib/store";
import {
  computeKpis,
  expenseBreakdown,
  formatMoney,
  formatPct,
  monthlySeries,
  previousRange,
  productPerformance,
  resolveRange,
  revenueByCategory,
  type DateRange,
} from "@/lib/finance";
import { PageHeader } from "./PageHeader";
import { DateRangePicker } from "./DateRangePicker";
import { KpiCard } from "./KpiCard";
import { ChartCard } from "./ChartCard";
import { CategoryDonut, CustomerChart, ProfitTrendChart, RevenueExpenseChart, SalesBarChart, TargetChart } from "./Charts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function pctDelta(cur: number, prev: number) {
  return prev > 0 ? (cur - prev) / prev : null;
}

export function OverviewScreen() {
  const { dataset, can } = useStore();
  const [range, setRange] = useState<DateRange>(() => resolveRange("year"));
  const currency = dataset.business.currency;

  const model = useMemo(() => {
    const prev = previousRange(range);
    const { current, previous } = computeKpis(dataset, range, prev);
    const series = monthlySeries(dataset, 13);
    const cats = revenueByCategory(dataset, range);
    const expenses = expenseBreakdown(dataset, range);
    const products = productPerformance(dataset, range).slice(0, 5);
    const inPeriod = dataset.transactions.filter((t) => t.date >= range.from && t.date <= range.to);
    return { current, previous, series, cats, expenses, products, inPeriod, prev };
  }, [dataset, range]);

  const { current: c, previous: p } = model;
  const hasData = model.inPeriod.length > 0;
  const bestMonth = [...model.series].sort((a, b) => b.revenue - a.revenue)[0];
  const expenseTotal = c.expenses;
  const topExpense = model.expenses[0];

  const insight = useMemo(() => {
    const growth = p.revenue > 0 ? (c.revenue - p.revenue) / p.revenue : null;
    if (!hasData) return "No transactions recorded in this period yet.";
    const parts = [`Revenue is ${formatMoney(c.revenue, currency)} (${formatPct(growth)} vs the previous period).`];
    if (topExpense && expenseTotal > 0) parts.push(`${topExpense.name} is the largest cost at ${formatPct(topExpense.value / expenseTotal, 0)} of spending.`);
    if (c.profit < 0) parts.push("Costs exceeded revenue in this window — review discretionary spend.");
    else parts.push(`Net profit margin is ${formatPct(c.margin, 0)}.`);
    return parts.join(" ");
  }, [c, p, hasData, topExpense, expenseTotal, currency]);

  return (
    <div className="fv-rise">
      <PageHeader
        title="Business overview"
        description="Everything from recorded transactions and sales. Loans and capital inflows are excluded from revenue and profit."
        actions={<DateRangePicker value={range} onChange={setRange} />}
      />

      <div className="mb-5 flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Signals for {range.label}</p>
          <p className="mt-0.5 text-sm leading-relaxed text-card-foreground">{insight}</p>
        </div>
        {can("ai.use") && (
          <Button asChild variant="outline" size="sm" className="shrink-0">
            <Link to="/analyst">
              Ask the analyst <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="Total revenue" value={c.revenue} delta={pctDelta(c.revenue, p.revenue)} currency={currency} hint="Income categories only" />
        <KpiCard label="Total expenses" value={c.expenses} delta={pctDelta(c.expenses, p.expenses)} invertDelta currency={currency} hint="Operating + cost of sales" />
        <KpiCard label="Net profit" value={c.profit} delta={pctDelta(c.profit, p.profit)} currency={currency} hint="Revenue − expenses" />
        <KpiCard label="Cash flow" value={c.cashFlow} delta={pctDelta(c.cashFlow, p.cashFlow)} currency={currency} hint="Cash received − expenses (estimated)" />
        <KpiCard label="Sales orders" value={c.salesCount.toLocaleString()} delta={pctDelta(c.salesCount, p.salesCount)} money={false} hint={`${formatMoney(c.salesValue, currency, true)} order value`} />
        <KpiCard label="New customers" value={c.customers.toLocaleString()} delta={pctDelta(c.customers, p.customers)} money={false} hint={`${dataset.customers.length} active in total`} />
        <KpiCard label="Outstanding" value={c.outstanding} delta={pctDelta(c.outstanding, p.outstanding)} invertDelta currency={currency} hint="Unpaid income invoices" />
        <KpiCard label="Monthly growth" value={formatPct(c.growth)} delta={c.growth} money={false} hint="Revenue vs previous period" />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <ChartCard className="xl:col-span-2" title="Revenue and expenses" description="Recorded monthly totals over the last 13 months" action={<Badge variant="secondary" className="text-[10px]">Monthly</Badge>}>
          <RevenueExpenseChart data={model.series} currency={currency} />
        </ChartCard>
        <ChartCard title="Revenue mix" description={`Income by category, ${range.label.toLowerCase()}`}>
          {model.cats.length ? <CategoryDonut data={model.cats} currency={currency} /> : <p className="py-10 text-center text-sm text-muted-foreground">No income recorded.</p>}
        </ChartCard>

        <ChartCard title="Profit trend" description="Net profit per month after all expenses">
          <ProfitTrendChart data={model.series} currency={currency} />
        </ChartCard>
        <ChartCard title="Order value" description="Value of fulfilled and pending sales">
          <SalesBarChart data={model.series} currency={currency} />
        </ChartCard>
        <ChartCard title="Against target" description="Actual revenue vs monthly target">
          <TargetChart data={model.series.slice(-6)} currency={currency} />
        </ChartCard>

        <ChartCard title="Customer acquisition" description="First purchases per month" className="xl:col-span-1">
          <CustomerChart data={model.series} />
        </ChartCard>
        <ChartCard title="Top products" description={`Best sellers ${range.label.toLowerCase()}`} className="xl:col-span-2">
          {model.products.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[440px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                    <th className="pb-2 font-medium">Product</th>
                    <th className="pb-2 text-right font-medium">Units</th>
                    <th className="pb-2 text-right font-medium">Revenue</th>
                    <th className="pb-2 text-right font-medium">Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {model.products.map((prod) => (
                    <tr key={prod.id} className="border-b border-border/60 last:border-0">
                      <td className="py-2.5 pr-3">
                        <p className="font-medium text-card-foreground">{prod.name}</p>
                        <p className="text-[11px] text-muted-foreground">{prod.category}</p>
                      </td>
                      <td className="tabular py-2.5 text-right">{prod.units}</td>
                      <td className="tabular py-2.5 text-right font-medium">{formatMoney(prod.revenue, currency)}</td>
                      <td className="tabular py-2.5 text-right text-muted-foreground">{formatPct(prod.margin, 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">No sales in this period.</p>
          )}
        </ChartCard>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Monthly comparison" description="Revenue, expenses and profit for the last six months">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="pb-2 font-medium">Month</th>
                  <th className="pb-2 text-right font-medium">Revenue</th>
                  <th className="pb-2 text-right font-medium">Expenses</th>
                  <th className="pb-2 text-right font-medium">Profit</th>
                </tr>
              </thead>
              <tbody>
                {model.series.slice(-6).map((m) => (
                  <tr key={m.key} className="border-b border-border/60 last:border-0">
                    <td className="py-2 font-medium capitalize">{m.label}</td>
                    <td className="tabular py-2 text-right">{formatMoney(m.revenue, currency, true)}</td>
                    <td className="tabular py-2 text-right text-muted-foreground">{formatMoney(m.expenses, currency, true)}</td>
                    <td className={`tabular py-2 text-right font-medium ${m.profit < 0 ? "text-destructive" : ""}`}>{formatMoney(m.profit, currency, true)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>
        <ChartCard title="Where the money goes" description="Expense categories for the selected period">
          <ul className="space-y-3">
            {model.expenses.map((e) => {
              const share = expenseTotal > 0 ? e.value / expenseTotal : 0;
              return (
                <li key={e.id}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{e.name}</span>
                    <span className="tabular font-medium">{formatMoney(e.value, currency, true)} · {formatPct(share, 0)}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-chart-1" style={{ width: `${Math.max(share * 100, 1)}%` }} />
                  </div>
                </li>
              );
            })}
            {!model.expenses.length && <p className="py-6 text-center text-sm text-muted-foreground">No expenses in this period.</p>}
          </ul>
          <p className="mt-4 text-[11px] text-muted-foreground">
            Highest-revenue month: <span className="font-medium text-foreground capitalize">{bestMonth?.label}</span> at {formatMoney(bestMonth?.revenue ?? 0, currency, true)}.
          </p>
        </ChartCard>
      </div>
    </div>
  );
}
