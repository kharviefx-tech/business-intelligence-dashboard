import { useMemo, useState } from "react";
import { Download, Search, Users } from "lucide-react";
import { useStore } from "@/lib/store";
import { downloadFile, formatDate, formatMoney, inRange, resolveRange, saleTotal, toCsv, type DateRange } from "@/lib/finance";
import type { Customer } from "@/lib/types";
import { PageHeader } from "./PageHeader";
import { DateRangePicker } from "./DateRangePicker";
import { KpiCard } from "./KpiCard";
import { ChartCard } from "./ChartCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

const SEGMENTS = ["Retail", "Wholesale", "Corporate", "Distributor"] as const;

export function CustomersScreen() {
  const { dataset, can } = useStore();
  const [range, setRange] = useState<DateRange>(() => resolveRange("year"));
  const [query, setQuery] = useState("");
  const [segment, setSegment] = useState<"all" | Customer["segment"]>("all");
  const [selected, setSelected] = useState<Customer | null>(null);
  const currency = dataset.business.currency;

  const stats = useMemo(() => {
    const map = new Map<string, { spend: number; orders: number; last: string; first: string }>();
    dataset.sales
      .filter((s) => s.status !== "cancelled")
      .forEach((s) => {
        const cur = map.get(s.customerId) ?? { spend: 0, orders: 0, last: "", first: s.date };
        cur.spend += saleTotal(s);
        cur.orders += 1;
        if (s.date > cur.last) cur.last = s.date;
        if (s.date < cur.first) cur.first = s.date;
        map.set(s.customerId, cur);
      });
    return dataset.customers.map((c) => {
      const inPeriod = dataset.sales.filter((s) => s.status !== "cancelled" && s.customerId === c.id && inRange(s.date, range));
      return {
        ...c,
        spend: map.get(c.id)?.spend ?? 0,
        orders: map.get(c.id)?.orders ?? 0,
        lastOrder: map.get(c.id)?.last ?? c.lastPurchase,
        periodSpend: inPeriod.reduce((sum, s) => sum + saleTotal(s), 0),
        periodOrders: inPeriod.length,
        repeat: (map.get(c.id)?.orders ?? 0) > 1,
      };
    });
  }, [dataset, range]);

  const filtered = stats
    .filter((c) => segment === "all" || c.segment === segment)
    .filter((c) => {
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return c.name.toLowerCase().includes(q) || c.company.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
    })
    .sort((a, b) => b.periodSpend - a.periodSpend);

  const newInPeriod = stats.filter((c) => inRange(c.firstPurchase, range)).length;
  const activeInPeriod = stats.filter((c) => c.periodOrders > 0).length;
  const repeatRate = stats.length ? stats.filter((c) => c.repeat).length / stats.length : 0;
  const totalSpend = stats.reduce((s, c) => s + c.periodSpend, 0);
  const avgValue = stats.length ? totalSpend / stats.length : 0;
  const retention = stats.length ? activeInPeriod / stats.length : 0;

  const segmentData = SEGMENTS.map((sg) => ({ sg, count: stats.filter((c) => c.segment === sg).length, spend: stats.filter((c) => c.segment === sg).reduce((s, c) => s + c.periodSpend, 0) }));

  const exportCsv = () => {
    const rows: (string | number)[][] = [
      ["Name", "Company", "Segment", "Email", "Phone", "First purchase", "Last purchase", "Orders", "Lifetime spend", "Spend in period"],
      ...filtered.map((c) => [c.name, c.company, c.segment, c.email, c.phone, c.firstPurchase, c.lastOrder, c.orders, c.spend, c.periodSpend]),
    ];
    downloadFile(`meridian-customers-${range.from}-to-${range.to}.csv`, toCsv(rows));
    toast.success(`${filtered.length} customer records exported`);
  };

  const customerSales = selected ? dataset.sales.filter((s) => s.customerId === selected.id).sort((a, b) => (a.date < b.date ? 1 : -1)) : [];

  return (
    <div className="fv-rise">
      <PageHeader
        title="Customers"
        description="Contact details, activity and lifetime value for every account. Access is limited to your organisation's records."
        actions={
          <>
            <DateRangePicker value={range} onChange={setRange} />
            {can("customers.write") && (
              <Button variant="outline" size="sm" onClick={exportCsv}>
                <Download className="mr-1.5 h-3.5 w-3.5" /> Export
              </Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="Total customers" value={stats.length} money={false} delta={null} hint={`${newInPeriod} acquired in this period`} />
        <KpiCard label="Active in period" value={activeInPeriod} money={false} delta={null} hint={`${Math.round(retention * 100)}% of book`} />
        <KpiCard label="Repeat customers" value={`${Math.round(repeatRate * 100)}%`} money={false} delta={null} hint="Two or more orders" />
        <KpiCard label="Average value" value={avgValue} delta={null} currency={currency} hint="Spend per customer in period" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard title="Segments" description="Customer count and spend by segment" className="lg:col-span-2">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[380px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="pb-2 font-medium">Segment</th>
                  <th className="pb-2 text-right font-medium">Customers</th>
                  <th className="pb-2 text-right font-medium">Spend in period</th>
                </tr>
              </thead>
              <tbody>
                {segmentData.map((s) => (
                  <tr key={s.sg} className="border-b border-border/60 last:border-0">
                    <td className="py-2.5 font-medium">{s.sg}</td>
                    <td className="tabular py-2.5 text-right">{s.count}</td>
                    <td className="tabular py-2.5 text-right">{formatMoney(s.spend, currency, true)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>
        <ChartCard title="Top accounts" description="Highest spend in this period">
          <ol className="space-y-2.5">
            {[...stats].sort((a, b) => b.periodSpend - a.periodSpend).slice(0, 5).map((c, i) => (
              <li key={c.id} className="flex items-center gap-2.5">
                <span className="tabular flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium">{c.company}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{c.name}</p>
                </div>
                <span className="tabular shrink-0 text-xs font-semibold">{formatMoney(c.periodSpend, currency, true)}</span>
              </li>
            ))}
          </ol>
        </ChartCard>
      </div>

      <div className="mt-5 rounded-lg border border-border bg-card">
        <div className="flex flex-col gap-2 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="flex items-center gap-1.5 font-display text-sm font-semibold"><Users className="h-4 w-4 text-primary" /> Customer book</h2>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, company, email" className="h-9 pl-8 text-xs sm:w-64" />
            </div>
            <Select value={segment} onValueChange={(v) => setSegment(v as typeof segment)}>
              <SelectTrigger className="h-9 text-xs sm:w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All segments</SelectItem>
                {SEGMENTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table className="min-w-[720px]">
            <TableHeader>
              <TableRow className="text-[11px] uppercase tracking-wide text-muted-foreground">
                <TableHead>Customer</TableHead>
                <TableHead>Segment</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Period spend</TableHead>
                <TableHead>Last order</TableHead>
                <TableHead>Tags</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id} className="cursor-pointer" onClick={() => setSelected(c)}>
                  <TableCell>
                    <p className="font-medium text-card-foreground">{c.company}</p>
                    <p className="text-[11px] text-muted-foreground">{c.name}</p>
                  </TableCell>
                  <TableCell><Badge variant="secondary" className="text-[10px] font-medium">{c.segment}</Badge></TableCell>
                  <TableCell>
                    <p className="text-xs">{c.email}</p>
                    <p className="text-[11px] text-muted-foreground">{c.phone}</p>
                  </TableCell>
                  <TableCell className="tabular text-right">{c.orders}</TableCell>
                  <TableCell className="tabular text-right font-medium">{formatMoney(c.periodSpend, currency)}</TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{formatDate(c.lastOrder)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {c.tags.map((t) => <span key={t} className="rounded-sm bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{t}</span>)}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!filtered.length && (
                <TableRow><TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">No customers match this search.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="font-display">{selected.company}</SheetTitle>
                <SheetDescription>{selected.name} · {selected.segment}</SheetDescription>
              </SheetHeader>
              <div className="mt-5 space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-md border border-border p-3">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Lifetime spend</p>
                    <p className="tabular mt-1 font-display text-lg font-semibold">{formatMoney(stats.find((c) => c.id === selected.id)?.spend ?? 0, currency)}</p>
                  </div>
                  <div className="rounded-md border border-border p-3">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Orders</p>
                    <p className="tabular mt-1 font-display text-lg font-semibold">{stats.find((c) => c.id === selected.id)?.orders ?? 0}</p>
                  </div>
                </div>
                <dl className="space-y-2">
                  <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Email</dt><dd className="truncate text-right">{selected.email}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Phone</dt><dd className="text-right">{selected.phone}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-muted-foreground">First purchase</dt><dd className="text-right">{formatDate(selected.firstPurchase)}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Last purchase</dt><dd className="text-right">{formatDate(stats.find((c) => c.id === selected.id)?.lastOrder ?? selected.lastPurchase)}</dd></div>
                </dl>
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Order history</p>
                  <div className="space-y-1.5">
                    {customerSales.slice(0, 6).map((s) => (
                      <div key={s.id} className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-xs">
                        <div>
                          <p className="font-medium">{s.reference}</p>
                          <p className="text-muted-foreground">{formatDate(s.date)} · {dataset.products.find((p) => p.id === s.lines[0]?.productId)?.name}</p>
                        </div>
                        <span className="tabular shrink-0 font-semibold">{formatMoney(saleTotal(s), currency, true)}</span>
                      </div>
                    ))}
                    {!customerSales.length && <p className="text-xs text-muted-foreground">No orders recorded.</p>}
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
