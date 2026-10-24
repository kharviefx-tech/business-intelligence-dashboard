import { useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { useStore } from "@/lib/store";
import { cogsOf, expensesOf, formatMoney, formatPct, inRange, monthlySeries, productPerformance, resolveRange, revenueByCategory, revenueOf } from "@/lib/finance";
import { PageHeader } from "./PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const SUGGESTIONS = [
  "How much profit did we make this month?",
  "Which product generated the most revenue?",
  "Why did expenses increase?",
  "Which month had the highest revenue?",
  "What should we investigate in our costs?",
  "Summarise this month's performance",
];

export function AnalystScreen() {
  const { dataset } = useStore();
  const currency = dataset.business.currency;
  const [messages, setMessages] = useState<{ role: "user" | "analyst"; text: string; sources?: string[] }[]>([
    { role: "analyst", text: "Ask me about recorded revenue, expenses, margins, products or customers. I answer only from this workspace's data and cite the figures I used.", sources: [] },
  ]);
  const [input, setInput] = useState("");

  const answer = (question: string) => {
    const q = question.toLowerCase();
    const month = resolveRange("month");
    const tx = dataset.transactions.filter((t) => inRange(t.date, month));
    const prevTx = dataset.transactions.filter((t) => t.date >= "2000-01-01" && t.date < month.from && t.date >= prevMonthStart(month.from));
    const revenue = revenueOf(tx, dataset.categories);
    const expenses = expensesOf(tx, dataset.categories);
    const series = monthlySeries(dataset, 13);
    const thisMonth = series[series.length - 1];
    const lastMonth = series[series.length - 2];

    if (/profit|margin/.test(q)) {
      return { text: `This month revenue is ${formatMoney(revenue, currency)} and expenses ${formatMoney(expenses, currency)}, giving net profit of ${formatMoney(revenue - expenses, currency)} (${formatPct(revenue ? (revenue - expenses) / revenue : null, 1)} margin). Gross profit after cost of sales is ${formatMoney(revenue - cogsOf(tx, dataset.categories), currency)}.`, sources: ["transactions (current month)", "categories"] };
    }
    if (/product|best|most revenue/.test(q)) {
      const products = productPerformance(dataset, resolveRange("year"));
      const top = products[0];
      return { text: top ? `${top.name} leads with ${formatMoney(top.revenue, currency)} from ${top.units} units this year, at a ${formatPct(top.margin, 0)} gross margin. Second is ${products[1]?.name} at ${formatMoney(products[1]?.revenue ?? 0, currency)}.` : "No product sales recorded this year.", sources: ["sales", "products"] };
    }
    if (/expense|cost|increase|investigate/.test(q)) {
      const cats = dataset.categories.filter((c) => c.kind === "expense").map((c) => ({ name: c.name, value: tx.filter((t) => t.categoryId === c.id).reduce((s, t) => s + t.amount, 0) })).sort((a, b) => b.value - a.value);
      const prevCats = dataset.categories.filter((c) => c.kind === "expense").map((c) => ({ name: c.name, value: prevTx.filter((t) => t.categoryId === c.id).reduce((s, t) => s + t.amount, 0) }));
      const movers = cats.map((c) => ({ ...c, delta: c.value - (prevCats.find((p) => p.name === c.name)?.value ?? 0) })).sort((a, b) => b.delta - a.delta);
      const top = movers[0];
      return { text: `Total expenses are ${formatMoney(expenses, currency)} this month. ${top ? `${top.name} rose by ${formatMoney(top.delta, currency)} versus last month and is now ${formatMoney(top.value, currency)}.` : ""} Categories with the largest increase deserve receipts checked against approved budgets before month-end close.`, sources: ["transactions (current + previous month)", "budgets"] };
    }
    if (/highest|best month|which month/.test(q)) {
      const best = [...series].sort((a, b) => b.revenue - a.revenue)[0];
      return { text: `${best.label} had the highest revenue at ${formatMoney(best.revenue, currency)}, ahead of ${thisMonth.label} at ${formatMoney(thisMonth.revenue, currency)}. That month's profit was ${formatMoney(best.profit, currency)}.`, sources: ["transactions (13 months)"] };
    }
    if (/grow|growth|compare|versus|vs/.test(q)) {
      const delta = lastMonth.revenue ? (thisMonth.revenue - lastMonth.revenue) / lastMonth.revenue : null;
      return { text: `Revenue changed ${formatPct(delta)} from ${lastMonth.label} (${formatMoney(lastMonth.revenue, currency)}) to ${thisMonth.label} (${formatMoney(thisMonth.revenue, currency)}). Expenses moved ${formatPct(lastMonth.expenses ? (thisMonth.expenses - lastMonth.expenses) / lastMonth.expenses : null)} over the same window.`, sources: ["transactions (13 months)"] };
    }
    if (/customer|retention|churn/.test(q)) {
      const active = new Set(dataset.sales.filter((s) => s.status !== "cancelled" && s.date >= month.from).map((s) => s.customerId));
      return { text: `${active.size} of ${dataset.customers.length} customers placed an order this month, and ${dataset.customers.filter((c) => c.firstPurchase >= month.from).length} are new. Accounts tagged "at risk" last purchased more than 60 days ago.`, sources: ["sales", "customers"] };
    }
    if (/summar|overview|how are we|performance/.test(q)) {
      const streams = revenueByCategory(dataset, month);
      return { text: `This month: revenue ${formatMoney(revenue, currency)}, expenses ${formatMoney(expenses, currency)}, net profit ${formatMoney(revenue - expenses, currency)}. ${streams[0]?.name ?? "—"} is the largest stream at ${formatMoney(streams[0]?.value ?? 0, currency)}. ${dataset.sales.filter((s) => s.status !== "cancelled" && s.date >= month.from).length} orders were recorded and ${formatMoney(tx.filter((t) => t.amount > t.amountPaid).reduce((s, t) => s + t.amount - t.amountPaid, 0), currency)} remains outstanding on invoices.`, sources: ["transactions", "sales", "customers"] };
    }
    return { text: "I can answer questions about profit, expenses, revenue trends, products and customers using recorded data. Try one of the suggestions below. I will not guess figures that aren't in your records.", sources: [] };
  };

  const send = (text: string) => {
    if (!text.trim()) return;
    const reply = answer(text);
    setMessages((m) => [...m, { role: "user", text }, { role: "analyst", ...reply }]);
    setInput("");
  };

  return (
    <div className="fv-rise">
      <PageHeader title="AI analyst" description="Grounded answers computed from your own records. Nothing is invented: every reply names the tables it read." actions={<Badge variant="outline" className="border-success/40 bg-success/10 text-success">Grounded answers</Badge>} />
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="flex h-[560px] flex-col rounded-lg border border-border bg-card">
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-lg px-3.5 py-2.5 text-sm leading-relaxed ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-card-foreground"}`}>
                  {m.role === "analyst" && <Sparkles className="mb-1 h-3.5 w-3.5 text-primary" />}
                  <p>{m.text}</p>
                  {!!m.sources?.length && <p className="mt-1.5 text-[10px] uppercase tracking-wide opacity-60">Based on: {m.sources.join(" · ")}</p>}
                </div>
              </div>
            ))}
          </div>
          <form
            className="flex gap-2 border-t border-border p-3"
            onSubmit={(e) => { e.preventDefault(); send(input); }}
          >
            <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about profit, costs, products…" className="h-9 text-sm" />
            <Button type="submit" size="sm" className="h-9"><Send className="h-3.5 w-3.5" /></Button>
          </form>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Suggested questions</p>
          <div className="mt-2 space-y-1.5">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => send(s)} className="w-full rounded-md border border-border px-2.5 py-2 text-left text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-foreground">
                {s}
              </button>
            ))}
          </div>
          <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">Answers are computed in the app from recorded records. Models can be added later without changing the calculations.</p>
        </div>
      </div>
    </div>
  );
}

function prevMonthStart(currentMonthStart: string) {
  const d = new Date(`${currentMonthStart}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() - 1);
  return d.toISOString().slice(0, 10);
}
