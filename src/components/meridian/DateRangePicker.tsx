import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { resolveRange, type DateRange, type RangeKey } from "@/lib/finance";

const OPTIONS: { key: RangeKey; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "7d", label: "Last 7 days" },
  { key: "month", label: "This month" },
  { key: "prevMonth", label: "Previous month" },
  { key: "year", label: "This year" },
  { key: "custom", label: "Custom range" },
];

export function DateRangePicker({ value, onChange }: { value: DateRange; onChange: (r: DateRange) => void }) {
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState(value.from);
  const [to, setTo] = useState(value.to);

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <Select
          value={value.key}
          onValueChange={(v) => {
            const key = v as RangeKey;
            if (key === "custom") {
              setOpen(true);
              setFrom(value.from);
              setTo(value.to);
            } else {
              setOpen(false);
              onChange(resolveRange(key));
            }
          }}
        >
          <SelectTrigger className="h-9 w-[160px] bg-card text-xs">
            <CalendarDays className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {OPTIONS.map((o) => (
              <SelectItem key={o.key} value={o.key} className="text-xs">
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="hidden text-[11px] text-muted-foreground md:inline">
          {value.key === "custom" ? `${value.from} → ${value.to}` : value.label}
        </span>
      </div>
      {open && (
        <div className="absolute right-0 top-11 z-20 w-[280px] rounded-lg border border-border bg-popover p-3 shadow-lg">
          <p className="mb-2 text-xs font-semibold">Custom period</p>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-[11px] text-muted-foreground">
              From
              <Input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className="mt-1 h-8 text-xs" />
            </label>
            <label className="text-[11px] text-muted-foreground">
              To
              <Input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} className="mt-1 h-8 text-xs" />
            </label>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                onChange({ key: "custom", from, to, label: `${from} → ${to}` });
                setOpen(false);
              }}
            >
              Apply
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
