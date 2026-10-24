import { useMemo, useState } from "react";
import { Download, Plus, Search } from "lucide-react";
import { useStore } from "@/lib/store";
import {
  downloadFile,
  formatDate,
  formatMoney,
  formatPct,
  inRange,
  previousRange,
  productPerformance,
  resolveRange,
  saleTotal,
  salesRevenue,
  toCsv,
  type DateRange,
} from "@/lib/finance";
import type { Sale, SaleStatus, TransactionStatus } from "@/lib/types";
import { PageHeader } from "./PageHeader";
import { DateRangePicker } from "./DateRangePicker";
import { KpiCard } from "./KpiCard";
import { ChartCard } from "./ChartCard";
import { ProductBarChart } from "./ProductBarChart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

const STATUS_BADGE: Record<SaleStatus, string> = {
  fulfilled: "bg-success/12 text-success border-success/25",
  pending: "bg-warning/15 text-warning-foreground border-warning/40",
  cancelled: "bg-muted text-muted-foreground border-border",
};
const PAY_BADGE: Record<TransactionStatus, string> = {
  paid: "bg-success/12 text-success border-success/25",
  partial: "bg-warning/15 text-warning-foreground border-warning/40",
  unpaid: "bg-destructive/10 text-destructive border-destructive/25",
};

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function SalesScreen() {
  const { dataset, can, addSale, updateSaleStatus } = useStore();
  const [range, setRange] = useState<DateRange>(() => resolveRange("year"));
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | SaleStatus>("all");
  const [open, setOpen] = useState(false);
  const currency = dataset.business.currency;

  const customerMap = useMemo(() => new Map(dataset.customers.map((c) => [c.id, c])), [dataset.customers]);
  const repMap = useMemo(() => new Map(dataset.employees.map((e) => [e.id, e])), [dataset.employees]);
  const prev = previousRange(range);

  const sales = dataset.sales.filter((s) => inRange(s.date, range));
  const active = sales.filter((s) => s.status !== "cancelled");
  const prevActive = dataset.sales.filter((s) => s.status !== "cancelled" && inRange(s.date, prev));
  const value = salesRevenue(active);
  const prevValue = salesRevenue(prevActive);
  const avgOrder = active.length ? value / active.length : 0;
  const prevAvg = prevActive.length ? prevValue / prevActive.length : 0;
  const unpaid = active.reduce((sum, s) => sum + Math.max(saleTotal(s) - s.amountPaid, 0), 0);

  const products = productPerformance(dataset, range);
  const target = dataset.targets.find((t) => t.month === new Date().toISOString().slice(0, 7));
  const thisMonthSales = dataset.sales.filter((s) => s.status !== "cancelled" && s.date.slice(0, 7) === new Date().toISOString().slice(0, 7));
  const monthHasTarget = target?.sales ?? 0;

  const byRep = dataset.employees
    .filter((e) => e.target > 0)
    .map((e) => {
      const repSales = active.filter((s) => s.salesRepId === e.id);
      const achieved = salesRevenue(repSales);
      return { ...e, achieved, count: repSales.length, attainment: e.target ? achieved / e.target : 0 };
    });

  const filtered = sales
    .filter((s) => (status === "all" ? true : s.status === status))
    .filter((s) => {
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      const customer = customerMap.get(s.customerId);
      const product = dataset.products.find((p) => p.id === s.lines[0]?.productId);
      return s.reference.toLowerCase().includes(q) || (customer?.company ?? "").toLowerCase().includes(q) || (product?.name ?? "").toLowerCase().includes(q);
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  const exportCsv = () => {
    const rows: (string | number)[][] = [
      ["Reference", "Date", "Customer", "Sales rep", "Product", "Qty", "Discount", "Tax", "Total", "Order status", "Payment", "Paid"],
      ...filtered.map((s) => {
        const line = s.lines[0];
        return [
          s.reference,
          s.date,
          customerMap.get(s.customerId)?.company ?? "",
          repMap.get(s.salesRepId)?.name ?? "",
          dataset.products.find((p) => p.id === line?.productId)?.name ?? "",
          line?.quantity ?? 0,
          line?.discount ?? 0,
          line?.tax ?? 0,
          saleTotal(s),
          s.status,
          s.paymentStatus,
          s.amountPaid,
        ];
      }),
    ];
    downloadFile(`meridian-sales-${range.from}-to-${range.to}.csv`, toCsv(rows));
    toast.success(`${filtered.length} orders exported`);
  };

  return (
    <div className="fv-rise">
      <PageHeader
        title="Sales & orders"
        description="Orders, product performance, team targets and payment status for every customer."
        actions={
          <>
            <DateRangePicker value={range} onChange={setRange} />
            {can("reports.export") && (
              <Button variant="outline" size="sm" onClick={exportCsv}>
                <Download className="mr-1.5 h-3.5 w-3.5" /> Export
              </Button>
            )}
            {can("sales.write") && (
              <Button size="sm" onClick={() => setOpen(true)}>
                <Plus className="mr-1.5 h-3.5 w-3.5" /> New order
              </Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="Sales value" value={value} delta={prevValue ? (value - prevValue) / prevValue : null} currency={currency} hint="Excludes cancelled orders" />
        <KpiCard label="Orders" value={active.length.toLocaleString()} money={false} delta={prevActive.length ? (active.length - prevActive.length) / prevActive.length : null} hint={`${active.filter((s) => s.status === "pending").length} awaiting fulfilment`} />
        <KpiCard label="Average order" value={avgOrder} delta={prevAvg ? (avgOrder - prevAvg) / prevAvg : null} currency={currency} />
        <KpiCard label="Unpaid order value" value={unpaid} currency={currency} invertDelta hint="Orders not fully settled" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <ChartCard className="xl:col-span-2" title="Product performance" description="Revenue by product for the selected period">
          <ProductBarChart data={products.slice(0, 7)} currency={currency} />
        </ChartCard>
        <ChartCard title="Order statuses" description="All orders in this period">
          <ul className="space-y-3">
            {(["fulfilled", "pending", "cancelled"] as SaleStatus[]).map((st) => {
              const count = sales.filter((s) => s.status === st).length;
              const share = sales.length ? count / sales.length : 0;
              return (
                <li key={st}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="capitalize text-muted-foreground">{st}</span>
                    <span className="tabular font-medium">{count} · {formatPct(share, 0)}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className={`h-full rounded-full ${st === "fulfilled" ? "bg-chart-3" : st === "pending" ? "bg-chart-4" : "bg-muted-foreground/40"}`} style={{ width: `${share * 100}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="mt-5 border-t border-border pt-3">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">This month against order target</p>
            <p className="tabular mt-1 font-display text-lg font-semibold">
              {thisMonthSales.length} <span className="text-sm font-normal text-muted-foreground">of {monthHasTarget} orders</span>
            </p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${monthHasTarget ? Math.min((thisMonthSales.length / monthHasTarget) * 100, 100) : 0}%` }} />
            </div>
          </div>
        </ChartCard>

        <ChartCard title="Team attainment" description="Revenue booked by sales rep vs target" className="xl:col-span-3">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {byRep.map((rep) => (
              <div key={rep.id} className="rounded-md border border-border p-3">
                <div className="flex items-baseline justify-between">
                  <div>
                    <p className="text-sm font-semibold">{rep.name}</p>
                    <p className="text-[11px] text-muted-foreground">{rep.count} orders</p>
                  </div>
                  <p className="tabular text-sm font-semibold">{formatPct(rep.attainment, 0)}</p>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                  <div className={`h-full rounded-full ${rep.attainment >= 1 ? "bg-success" : "bg-primary"}`} style={{ width: `${Math.min(rep.attainment * 100, 100)}%` }} />
                </div>
                <p className="tabular mt-1.5 text-[11px] text-muted-foreground">{formatMoney(rep.achieved, currency, true)} of {formatMoney(rep.target, currency, true)}</p>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      <div className="mt-5 rounded-lg border border-border bg-card">
        <div className="flex flex-col gap-2 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display text-sm font-semibold">Orders</h2>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search reference, customer, product" className="h-9 pl-8 text-xs sm:w-64" />
            </div>
            <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
              <SelectTrigger className="h-9 text-xs sm:w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="fulfilled">Fulfilled</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table className="min-w-[820px]">
            <TableHeader>
              <TableRow className="text-[11px] uppercase tracking-wide text-muted-foreground">
                <TableHead>Reference</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Rep</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Payment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.slice(0, 50).map((s) => {
                const line = s.lines[0];
                const product = dataset.products.find((p) => p.id === line?.productId);
                return (
                  <TableRow key={s.id}>
                    <TableCell className="tabular whitespace-nowrap font-medium">{s.reference}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{formatDate(s.date)}</TableCell>
                    <TableCell>
                      <p className="font-medium text-card-foreground">{customerMap.get(s.customerId)?.company}</p>
                      <p className="text-[11px] text-muted-foreground">{customerMap.get(s.customerId)?.name}</p>
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <p className="truncate">{product?.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        ×{line?.quantity} {line?.discount ? `· ${formatMoney(line.discount, currency, true)} off` : ""}
                      </p>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{repMap.get(s.salesRepId)?.name}</TableCell>
                    <TableCell className="tabular whitespace-nowrap text-right font-medium">{formatMoney(saleTotal(s), currency)}</TableCell>
                    <TableCell>
                      {can("sales.write") ? (
                        <Select value={s.status} onValueChange={(v) => { updateSaleStatus(s.id, v as SaleStatus); toast.success("Order status updated"); }}>
                          <SelectTrigger className={`h-7 w-[112px] border text-[11px] capitalize ${STATUS_BADGE[s.status]}`}><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fulfilled">Fulfilled</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant="outline" className={`capitalize ${STATUS_BADGE[s.status]}`}>{s.status}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] capitalize ${PAY_BADGE[s.paymentStatus]}`}>{s.paymentStatus}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
              {!filtered.length && (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">No orders match these filters.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {filtered.length > 50 && <p className="border-t border-border px-4 py-2 text-[11px] text-muted-foreground">Showing 50 of {filtered.length} orders.</p>}
      </div>

      <NewSaleDialog open={open} onOpenChange={setOpen} onCreate={(s) => { addSale(s); toast.success(`Order ${s.reference} recorded`); setOpen(false); }} />
    </div>
  );
}

function NewSaleDialog({ open, onOpenChange, onCreate }: { open: boolean; onOpenChange: (o: boolean) => void; onCreate: (s: Omit<Sale, "id">) => void }) {
  const { dataset } = useStore();
  const [customerId, setCustomerId] = useState("");
  const [productId, setProductId] = useState("");
  const [repId, setRepId] = useState(dataset.employees[1]?.id ?? "");
  const [quantity, setQuantity] = useState("1");
  const [discount, setDiscount] = useState("0");
  const [date, setDate] = useState(todayIso());
  const [paid, setPaid] = useState<TransactionStatus>("paid");

  const product = dataset.products.find((p) => p.id === productId);
  const qty = Math.max(1, Number(quantity) || 1);
  const gross = (product?.unitPrice ?? 0) * qty;
  const discountValue = Math.min(Number(discount) || 0, gross);
  const tax = Math.round((gross - discountValue) * 0.075);
  const total = gross - discountValue + tax;

  const submit = () => {
    if (!customerId || !productId) {
      toast.error("Choose a customer and a product.");
      return;
    }
    const s: Omit<Sale, "id"> = {
      reference: `MRD-${date.replace(/-/g, "").slice(0, 6)}-${String(dataset.sales.length + 1).padStart(3, "0")}`,
      date,
      customerId,
      salesRepId: repId,
      lines: [{ productId, quantity: qty, unitPrice: product?.unitPrice ?? 0, discount: discountValue, tax }],
      status: "pending",
      paymentStatus: paid,
      amountPaid: paid === "paid" ? total : paid === "partial" ? Math.round(total / 2) : 0,
    };
    onCreate(s);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New order</DialogTitle>
          <DialogDescription>Record a sale. Tax is applied at 7.5% on the discounted amount.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label className="text-xs">Customer</Label>
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
              <SelectContent>
                {dataset.customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.company} — {c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Product</Label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
              <SelectContent>
                {dataset.products.filter((p) => p.active).map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name} — {formatMoney(p.unitPrice, dataset.business.currency)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-1.5">
              <Label className="text-xs">Quantity</Label>
              <Input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">Discount</Label>
              <Input type="number" min="0" value={discount} onChange={(e) => setDiscount(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">Date</Label>
              <Input type="date" value={date} max={todayIso()} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label className="text-xs">Sales rep</Label>
              <Select value={repId} onValueChange={setRepId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {dataset.employees.filter((e) => e.target > 0).map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">Payment</Label>
              <Select value={paid} onValueChange={(v) => setPaid(v as TransactionStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="rounded-md bg-muted/60 p-3 text-xs">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="tabular">{formatMoney(gross, dataset.business.currency)}</span></div>
            <div className="mt-1 flex justify-between"><span className="text-muted-foreground">Discount</span><span className="tabular">−{formatMoney(discountValue, dataset.business.currency)}</span></div>
            <div className="mt-1 flex justify-between"><span className="text-muted-foreground">VAT 7.5%</span><span className="tabular">{formatMoney(tax, dataset.business.currency)}</span></div>
            <div className="mt-1.5 flex justify-between border-t border-border pt-1.5 font-semibold"><span>Total</span><span className="tabular">{formatMoney(total, dataset.business.currency)}</span></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit}>Record order</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
