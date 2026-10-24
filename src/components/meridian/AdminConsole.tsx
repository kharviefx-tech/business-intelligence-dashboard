import { useMemo, useState } from "react";
import { Activity, Building2, Check, ShieldCheck, ShieldOff, Users } from "lucide-react";
import { ROLE_LABELS, ROLE_PERMISSIONS, useStore } from "@/lib/store";
import type { Role } from "@/lib/types";
import { PageHeader } from "./PageHeader";
import { KpiCard } from "./KpiCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const ROLE_ORDER: Role[] = ["super_admin", "owner", "manager", "staff", "analyst"];

const PERMISSION_LABELS: Record<string, string> = {
  "finance.view": "View finance",
  "finance.write": "Record transactions",
  "sales.view": "View sales",
  "sales.write": "Create & update orders",
  "customers.view": "View customers",
  "customers.write": "Export customers",
  "reports.export": "Export reports",
  "ai.use": "Use AI analyst",
  "admin.access": "Admin console",
  "audit.view": "Audit trail",
};

export function AdminConsole() {
  const { dataset, role } = useStore();
  const [team, setTeam] = useState(dataset.employees);
  const [active, setActive] = useState<Record<string, boolean>>(() => Object.fromEntries(dataset.employees.map((e) => [e.id, true])));

  const counts = useMemo(
    () => ({
      users: team.length,
      admins: team.filter((e) => e.role === "super_admin" || e.role === "owner").length,
      active: team.filter((e) => active[e.id]).length,
      records: dataset.transactions.length + dataset.sales.length,
    }),
    [team, active, dataset],
  );

  return (
    <div className="fv-rise">
      <PageHeader
        title="Admin console"
        description="Manage team access, roles and the organisation's audit trail. Every change is written to the log."
        actions={
          <Badge variant="outline" className="gap-1 border-primary/30 bg-primary/5 text-[11px] text-primary">
            <ShieldCheck className="h-3 w-3" /> Signed in as {ROLE_LABELS[role]}
          </Badge>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="Team members" value={counts.users} money={false} delta={null} hint={`${counts.admins} with admin rights`} />
        <KpiCard label="Active accounts" value={counts.active} money={false} delta={null} hint="Sign-in enabled" />
        <KpiCard label="Workspaces" value={2} money={false} delta={null} hint="1 organisation, 1 sandbox" />
        <KpiCard label="Records stored" value={counts.records.toLocaleString()} money={false} delta={null} hint="Transactions and orders" />
      </div>

      <div className="mt-5">
        <Tabs defaultValue="team">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="team"><Users className="mr-1.5 h-3.5 w-3.5" /> Team</TabsTrigger>
            <TabsTrigger value="roles"><ShieldCheck className="mr-1.5 h-3.5 w-3.5" /> Roles</TabsTrigger>
            <TabsTrigger value="audit"><Activity className="mr-1.5 h-3.5 w-3.5" /> Audit</TabsTrigger>
          </TabsList>

          <TabsContent value="team" className="mt-4 rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border p-4">
              <div>
                <h2 className="font-display text-sm font-semibold">Team access</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">Changing a role takes effect immediately and is recorded in the audit log.</p>
              </div>
              <Badge variant="secondary" className="text-[10px]">2 of 5 seats used on Professional</Badge>
            </div>
            <div className="overflow-x-auto">
              <Table className="min-w-[640px]">
                <TableHeader>
                  <TableRow className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    <TableHead>Member</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {team.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>
                        <p className="font-medium text-card-foreground">{m.name}</p>
                        <p className="text-[11px] text-muted-foreground">{m.email}</p>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{m.team}</TableCell>
                      <TableCell>
                        <Select
                          value={m.role}
                          onValueChange={(v) => {
                            setTeam((t) => t.map((mm) => (mm.id === m.id ? { ...mm, role: v as Role } : mm)));
                            toast.success(`${m.name} is now ${ROLE_LABELS[v as Role]}`);
                          }}
                        >
                          <SelectTrigger className="h-8 w-[180px] text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {ROLE_ORDER.map((r) => <SelectItem key={r} value={r} className="text-xs">{ROLE_LABELS[r]}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch checked={!!active[m.id]} onCheckedChange={(v) => { setActive((a) => ({ ...a, [m.id]: v })); toast.success(v ? "Access enabled" : "Access suspended"); }} />
                          <span className="text-[11px] text-muted-foreground">{active[m.id] ? "Active" : "Suspended"}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center gap-2 border-t border-border bg-muted/40 px-4 py-2.5 text-[11px] text-muted-foreground">
              <ShieldOff className="h-3.5 w-3.5" />
              Row-level security ensures members only read records belonging to this workspace.
            </div>
          </TabsContent>

          <TabsContent value="roles" className="mt-4 rounded-lg border border-border bg-card p-4">
            <h2 className="font-display text-sm font-semibold">Permission matrix</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Navigation and actions are gated by role. Switch roles in the header to test the experience.</p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[640px] text-xs">
                <thead>
                  <tr className="border-b border-border text-[10px] uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 text-left font-medium">Permission</th>
                    {ROLE_ORDER.map((r) => (
                      <th key={r} className="px-2 py-2 text-center font-medium">
                        <span className={`inline-flex rounded-sm px-1.5 py-0.5 ${r === role ? "bg-primary/10 text-primary" : ""}`}>{ROLE_LABELS[r].split(" ").pop()}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(PERMISSION_LABELS).map((perm) => (
                    <tr key={perm} className="border-b border-border/60 last:border-0">
                      <td className="py-2 font-medium text-card-foreground">{PERMISSION_LABELS[perm]}</td>
                      {ROLE_ORDER.map((r) => (
                        <td key={r} className="px-2 py-2 text-center">
                          {ROLE_PERMISSIONS[r].includes(perm as never) ? (
                            <Check className="mx-auto h-3.5 w-3.5 text-success" />
                          ) : (
                            <span className="text-muted-foreground/40">—</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="audit" className="mt-4 rounded-lg border border-border bg-card">
            <div className="border-b border-border p-4">
              <h2 className="font-display text-sm font-semibold">Audit trail</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">Recent changes to records, roles and account access.</p>
            </div>
            <ol className="divide-y divide-border">
              {dataset.audit.map((a) => (
                <li key={a.id} className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm">
                      <span className="font-semibold">{a.actor}</span> <span className="text-muted-foreground">{a.action.toLowerCase()}</span> <span className="font-medium">{a.entity}</span>
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">{a.detail}</p>
                  </div>
                  <time className="shrink-0 text-[11px] text-muted-foreground">
                    {new Date(a.at).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </time>
                </li>
              ))}
            </ol>
          </TabsContent>
        </Tabs>
      </div>

      <div className="mt-4 rounded-lg border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <div>
              <p className="text-sm font-semibold">Workspace settings</p>
              <p className="text-[11px] text-muted-foreground">Organisation: {dataset.business.legalName}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => toast.info("Workspace settings are read-only in the demo.")}>Manage workspace</Button>
        </div>
      </div>
    </div>
  );
}
