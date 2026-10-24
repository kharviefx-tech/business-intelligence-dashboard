import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatMoney } from "@/lib/finance";

const AXIS = { fontSize: 11, fill: "var(--color-muted-foreground)" } as const;
const GRID = "var(--color-border)";
const COLORS = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)", "var(--color-chart-5)"];

function TipRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="flex items-center gap-1.5 text-muted-foreground">
        <span className="h-2 w-2 rounded-full" style={{ background: color }} />
        {label}
      </span>
      <span className="tabular font-semibold text-foreground">{value}</span>
    </div>
  );
}

function Tip({ active, payload, label, currency = "NGN" }: { active?: boolean; payload?: { name?: string; value?: number; color?: string; dataKey?: string }[]; label?: string; currency?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="min-w-[170px] rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="mb-1.5 font-semibold text-foreground">{label}</p>
      <div className="space-y-1">
        {payload.map((p) => (
          <TipRow key={p.dataKey} label={String(p.name)} value={formatMoney(p.value ?? 0, currency)} color={p.color ?? COLORS[0]} />
        ))}
      </div>
    </div>
  );
}

export function RevenueExpenseChart({ data, currency }: { data: { label: string; revenue: number; expenses: number }[]; currency: string }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
        <defs>
          <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.25} />
            <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
        <XAxis dataKey="label" tick={AXIS} axisLine={false} tickLine={false} />
        <YAxis tick={AXIS} axisLine={false} tickLine={false} tickFormatter={(v) => formatMoney(v, currency, true)} width={54} />
        <Tooltip content={<Tip currency={currency} />} />
        <Area type="monotone" dataKey="revenue" name="Revenue" stroke="var(--color-chart-1)" strokeWidth={2} fill="url(#revFill)" />
        <Area type="monotone" dataKey="expenses" name="Expenses" stroke="var(--color-chart-4)" strokeWidth={2} strokeDasharray="4 3" fill="transparent" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function ProfitTrendChart({ data, currency }: { data: { label: string; profit: number }[]; currency: string }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
        <XAxis dataKey="label" tick={AXIS} axisLine={false} tickLine={false} />
        <YAxis tick={AXIS} axisLine={false} tickLine={false} tickFormatter={(v) => formatMoney(v, currency, true)} width={54} />
        <Tooltip content={<Tip currency={currency} />} />
        <Line type="monotone" dataKey="profit" name="Net profit" stroke="var(--color-chart-3)" strokeWidth={2.5} dot={{ r: 2.5, strokeWidth: 0, fill: "var(--color-chart-3)" }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function SalesBarChart({ data, currency }: { data: { label: string; salesValue: number }[]; currency: string }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
        <XAxis dataKey="label" tick={AXIS} axisLine={false} tickLine={false} />
        <YAxis tick={AXIS} axisLine={false} tickLine={false} tickFormatter={(v) => formatMoney(v, currency, true)} width={54} />
        <Tooltip content={<Tip currency={currency} />} cursor={{ fill: "var(--color-muted)", opacity: 0.5 }} />
        <Bar dataKey="salesValue" name="Sales value" fill="var(--color-chart-1)" radius={[3, 3, 0, 0]} maxBarSize={38} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TargetChart({ data, currency }: { data: { label: string; revenue: number; target: number }[]; currency: string }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
        <XAxis dataKey="label" tick={AXIS} axisLine={false} tickLine={false} />
        <YAxis tick={AXIS} axisLine={false} tickLine={false} tickFormatter={(v) => formatMoney(v, currency, true)} width={54} />
        <Tooltip content={<Tip currency={currency} />} cursor={{ fill: "var(--color-muted)", opacity: 0.5 }} />
        <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={7} />
        <Bar dataKey="revenue" name="Actual" fill="var(--color-chart-1)" radius={[3, 3, 0, 0]} maxBarSize={26} />
        <Bar dataKey="target" name="Target" fill="var(--color-chart-2)" fillOpacity={0.35} radius={[3, 3, 0, 0]} maxBarSize={26} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CustomerChart({ data }: { data: { label: string; customers: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
        <XAxis dataKey="label" tick={AXIS} axisLine={false} tickLine={false} />
        <YAxis tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} width={36} />
        <Tooltip formatter={(v: number) => [`${v} new`, "Customers"]} contentStyle={{ fontSize: 12, borderRadius: 6 }} />
        <Bar dataKey="customers" name="New customers" fill="var(--color-chart-2)" radius={[3, 3, 0, 0]} maxBarSize={26} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CategoryDonut({ data, currency }: { data: { name: string; value: number }[]; currency: string }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <ResponsiveContainer width="100%" height={180} className="max-w-[200px]">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={46} outerRadius={74} paddingAngle={2} strokeWidth={0}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(v: number, n: string) => [formatMoney(v, currency), n]} contentStyle={{ fontSize: 12, borderRadius: 6 }} />
        </PieChart>
      </ResponsiveContainer>
      <ul className="flex-1 space-y-1.5">
        {data.map((d, i) => (
          <li key={d.name} className="flex items-center justify-between gap-2 text-xs">
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
              <span className="truncate text-muted-foreground">{d.name}</span>
            </span>
            <span className="tabular shrink-0 font-medium">{formatMoney(d.value, currency, true)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
