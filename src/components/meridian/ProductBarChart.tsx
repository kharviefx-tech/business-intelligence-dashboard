import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatMoney } from "@/lib/finance";

export function ProductBarChart({ data, currency }: { data: { name: string; revenue: number }[]; currency: string }) {
  const rows = data.map((d) => ({ ...d, short: d.name.length > 22 ? `${d.name.slice(0, 20)}…` : d.name }));
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} tickFormatter={(v) => formatMoney(v, currency, true)} />
        <YAxis type="category" dataKey="short" width={140} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
        <Tooltip
          formatter={(v: number) => formatMoney(v, currency)}
          labelFormatter={(l) => rows.find((d) => d.short === l)?.name ?? String(l)}
          contentStyle={{ fontSize: 12, borderRadius: 6 }}
        />
        <Bar dataKey="revenue" name="Revenue" fill="var(--color-chart-1)" radius={[0, 3, 3, 0]} maxBarSize={22} />
      </BarChart>
    </ResponsiveContainer>
  );
}
