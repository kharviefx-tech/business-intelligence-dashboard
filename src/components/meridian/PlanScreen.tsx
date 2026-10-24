import { useState } from "react";
import { Check } from "lucide-react";
import { useStore } from "@/lib/store";
import { PageHeader } from "./PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

const PLANS = [
  { name: "Free", price: "₦0", records: 100, seats: 1, features: ["Overview dashboard", "100 transactions per month", "Basic charts", "2 report exports per month"] },
  { name: "Professional", price: "₦18,000", records: 2500, seats: 5, features: ["Advanced analytics", "Date & target comparisons", "Customer management", "Unlimited report exports"] },
  { name: "Business", price: "₦48,000", records: 20000, seats: 15, features: ["Team accounts & permissions", "Sales rep targets", "Budget tracking", "Audit log"] },
  { name: "Enterprise", price: "Custom", records: 1_000_000, seats: 200, features: ["Custom roles", "Multiple business units", "Priority support", "Data retention options"] },
];

export function PlanScreen() {
  const { dataset } = useStore();
  const [current, setCurrent] = useState(dataset.business.plan);
  const plan = PLANS.find((p) => p.name === current)!;
  const used = dataset.transactions.length;

  return (
    <div className="fv-rise">
      <PageHeader title="Plan & billing" description="Your subscription, usage limits and what each tier includes. Paid plans are not active yet — payment verification and entitlement checks are being tested first." />
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="grid gap-3 sm:grid-cols-2">
          {PLANS.map((p) => {
            const active = p.name === current;
            return (
              <div key={p.name} className={`rounded-lg border bg-card p-4 ${active ? "border-primary ring-1 ring-primary/20" : "border-border"}`}>
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-sm font-semibold">{p.name}</h2>
                  {active && <Badge className="text-[10px]">Current</Badge>}
                </div>
                <p className="mt-1 tabular font-display text-xl font-semibold">{p.price}<span className="text-xs font-normal text-muted-foreground">{p.price.startsWith("₦") && p.price !== "₦0" ? " /month" : ""}</span></p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">Up to {p.records.toLocaleString()} records · {p.seats} seat{p.seats > 1 ? "s" : ""}</p>
                <ul className="mt-3 space-y-1.5">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-1.5 text-xs text-muted-foreground"><Check className="mt-0.5 h-3 w-3 shrink-0 text-success" />{f}</li>
                  ))}
                </ul>
                <Button size="sm" variant={active ? "outline" : "secondary"} className="mt-4 w-full" disabled={active} onClick={() => toast.info(`Upgrading to ${p.name} requires a verified payment — not enabled in this demo.`)}>
                  {active ? "On this plan" : "Upgrade"}
                </Button>
              </div>
            );
          })}
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="font-display text-sm font-semibold">Usage this period</h2>
          <div className="mt-3 space-y-4">
            <div>
              <div className="mb-1 flex justify-between text-xs"><span className="text-muted-foreground">Records</span><span className="tabular">{used} / {plan.records}</span></div>
              <Progress value={Math.min((used / plan.records) * 100, 100)} className="h-1.5" />
            </div>
            <div>
              <div className="mb-1 flex justify-between text-xs"><span className="text-muted-foreground">Team seats</span><span className="tabular">2 / {plan.seats}</span></div>
              <Progress value={Math.min((2 / plan.seats) * 100, 100)} className="h-1.5" />
            </div>
            <div>
              <div className="mb-1 flex justify-between text-xs"><span className="text-muted-foreground">Report exports</span><span className="tabular">3 / {plan.name === "Free" ? 2 : "unlimited"}</span></div>
              <Progress value={60} className="h-1.5" />
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-4 w-full"
            onClick={() => {
              const next = current === "Professional" ? "Business" : "Professional";
              setCurrent(next);
              toast.success(`Switched to ${next} for testing — no payment was taken.`);
            }}
          >
            Simulate plan change
          </Button>
          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">Limits are a preview of backend entitlement rules. Real subscription billing with Paystack (naira) and Stripe (international) will follow once verification is tested.</p>
        </div>
      </div>
    </div>
  );
}
