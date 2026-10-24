export type Role = "super_admin" | "owner" | "manager" | "staff" | "analyst";

export type PaymentMethod = "transfer" | "card" | "cash" | "pos" | "loan";

export type TransactionStatus = "paid" | "unpaid" | "partial";

export type CategoryKind = "revenue" | "expense" | "capital";

export interface Category {
  id: string;
  name: string;
  kind: CategoryKind;
  group: "Income" | "Cost of sales" | "Operating" | "Payroll" | "Capital";
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  categoryId: string;
  amount: number;
  method: PaymentMethod;
  status: TransactionStatus;
  amountPaid: number;
  vendorOrCustomer: string;
  note?: string;
  createdBy: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  unitPrice: number;
  unitCost: number;
  active: boolean;
}

export type SaleStatus = "fulfilled" | "pending" | "cancelled";

export interface SaleLine {
  productId: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
}

export interface Sale {
  id: string;
  reference: string;
  date: string;
  customerId: string;
  salesRepId: string;
  lines: SaleLine[];
  status: SaleStatus;
  paymentStatus: TransactionStatus;
  amountPaid: number;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  segment: "Retail" | "Wholesale" | "Corporate" | "Distributor";
  firstPurchase: string;
  lastPurchase: string;
  tags: string[];
}

export interface Employee {
  id: string;
  name: string;
  role: Role;
  email: string;
  team: string;
  target: number;
}

export interface Budget {
  id: string;
  categoryId: string;
  period: string; // YYYY-MM
  planned: number;
}

export interface AuditEntry {
  id: string;
  at: string;
  actor: string;
  action: string;
  entity: string;
  detail: string;
}

export interface Business {
  name: string;
  legalName: string;
  currency: string;
  plan: "Free" | "Professional" | "Business" | "Enterprise";
  address: string;
  fiscalYearStart: string;
}

export interface Dataset {
  business: Business;
  categories: Category[];
  transactions: Transaction[];
  products: Product[];
  sales: Sale[];
  customers: Customer[];
  employees: Employee[];
  budgets: Budget[];
  audit: AuditEntry[];
  targets: { month: string; revenue: number; sales: number }[];
}
