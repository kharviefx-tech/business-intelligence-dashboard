import type { Category, Dataset, Sale, Transaction } from "./types";

export type RangeKey = "today" | "7d" | "month" | "prevMonth" | "year" | "custom";

export interface DateRange {
  key: RangeKey;
  from: string; // YYYY-MM-DD inclusive
  to: string; // YYYY-MM-DD inclusive
  label: string;
}

const DAY = 86_400_000;

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

function utcToday() {
  const n = new Date();
  return new Date(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()));
}

export function resolveRange(key: RangeKey, from?: string, to?: string): DateRange {
  const today = utcToday();
  const y = today.getUTCFullYear();
  const m = today.getUTCMonth();
  switch (key) {
    case "today":
      return { key, from: iso(today), to: iso(today), label: "Today" };
    case "7d":
      return { key, from: iso(new Date(today.getTime() - 6 * DAY)), to: iso(today), label: "Last 7 days" };
    case "prevMonth": {
      const start = new Date(Date.UTC(y, m - 1, 1));
      const end = new Date(Date.UTC(y, m, 0));
      return { key, from: iso(start), to: iso(end), label: start.toLocaleString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }) };
    }
    case "year":
      return { key, from: `${y}-01-01`, to: iso(today), label: `Year ${y}` };
    case "custom":
      return { key, from: from ?? `${y}-${String(m + 1).padStart(2, "0")}-01`, to: to ?? iso(today), label: "Custom period" };
    case "month":
    default:
      return { key: "month", from: `${y}-${String(m + 1).padStart(2, "0")}-01`, to: iso(today), label: today.toLocaleString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }) };
  }
}

export function previousRange(r: DateRange): { from: string; to: string } {
  const from = new Date(`${r.from}T00:00:00Z`);
  const to = new Date(`${r.to}T00:00:00Z`);
  const len = Math.round((to.getTime() - from.getTime()) / DAY) + 1;
  // Shift back by a whole number of months where the range is a full month.
  const isWholeMonth = from.getUTCDate() === 1 && to.getUTCDate() === new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth() + 1, 0)).getUTCDate();
  if (isWholeMonth) {
    const pf = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() - 1, 1));
    const pt = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), 0));
    return { from: iso(pf), to: iso(pt) };
  }
  return { from: iso(new Date(from.getTime() - len * DAY)), to: iso(new Date(from.getTime() - DAY)) };
}

export function inRange(date: string, r: { from: string; to: string }) {
  return date >= r.from && date <= r.to;
}

const catMap = (categories: Category[]) => new Map(categories.map((c) => [c.id, c]));

/** Revenue = income categories only. Capital (loans) is never revenue. */
export function revenueOf(transactions: Transaction[], categories: Category[]) {
  const map = catMap(categories);
  return transactions
    .filter((t) => map.get(t.categoryId)?.kind === "revenue")
    .reduce((sum, t) => sum + t.amount, 0);
}

export function expensesOf(transactions: Transaction[], categories: Category[]) {
  const map = catMap(categories);
  return transactions.filter((t) => map.get(t.categoryId)?.kind === "expense").reduce((sum, t) => sum + t.amount, 0);
}

export function cogsOf(transactions: Transaction[], categories: Category[]) {
  const map = catMap(categories);
  return transactions.filter((t) => map.get(t.categoryId)?.group === "Cost of sales").reduce((sum, t) => sum + t.amount, 0);
}

export function saleTotal(s: Sale) {
  return s.lines.reduce((sum, l) => sum + l.quantity * l.unitPrice - l.discount + l.tax, 0);
}

export function salesRevenue(sales: Sale[]) {
  return sales.filter((s) => s.status !== "cancelled").reduce((sum, s) => sum + saleTotal(s), 0);
}

export interface Kpis {
  revenue: number;
  expenses: number;
  profit: number;
  cashFlow: number;
  salesCount: number;
  salesValue: number;
  customers: number;
  newCustomers: number;
  outstanding: number;
  growth: number | null;
  margin: number | null;
}

export function computeKpis(ds: Dataset, range: { from: string; to: string }, prev: { from: string; to: string }): { current: Kpis; previous: Kpis } {
  const build = (r: { from: string; to: string }): Kpis => {
    const tx = ds.transactions.filter((t) => inRange(t.date, r));
    const revenue = revenueOf(tx, ds.categories);
    const expenses = expensesOf(tx, ds.categories);
    const capital = revenueOf(tx, ds.categories) * 0 + tx.filter((t) => catMap(ds.categories).get(t.categoryId)?.kind === "capital").reduce((s, t) => s + t.amount, 0);
    const received = tx.filter((t) => catMap(ds.categories).get(t.categoryId)?.kind === "revenue").reduce((s, t) => s + t.amountPaid, 0);
    const sales = ds.sales.filter((s) => s.status !== "cancelled" && inRange(s.date, r));
    const newCustomers = ds.customers.filter((c) => inRange(c.firstPurchase, r)).length;
    return {
      revenue,
      expenses,
      profit: revenue - expenses,
      cashFlow: received - expenses + capital,
      salesCount: sales.length,
      salesValue: salesRevenue(sales),
      customers: newCustomers,
      newCustomers,
      outstanding: tx.filter((t) => catMap(ds.categories).get(t.categoryId)?.kind === "revenue").reduce((s, t) => s + Math.max(t.amount - t.amountPaid, 0), 0),
      growth: null,
      margin: revenue > 0 ? (revenue - expenses) / revenue : null,
    };
  };
  const current = build(range);
  const previous = build(prev);
  current.growth = previous.revenue > 0 ? (current.revenue - previous.revenue) / previous.revenue : null;
  return { current, previous };
}

export function monthKey(date: string) {
  return date.slice(0, 7);
}

export function monthlySeries(ds: Dataset, count = 13) {
  const months: string[] = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    months.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  }
  return months.map((key) => {
    const tx = ds.transactions.filter((t) => monthKey(t.date) === key);
    const revenue = revenueOf(tx, ds.categories);
    const expenses = expensesOf(tx, ds.categories);
    const sales = ds.sales.filter((s) => s.status !== "cancelled" && monthKey(s.date) === key);
    const label = new Date(`${key}-01T00:00:00Z`).toLocaleString("en-GB", { month: "short", timeZone: "UTC" });
    const target = ds.targets.find((t) => t.month === key)?.revenue ?? 0;
    return {
      key,
      label,
      revenue,
      expenses,
      profit: revenue - expenses,
      sales: sales.length,
      salesValue: salesRevenue(sales),
      target,
      customers: ds.customers.filter((c) => monthKey(c.firstPurchase) === key).length,
    };
  });
}

export function revenueByCategory(ds: Dataset, r: { from: string; to: string }) {
  const map = catMap(ds.categories);
  const totals = new Map<string, number>();
  ds.transactions
    .filter((t) => inRange(t.date, r) && map.get(t.categoryId)?.kind === "revenue")
    .forEach((t) => totals.set(t.categoryId, (totals.get(t.categoryId) ?? 0) + t.amount));
  return [...totals.entries()]
    .map(([id, value]) => ({ name: map.get(id)?.name ?? id, value }))
    .sort((a, b) => b.value - a.value);
}

export function productPerformance(ds: Dataset, r: { from: string; to: string }) {
  const rows = new Map<string, { units: number; revenue: number; cost: number }>();
  ds.sales
    .filter((s) => s.status !== "cancelled" && inRange(s.date, r))
    .forEach((s) => {
      s.lines.forEach((l) => {
        const p = ds.products.find((pp) => pp.id === l.productId);
        if (!p) return;
        const cur = rows.get(p.id) ?? { units: 0, revenue: 0, cost: 0 };
        cur.units += l.quantity;
        cur.revenue += l.quantity * l.unitPrice - l.discount;
        cur.cost += l.quantity * p.unitCost;
        rows.set(p.id, cur);
      });
    });
  return [...rows.entries()]
    .map(([id, v]) => {
      const p = ds.products.find((pp) => pp.id === id)!;
      return { id, name: p.name, category: p.category, ...v, margin: v.revenue ? (v.revenue - v.cost) / v.revenue : 0 };
    })
    .sort((a, b) => b.revenue - a.revenue);
}

export function expenseBreakdown(ds: Dataset, r: { from: string; to: string }) {
  const map = catMap(ds.categories);
  const rows = new Map<string, number>();
  ds.transactions
    .filter((t) => inRange(t.date, r) && map.get(t.categoryId)?.kind === "expense")
    .forEach((t) => rows.set(t.categoryId, (rows.get(t.categoryId) ?? 0) + t.amount));
  return [...rows.entries()]
    .map(([id, value]) => ({ id, name: map.get(id)?.name ?? id, value }))
    .sort((a, b) => b.value - a.value);
}

export function formatMoney(amount: number, currency = "NGN", compact = false) {
  const symbol = currency === "NGN" ? "₦" : currency === "USD" ? "$" : currency === "GBP" ? "£" : currency + " ";
  if (compact) {
    const abs = Math.abs(amount);
    if (abs >= 1_000_000_000) return `${amount < 0 ? "-" : ""}${symbol}${(abs / 1_000_000_000).toFixed(1)}b`;
    if (abs >= 1_000_000) return `${amount < 0 ? "-" : ""}${symbol}${(abs / 1_000_000).toFixed(1)}m`;
    if (abs >= 10_000) return `${amount < 0 ? "-" : ""}${symbol}${Math.round(abs / 1000)}k`;
  }
  return `${amount < 0 ? "-" : ""}${symbol}${Math.abs(Math.round(amount)).toLocaleString("en-GB")}`;
}

export function formatPct(v: number | null, digits = 1) {
  if (v === null || !Number.isFinite(v)) return "—";
  return `${v > 0 ? "+" : ""}${(v * 100).toFixed(digits)}%`;
}

export function formatDate(d: string) {
  return new Date(`${d}T00:00:00Z`).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
}

export function toCsv(rows: (string | number)[][]) {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const s = String(cell ?? "");
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(","),
    )
    .join("\n");
}

export function downloadFile(filename: string, content: string, type = "text/csv;charset=utf-8") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
