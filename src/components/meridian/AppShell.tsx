import { Link, useRouterState } from "@tanstack/react-router";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  Activity,
  BarChart3,
  ChevronDown,
  CreditCard,
  FileText,
  LayoutDashboard,
  Menu,
  Moon,
  Receipt,
  ShieldCheck,
  Sparkles,
  Sun,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { ROLE_LABELS, StoreProvider, useStore, type Permission } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";

const NAV: { to: string; label: string; icon: typeof LayoutDashboard; permission?: Permission }[] = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/finance", label: "Finance", icon: Wallet, permission: "finance.view" },
  { to: "/sales", label: "Sales & orders", icon: Receipt, permission: "sales.view" },
  { to: "/customers", label: "Customers", icon: Users, permission: "customers.view" },
  { to: "/reports", label: "Reports", icon: FileText, permission: "finance.view" },
  { to: "/analyst", label: "AI analyst", icon: Sparkles, permission: "ai.use" },
  { to: "/admin", label: "Admin console", icon: ShieldCheck, permission: "admin.access" },
  { to: "/plan", label: "Plan & billing", icon: CreditCard },
];

function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => setDark(document.documentElement.classList.contains("dark")), []);
  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    window.localStorage.setItem("meridian.theme", next ? "dark" : "light");
  };
  return (
    <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle dark mode" className="h-9 w-9">
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { can, dataset } = useStore();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const visible = NAV.filter((item) => !item.permission || can(item.permission));

  return (
    <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
      <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Workspace</p>
      {visible.map((item) => {
        const active = pathname === item.to;
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
            )}
          >
            <Icon className={cn("h-4 w-4", active && "text-primary")} />
            {item.label}
          </Link>
        );
      })}
      <div className="mt-auto rounded-md border border-sidebar-border bg-muted/40 p-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
          <Activity className="h-3.5 w-3.5 text-primary" />
          {dataset.business.plan} plan
        </div>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {dataset.transactions.length.toLocaleString()} records · 2 of 5 team seats used
        </p>
        <Link to="/plan" onClick={onNavigate} className="mt-2 inline-block text-xs font-semibold text-primary hover:underline">
          View plan &amp; limits
        </Link>
      </div>
    </nav>
  );
}

function RoleSwitcher() {
  const { role, setRole } = useStore();
  return (
    <div className="flex items-center gap-2">
      <span className="hidden text-xs text-muted-foreground sm:inline">Viewing as</span>
      <Select value={role} onValueChange={(v) => setRole(v as Role)}>
        <SelectTrigger className="h-9 w-[176px] bg-card text-xs">
          <ShieldCheck className="mr-1 h-3.5 w-3.5 text-primary" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
            <SelectItem key={r} value={r} className="text-xs">
              {ROLE_LABELS[r]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/** Root layout shared by every route; each route passes its screen through context. */
export function ShellRoot({ View }: { View: () => ReactNode }) {
  return (
    <ScreenContext.Provider value={View}>
      <StoreProvider>
        <AppShell />
      </StoreProvider>
    </ScreenContext.Provider>
  );
}

function AppShell() {
  const [open, setOpen] = useState(false);
  const { dataset } = useStore();
  const View = useContext(ScreenContext);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => setOpen(false), [pathname]);

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <Link to="/" className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-5">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">M</span>
          <span>
            <span className="block font-display text-[15px] font-semibold leading-tight text-sidebar-foreground">Meridian</span>
            <span className="block text-[11px] leading-tight text-muted-foreground">Business intelligence</span>
          </span>
        </Link>
        <SidebarNav />
        <div className="border-t border-sidebar-border px-5 py-3 text-[11px] text-muted-foreground">
          {dataset.business.legalName}
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-foreground/40" onClick={() => setOpen(false)} />
          <div className="fv-rise absolute inset-y-0 left-0 flex w-72 flex-col bg-sidebar shadow-xl">
            <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
              <span className="flex items-center gap-2 font-display text-[15px] font-semibold">Meridian</span>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close menu">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <SidebarNav onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur sm:px-6">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </Button>
          <div className="hidden items-center gap-2 text-sm text-muted-foreground md:flex">
            <BarChart3 className="h-4 w-4" />
            <span>{dataset.business.name}</span>
            <ChevronDown className="h-3.5 w-3.5" />
          </div>
          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <Badge variant="outline" className="hidden border-warning/40 bg-warning/10 text-[10px] font-semibold uppercase tracking-wide text-warning-foreground sm:inline-flex">
              Demo workspace
            </Badge>
            <RoleSwitcher />
            <ThemeToggle />
            <div className="ml-1 hidden items-center gap-2 border-l border-border pl-3 sm:flex">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">NU</span>
              <div className="leading-tight">
                <p className="text-xs font-semibold text-foreground">Ngozi Uche</p>
                <p className="text-[11px] text-muted-foreground">Owner</p>
              </div>
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <View />
        </main>
      </div>
    </div>
  );
}

const ScreenContext = createContext<() => ReactNode>(() => null);
