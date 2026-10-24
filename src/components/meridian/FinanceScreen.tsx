import { useMemo, useState } from "react";
import { Download, Plus, Search, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import {
  cogsOf,
  computeKpis,
  downloadFile,
  expensesOf,
  formatDate,
  formatMoney,
  formatPct,
  inRange,
  monthlySeries,
  previousRange,
  resolveRange,
  revenueByCategory,
  toCsv,
  type DateRange,
} from "@/lib/finance";
import type { CategoryKind, PaymentMethod, Transaction, TransactionStatus } from "@/lib/types";
import { PageHeader } from "./PageHeader";
import { DateRangePicker } from "./DateRangePicker";
import { KpiCard } from "./KpiCard";
import { ChartCard } from "./ChartCard";
import { CategoryDonut, RevenueExpenseChart } from "./Charts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const METHOD_LABEL: Record<PaymentMethod, string> = { transfer: "Bank transfer", card: "Card", cash: "Cash", pos: "POS terminal", loan: "Loan" };
const STATUS_STYLE: Record<TransactionStatus, string> = {
  paid: "bg-success/12 text-success border-success/25",
  partial: "bg-warning/15 text-warning-foreground border-warning/40",
  unpaid: "bg-destructive/10 text-destructive border-destructive/25",
};

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function FinanceScreen() {
  const { dataset, can, addTransaction, deleteTransaction } = useStore();
  const [range, setRange] = useState<DateRange>(() => resolveRange("year"));
  const [tab, setTab] = useState<CategoryKind>("revenue");
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Transaction | null>(null);
  const currency = dataset.business.currency;
  const catMap = useMemo(() => new Map(dataset.categories.map((c) => [c.id, c])), [dataset.categories]);

  const { current: c, previous: p } = computeKpis(dataset, range, previousRange(range));
  const inPeriod = dataset.transactions.filter((t) => inRange(t.date, range));
  const revenueCats = revenueByCategory(dataset, range);
  const expenseCats = dataset.transactions
    .filter((t) => inRange(t.date, range) && catMap.get(t.categoryId)?.kind === "expense")
    .reduce<{ id: string; name: string; value: number }[]>((acc, t) => {
      const found = acc.find((a) => a.id === t.categoryId);
      if (found) found.value += t.amount;
      else acc.push({ id: t.categoryId, name: catMap.get(t.categoryId)?.name ?? t.categoryId, value: t.amount });
      return acc;
    }, [])
    .sort((a, b) => b.value - a.value);

  const grossProfit = c.revenue - cogsOf(inPeriod, dataset.categories);
  const grossMargin = c.revenue > 0 ? grossProfit / c.revenue : null;
  const netMargin = c.revenue > 0 ? (c.revenue - c.expenses) / c.revenue : null;
  const operating = expensesOf(inPeriod.filter((t) => catMap.get(t.categoryId)?.group !== "Cost of sales"), dataset.categories);

  const filtered = inPeriod
    .filter((t) => catMap.get(t.categoryId)?.kind === tab)
    .filter((t) => {
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return t.description.toLowerCase().includes(q) || t.vendorOrCustomer.toLowerCase().includes(q) || (catMap.get(t.categoryId)?.name ?? "").toLowerCase().includes(q);
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  const totals = {
    count: filtered.length,
    amount: filtered.reduce((s, t) => s + t.amount, 0),
    outstanding: filtered.reduce((s, t) => s + Math.max(t.amount - t.amountPaid, 0), 0),
  };

  const exportCsv = () => {
    const rows: (string | number)[][] = [
      ["Date", "Description", "Category", "Counterparty", "Method", "Status", "Amount", "Paid"],
      ...filtered.map((t) => [t.date, t.description, catMap.get(t.categoryId)?.name ?? "", t.vendorOrCustomer, METHOD_LABEL[t.method], t.status, t.amount, t.amountPaid]),
    ];
    downloadFile(`meridian-${tab}-${range.from}-to-${range.to}.csv`, toCsv(rows));
    toast.success(`${filtered.length} rows exported to CSV`);
  };

  return (
    <div className="fv-rise">
      <PageHeader
        title="Finance"
        description="Record income and expenses, monitor collections and review profitability for any period."
        actions={
          <>
            <DateRangePicker value={range} onChange={setRange} />
            <Button variant="outline" size="sm" onClick={exportCsv}>
              <Download className="mr-1.5 h-3.5 w-3.5" /> Export
            </Button>
            {can("finance.write") && (
              <Button size="sm" onClick={() => setDialogOpen(true)}>
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Record transaction
              </Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="Revenue" value={c.revenue} delta={p.revenue ? (c.revenue - p.revenue) / p.revenue : null} currency={currency} />
        <KpiCard label="Expenses" value={c.expenses} delta={p.expenses ? (c.expenses - p.expenses) / p.expenses : null} invertDelta currency={currency} />
        <KpiCard label="Gross margin" value={formatPct(grossMargin)} money={false} hint={`Gross profit ${formatMoney(grossProfit, currency, true)}`} />
        <KpiCard label="Net margin" value={formatPct(netMargin)} money={false} hint={`Net profit ${formatMoney(c.profit, currency, true)}`} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <ChartCard className="xl:col-span-2" title="Income vs spending" description="Monthly totals across the trailing year">
          <RevenueExpenseChart data={monthlySeries(dataset, 13)} currency={currency} />
        </ChartCard>
        <ChartCard title="Profit & loss" description={`${range.label} · unaudited`}>
          <dl className="space-y-2 text-sm">
            {[
              ["Revenue", c.revenue],
              ["Cost of sales", -cogsOf(inPeriod, dataset.categories)],
              ["Gross profit", grossProfit],
              ["Operating expenses", -operating],
              ["Net profit", c.profit],
            ].map(([label, value], i) => (
              <div key={label as string} className={`flex items-center justify-between ${i === 2 || i === 4 ? "border-t border-border pt-2 font-semibold" : ""}`}>
                <dt className="text-muted-foreground">{label}</dt>
                <dd className={`tabular ${(value as number) < 0 ? "text-destructive" : "text-card-foreground"}`}>{formatMoney(value as number, currency)}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 rounded-md bg-muted/60 p-3 text-[11px] leading-relaxed text-muted-foreground">
            Profit excludes loan disbursements, owner contributions and other capital inflows. Record those as <span className="font-medium text-foreground">Capital</span> categories so they never inflate revenue.
          </div>
        </ChartCard>
        <ChartCard title="Revenue streams" description="Income by category">
          <CategoryDonut data={revenueCats} currency={currency} />
        </ChartCard>
        <ChartCard title="Spend allocation" description="Expenses by category">
          <ul className="space-y-2.5">
            {expenseCats.map((e) => {
              const share = c.expenses > 0 ? e.value / c.expenses : 0;
              return (
                <li key={e.id}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-muted-foreground">{e.name}</span>
                    <span className="tabular font-medium">{formatMoney(e.value, currency, true)}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-chart-4" style={{ width: `${Math.max(share * 100, 1)}%` }} />
                  </div>
                </li>
              );
            })}
            {!expenseCats.length && <p className="py-6 text-center text-sm text-muted-foreground">No expenses recorded.</p>}
          </ul>
        </ChartCard>
        <ChartCard title="Collections" description="Cash status of income invoices">
          <div className="space-y-3">
            <div>
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-muted-foreground">Collected</span>
                <span className="tabular font-medium">{formatMoney(c.revenue - c.outstanding, currency, true)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-success" style={{ width: `${c.revenue ? ((c.revenue - c.outstanding) / c.revenue) * 100 : 0}%` }} />
              </div>
            </div>
            <div>
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-muted-foreground">Outstanding</span>
                <span className="tabular font-medium text-warning-foreground">{formatMoney(c.outstanding, currency, true)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-warning" style={{ width: `${c.revenue ? (c.outstanding / c.revenue) * 100 : 0}%` }} />
              </div>
            </div>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              {c.revenue > 0 ? `${formatPct(c.outstanding / c.revenue, 0)} of invoiced revenue is still uncollected for this period.` : "No income invoices in this period."}
            </p>
          </div>
        </ChartCard>
      </div>

      <div className="mt-5 rounded-lg border border-border bg-card">
        <Tabs value={tab} onValueChange={(v) => setTab(v as CategoryKind)}>
          <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
            <TabsList className="grid w-full grid-cols-2 sm:w-auto">
              <TabsTrigger value="revenue">Income</TabsTrigger>
              <TabsTrigger value="expense">Expenses</TabsTrigger>
            </TabsList>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search description, party, category" className="h-9 pl-8 text-xs" />
            </div>
          </div>
          <div className="flex flex-wrap gap-4 border-b border-border px-4 py-3 text-xs text-muted-foreground">
            <span>{totals.count} records</span>
            <span>Total <span className="tabular font-semibold text-foreground">{formatMoney(totals.amount, currency)}</span></span>
            {tab === "revenue" && <span>Uncollected <span className="tabular font-semibold text-warning-foreground">{formatMoney(totals.outstanding, currency)}</span></span>}
          </div>
          <TabsContent value={tab} className="m-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-2.5 font-medium">Date</th>
                    <th className="px-4 py-2.5 font-medium">Description</th>
                    <th className="px-4 py-2.5 font-medium">Category</th>
                    <th className="px-4 py-2.5 font-medium">Counterparty</th>
                    <th className="px-4 py-2.5 font-medium">Method</th>
                    <th className="px-4 py-2.5 text-right font-medium">Amount</th>
                    <th className="px-4 py-2.5 font-medium">Status</th>
                    {can("finance.write") && <th className="px-4 py-2.5" />}
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 60).map((t) => (
                    <tr key={t.id} className="border-b border-border/60 last:border-0 hover:bg-muted/40">
                      <td className="tabular whitespace-nowrap px-4 py-2.5 text-muted-foreground">{formatDate(t.date)}</td>
                      <td className="px-4 py-2.5">
                        <p className="font-medium text-card-foreground">{t.description}</p>
                        {t.note && <p className="text-[11px] text-muted-foreground">{t.note}</p>}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">{catMap.get(t.categoryId)?.name}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{t.vendorOrCustomer}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{METHOD_LABEL[t.method]}</td>
                      <td className={`tabular whitespace-nowrap px-4 py-2.5 text-right font-medium ${tab === "expense" ? "text-destructive" : ""}`}>
                        {tab === "expense" ? "−" : ""}{formatMoney(t.amount, currency)}
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge variant="outline" className={`text-[10px] capitalize ${STATUS_STYLE[t.status]}`}>{t.status}</Badge>
                      </td>
                      {can("finance.write") && (
                        <td className="px-4 py-2.5 text-right">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setPendingDelete(t)} aria-label="Delete transaction">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {!filtered.length && (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">
                        No {tab === "revenue" ? "income" : "expense"} records match this period and search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {filtered.length > 60 && <p className="border-t border-border px-4 py-2 text-[11px] text-muted-foreground">Showing the 60 most recent of {filtered.length} records — export for the full ledger.</p>}
          </TabsContent>
        </Tabs>
      </div>

      <TransactionDialog open={dialogOpen} onOpenChange={setDialogOpen} onSubmit={(t) => { addTransaction(t); toast.success("Transaction recorded"); setDialogOpen(false); }} />

      <Dialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete transaction?</DialogTitle>
            <DialogDescription>
              {pendingDelete ? `"${pendingDelete.description}" (${formatMoney(pendingDelete.amount, currency)}) will be removed from the ledger. This cannot be undone.` : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { if (pendingDelete) { deleteTransaction(pendingDelete.id); toast.success("Transaction deleted"); setPendingDelete(null); } }}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TransactionDialog({ open, onOpenChange, onSubmit }: { open: boolean; onOpenChange: (o: boolean) => void; onSubmit: (t: Omit<Transaction, "id" | "createdBy">) => void }) {
  const { dataset } = useStore();
  const [kind, setKind] = useState<CategoryKind>("revenue");
  const [form, setForm] = useState({
    date: todayIso(),
    description: "",
    categoryId: "",
    amount: "",
    method: "transfer" as PaymentMethod,
    status: "paid" as TransactionStatus,
    amountPaid: "",
    vendorOrCustomer: "",
    note: "",
  });

  const categories = dataset.categories.filter((c) => c.kind === kind);
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }));

  const submit = () => {
    const amount = Number(form.amount);
    if (!form.description.trim() || !form.categoryId || !(amount > 0)) {
      toast.error("Add a description, category and amount greater than zero.");
      return;
    }
    const paid = form.status === "paid" ? amount : form.status === "unpaid" ? 0 : Math.min(Number(form.amountPaid) || 0, amount);
    onSubmit({
      date: form.date,
      description: form.description.trim(),
      categoryId: form.categoryId,
      amount,
      method: form.method,
      status: form.status,
      amountPaid: paid,
      vendorOrCustomer: form.vendorOrCustomer.trim() || "—",
      note: form.note.trim() || undefined,
    });
    setForm({ ...form, description: "", amount: "", amountPaid: "", vendorOrCustomer: "", note: "" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Record a transaction</DialogTitle>
          <DialogDescription>Income and expenses feed straight into the dashboard, reports and profit figures.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-2">
            <Button variant={kind === "revenue" ? "default" : "outline"} size="sm" onClick={() => { setKind("revenue"); set("categoryId", ""); }}>Income</Button>
            <Button variant={kind === "expense" ? "default" : "outline"} size="sm" onClick={() => { setKind("expense"); set("categoryId", ""); }}>Expense</Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label className="text-xs">Date</Label>
              <Input type="date" value={form.date} max={todayIso()} onChange={(e) => set("date", e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">Amount ({dataset.business.currency})</Label>
              <Input type="number" min="0" step="0.01" placeholder="0" value={form.amount} onChange={(e) => set("amount", e.target.value)} />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Description</Label>
            <Input placeholder={kind === "revenue" ? "e.g. Consulting retainer — Q3" : "e.g. Cloud hosting — September"} value={form.description} onChange={(e) => set("description", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label className="text-xs">Category</Label>
              <Select value={form.categoryId} onValueChange={(v) => set("categoryId", v)}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">Method</Label>
              <Select value={form.method} onValueChange={(v) => set("method", v as PaymentMethod)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(METHOD_LABEL) as PaymentMethod[]).map((m) => <SelectItem key={m} value={m}>{METHOD_LABEL[m]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">{kind === "revenue" ? "Customer" : "Vendor"}</Label>
            <Input placeholder="Name" value={form.vendorOrCustomer} onChange={(e) => set("vendorOrCustomer", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label className="text-xs">Payment status</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v as TransactionStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Paid in full</SelectItem>
                  <SelectItem value="partial">Partially paid</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.status === "partial" && (
              <div className="grid gap-1.5">
                <Label className="text-xs">Amount received</Label>
                <Input type="number" min="0" placeholder="0" value={form.amountPaid} onChange={(e) => set("amountPaid", e.target.value)} />
              </div>
            )}
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Note (optional)</Label>
            <Textarea rows={2} placeholder="Reference, invoice number, memo…" value={form.note} onChange={(e) => set("note", e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit}>Save transaction</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
