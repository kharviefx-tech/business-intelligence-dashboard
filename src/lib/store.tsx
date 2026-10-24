import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { buildDataset } from "./seed";
import type { AuditEntry, Dataset, Role, Sale, Transaction } from "./types";

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Super Administrator",
  owner: "Business Owner",
  manager: "Business Manager",
  staff: "Staff Member",
  analyst: "Read-only Analyst",
};

export type Permission =
  | "finance.view"
  | "finance.write"
  | "sales.view"
  | "sales.write"
  | "customers.view"
  | "customers.write"
  | "reports.export"
  | "ai.use"
  | "admin.access"
  | "audit.view";

const PERMISSIONS: Record<Role, Permission[]> = {
  super_admin: ["finance.view", "finance.write", "sales.view", "sales.write", "customers.view", "customers.write", "reports.export", "ai.use", "admin.access", "audit.view"],
  owner: ["finance.view", "finance.write", "sales.view", "sales.write", "customers.view", "customers.write", "reports.export", "ai.use", "audit.view"],
  manager: ["finance.view", "sales.view", "sales.write", "customers.view", "customers.write", "reports.export", "ai.use"],
  staff: ["sales.view", "sales.write", "customers.view"],
  analyst: ["finance.view", "sales.view", "customers.view", "reports.export"],
};

export function hasPermission(role: Role, permission: Permission) {
  return PERMISSIONS[role].includes(permission);
}

interface StoreValue {
  dataset: Dataset;
  role: Role;
  setRole: (r: Role) => void;
  can: (p: Permission) => boolean;
  addTransaction: (t: Omit<Transaction, "id" | "createdBy">) => void;
  updateTransaction: (id: string, patch: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  addSale: (s: Omit<Sale, "id">) => void;
  updateSaleStatus: (id: string, status: Sale["status"]) => void;
  resetDemo: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

const ROLE_KEY = "meridian.role";

export function StoreProvider({ children }: { children: ReactNode }) {
  const [dataset, setDataset] = useState<Dataset>(() => buildDataset());
  const [role, setRoleState] = useState<Role>("owner");

  useEffect(() => {
    const saved = window.localStorage.getItem(ROLE_KEY) as Role | null;
    if (saved && saved in PERMISSIONS) setRoleState(saved);
  }, []);

  const setRole = useCallback((r: Role) => {
    setRoleState(r);
    window.localStorage.setItem(ROLE_KEY, r);
  }, []);

  const can = useCallback((p: Permission) => hasPermission(role, p), [role]);

  const audit = useCallback((d: Dataset, entry: Omit<AuditEntry, "id" | "at">): Dataset => {
    const prev = d.audit[0];
    return {
      ...d,
      audit: [{ id: `a-${Date.now()}`, at: new Date().toISOString(), ...entry }, ...(prev ? d.audit : [])],
    };
  }, []);

  const addTransaction = useCallback(
    (t: Omit<Transaction, "id" | "createdBy">) => {
      setDataset((d) => {
        const next: Transaction = { ...t, id: `t-${Date.now()}`, createdBy: ROLE_LABELS[role] };
        return audit({ ...d, transactions: [next, ...d.transactions] }, { actor: ROLE_LABELS[role], action: t.amountPaid < t.amount && (d.categories.find((c) => c.id === t.categoryId)?.kind === "revenue") ? "Recorded income" : "Recorded transaction", entity: t.description, detail: `Amount ${t.amount.toLocaleString()}` });
      });
    },
    [role, audit],
  );

  const updateTransaction = useCallback(
    (id: string, patch: Partial<Transaction>) => {
      setDataset((d) => {
        const original = d.transactions.find((t) => t.id === id);
        return audit(
          { ...d, transactions: d.transactions.map((t) => (t.id === id ? { ...t, ...patch } : t)) },
          { actor: ROLE_LABELS[role], action: "Updated transaction", entity: original?.description ?? id, detail: Object.keys(patch).join(", ") },
        );
      });
    },
    [role, audit],
  );

  const deleteTransaction = useCallback(
    (id: string) => {
      setDataset((d) => {
        const original = d.transactions.find((t) => t.id === id);
        return audit({ ...d, transactions: d.transactions.filter((t) => t.id !== id) }, { actor: ROLE_LABELS[role], action: "Deleted transaction", entity: original?.description ?? id, detail: `Amount ${original?.amount.toLocaleString() ?? ""}` });
      });
    },
    [role, audit],
  );

  const addSale = useCallback(
    (s: Omit<Sale, "id">) => {
      setDataset((d) => {
        const next: Sale = { ...s, id: `s-${Date.now()}` };
        return audit({ ...d, sales: [next, ...d.sales] }, { actor: ROLE_LABELS[role], action: "Recorded sale", entity: s.reference, detail: `${s.lines.length} line(s)` });
      });
    },
    [role, audit],
  );

  const updateSaleStatus = useCallback(
    (id: string, status: Sale["status"]) => {
      setDataset((d) =>
        audit({ ...d, sales: d.sales.map((s) => (s.id === id ? { ...s, status } : s)) }, { actor: ROLE_LABELS[role], action: "Changed order status", entity: id, detail: status }),
      );
    },
    [role, audit],
  );

  const resetDemo = useCallback(() => setDataset(buildDataset()), []);

  const value = useMemo<StoreValue>(
    () => ({ dataset, role, setRole, can, addTransaction, updateTransaction, deleteTransaction, addSale, updateSaleStatus, resetDemo }),
    [dataset, role, setRole, can, addTransaction, updateTransaction, deleteTransaction, addSale, updateSaleStatus, resetDemo],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

export const ALL_ROLES: Role[] = ["super_admin", "owner", "manager", "staff", "analyst"];
export const ROLE_PERMISSIONS = PERMISSIONS;
