import type { Dataset } from "./types";

const CATEGORIES: Dataset["categories"] = [
  { id: "c-consulting", name: "Consulting retainers", kind: "revenue", group: "Income" },
  { id: "c-licenses", name: "Software licences", kind: "revenue", group: "Income" },
  { id: "c-service", name: "Support & maintenance", kind: "revenue", group: "Income" },
  { id: "c-training", name: "Training workshops", kind: "revenue", group: "Income" },
  { id: "c-hardware", name: "Hardware resale", kind: "revenue", group: "Income" },
  { id: "c-cogs", name: "Cost of goods sold", kind: "expense", group: "Cost of sales" },
  { id: "c-hosting", name: "Cloud & hosting", kind: "expense", group: "Operating" },
  { id: "c-tools", name: "Software subscriptions", kind: "expense", group: "Operating" },
  { id: "c-marketing", name: "Marketing & ads", kind: "expense", group: "Operating" },
  { id: "c-rent", name: "Office rent", kind: "expense", group: "Operating" },
  { id: "c-travel", name: "Travel & client visits", kind: "expense", group: "Operating" },
  { id: "c-payroll", name: "Salaries", kind: "expense", group: "Payroll" },
  { id: "c-loan", name: "Loan disbursement", kind: "capital", group: "Capital" },
];

const PRODUCTS: Dataset["products"] = [
  { id: "p-1", name: "Ops Suite – Starter (annual)", category: "Software", unitPrice: 1_450_000, unitCost: 180_000, active: true },
  { id: "p-2", name: "Ops Suite – Growth (annual)", category: "Software", unitPrice: 3_200_000, unitCost: 340_000, active: true },
  { id: "p-3", name: "Ops Suite – Enterprise (annual)", category: "Software", unitPrice: 7_800_000, unitCost: 620_000, active: true },
  { id: "p-4", name: "Implementation project", category: "Services", unitPrice: 2_400_000, unitCost: 950_000, active: true },
  { id: "p-5", name: "Finance module add-on", category: "Software", unitPrice: 1_150_000, unitCost: 120_000, active: true },
  { id: "p-6", name: "Support retainer (monthly)", category: "Services", unitPrice: 480_000, unitCost: 210_000, active: true },
  { id: "p-7", name: "Training workshop (per seat)", category: "Training", unitPrice: 95_000, unitCost: 38_000, active: true },
  { id: "p-8", name: "Barcode scanner kit", category: "Hardware", unitPrice: 165_000, unitCost: 112_000, active: true },
  { id: "p-9", name: "Legacy POS integration", category: "Services", unitPrice: 780_000, unitCost: 460_000, active: false },
];

const CUSTOMERS: Dataset["customers"] = [
  { id: "k-1", name: "Adaeze Okafor", email: "adaeze@greenacrelogistics.ng", phone: "+234 803 441 2098", company: "Greenacre Logistics", segment: "Corporate", firstPurchase: "2024-11-04", lastPurchase: "2026-09-28", tags: ["High value", "Renewal Q1"] },
  { id: "k-2", name: "Tunde Balogun", email: "tunde@northstarcatering.com", phone: "+234 802 119 7742", company: "Northstar Catering Group", segment: "Wholesale", firstPurchase: "2025-02-17", lastPurchase: "2026-10-09", tags: ["Multi-site"] },
  { id: "k-3", name: "Chiamaka Eze", email: "chiamaka@bellaprintworks.ng", phone: "+234 805 772 3310", company: "Bella Printworks", segment: "Retail", firstPurchase: "2026-03-12", lastPurchase: "2026-10-18", tags: ["Growing"] },
  { id: "k-4", name: "Ibrahim Musa", email: "ibrahim@kadunafoods.ng", phone: "+234 809 335 8801", company: "Kaduna Fresh Foods", segment: "Distributor", firstPurchase: "2025-06-08", lastPurchase: "2026-09-14", tags: ["Overdue invoice"] },
  { id: "k-5", name: "Folake Adeyemi", email: "folake@luxeinteriors.ng", phone: "+234 806 902 1187", company: "Luxe Interiors", segment: "Retail", firstPurchase: "2026-07-22", lastPurchase: "2026-10-16", tags: ["New"] },
  { id: "k-6", name: "Emeka Nwosu", email: "emeka@harbourlineports.com", phone: "+234 811 204 5567", company: "Harbourline Ports", segment: "Corporate", firstPurchase: "2024-08-30", lastPurchase: "2026-08-11", tags: ["Enterprise", "At risk"] },
  { id: "k-7", name: "Zainab Yusuf", email: "zainab@abujaclinics.com", phone: "+234 703 118 6620", company: "Abuja Health Clinics", segment: "Wholesale", firstPurchase: "2025-12-02", lastPurchase: "2026-10-02", tags: ["Recurring"] },
  { id: "k-8", name: "Daniel Obi", email: "daniel@lagosbikelanes.com", phone: "+234 814 660 2299", company: "Lagos Bike Lanes", segment: "Retail", firstPurchase: "2026-09-05", lastPurchase: "2026-10-20", tags: ["New"] },
];

const EMPLOYEES: Dataset["employees"] = [
  { id: "e-1", name: "Ngozi Uche", role: "owner", email: "ngozi@meridianbi.com", team: "Leadership", target: 0 },
  { id: "e-2", name: "Samuel Ojo", role: "manager", email: "samuel@meridianbi.com", team: "Sales", target: 28_000_000 },
  { id: "e-3", name: "Aisha Bello", role: "staff", email: "aisha@meridianbi.com", team: "Sales", target: 16_000_000 },
  { id: "e-4", name: "Peter Ibe", role: "staff", email: "peter@meridianbi.com", team: "Delivery", target: 0 },
  { id: "e-5", name: "Grace Onu", role: "analyst", email: "grace@meridianbi.com", team: "Finance", target: 0 },
  { id: "e-6", name: "Vibely Admin", role: "super_admin", email: "admin@meridianbi.com", team: "Platform", target: 0 },
];

const BUDGETS: Dataset["budgets"] = [
  { id: "b-1", categoryId: "c-hosting", period: "2026-10", planned: 1_450_000 },
  { id: "b-2", categoryId: "c-tools", period: "2026-10", planned: 980_000 },
  { id: "b-3", categoryId: "c-marketing", period: "2026-10", planned: 2_000_000 },
  { id: "b-4", categoryId: "c-rent", period: "2026-10", planned: 1_800_000 },
  { id: "b-5", categoryId: "c-travel", period: "2026-10", planned: 1_200_000 },
  { id: "b-6", categoryId: "c-payroll", period: "2026-10", planned: 9_500_000 },
  { id: "b-7", categoryId: "c-cogs", period: "2026-10", planned: 3_200_000 },
  { id: "b-8", categoryId: "c-marketing", period: "2026-09", planned: 1_900_000 },
  { id: "b-9", categoryId: "c-tools", period: "2026-09", planned: 900_000 },
];

/** Deterministic pseudo-random so the demo dataset stays stable between reloads. */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
}

const REVENUE_PLAN: { cat: string; base: number; growth: number; customers: string[] }[] = [
  { cat: "c-consulting", base: 3_800_000, growth: 0.055, customers: ["Greenacre Logistics", "Harbourline Ports", "Abuja Health Clinics"] },
  { cat: "c-licenses", base: 2_600_000, growth: 0.071, customers: ["Greenacre Logistics", "Northstar Catering Group", "Bella Printworks"] },
  { cat: "c-service", base: 1_300_000, growth: 0.032, customers: ["Northstar Catering Group", "Abuja Health Clinics", "Luxe Interiors"] },
  { cat: "c-training", base: 620_000, growth: 0.018, customers: ["Bella Printworks", "Lagos Bike Lanes", "Kaduna Fresh Foods"] },
  { cat: "c-hardware", base: 840_000, growth: 0.044, customers: ["Kaduna Fresh Foods", "Lagos Bike Lanes"] },
];

const EXPENSE_PLAN: { cat: string; base: number; growth: number; vendor: string; day: number; method: "transfer" | "card" | "pos" }[] = [
  { cat: "c-payroll", base: 8_900_000, growth: 0.012, vendor: "Payroll run", day: 25, method: "transfer" },
  { cat: "c-rent", base: 1_800_000, growth: 0, vendor: "Wingate Business Park", day: 1, method: "transfer" },
  { cat: "c-hosting", base: 1_260_000, growth: 0.06, vendor: "Cloud infrastructure", day: 4, method: "card" },
  { cat: "c-tools", base: 870_000, growth: 0.035, vendor: "SaaS stack", day: 7, method: "card" },
  { cat: "c-marketing", base: 1_540_000, growth: 0.09, vendor: "Paid acquisition", day: 12, method: "card" },
  { cat: "c-travel", base: 910_000, growth: 0.05, vendor: "Field team expenses", day: 17, method: "pos" },
  { cat: "c-cogs", base: 2_450_000, growth: 0.041, vendor: "Hardware & licensing costs", day: 20, method: "transfer" },
];

function isoDate(year: number, monthIndex: number, day: number) {
  const d = new Date(Date.UTC(year, monthIndex, Math.min(day, 28)));
  return d.toISOString().slice(0, 10);
}

function buildMonths(): { year: number; month: number; key: string }[] {
  // 13 months ending in the current month, so every comparison has history.
  const now = new Date();
  const out: { year: number; month: number; key: string }[] = [];
  for (let i = 12; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    out.push({
      year: d.getUTCFullYear(),
      month: d.getUTCMonth(),
      key: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`,
    });
  }
  return out;
}

export function buildDataset(): Dataset {
  const rand = rng(20261024);
  const months = buildMonths();
  const transactions: Dataset["transactions"] = [];
  const targets: Dataset["targets"] = [];
  let tx = 0;
  const txId = () => `t-${++tx}`;

  months.forEach((m, idx) => {
    const monthLabel = new Date(Date.UTC(m.year, m.month, 1)).toLocaleString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
    REVENUE_PLAN.forEach((plan, pIdx) => {
      const seasonal = 1 + Math.sin((m.month + pIdx) / 1.9) * 0.08;
      const amount = Math.round((plan.base * Math.pow(1 + plan.growth, idx) * seasonal * (0.94 + rand() * 0.12)) / 1000) * 1000;
      const day = 3 + Math.floor(rand() * 22);
      const paid = rand();
      const unpaid = idx === months.length - 1 ? (pIdx === 2 ? 0 : 1) : paid < 0.08 ? 1 : 0;
      transactions.push({
        id: txId(),
        date: isoDate(m.year, m.month, day),
        description: `${monthLabel} – ${plan.cat.replace("c-", "")} revenue`,
        categoryId: plan.cat,
        amount,
        method: rand() > 0.45 ? "transfer" : "card",
        status: unpaid ? "unpaid" : "paid",
        amountPaid: unpaid ? Math.round(amount * 0.35) : amount,
        vendorOrCustomer: plan.customers[Math.floor(rand() * plan.customers.length)],
        createdBy: "Ngozi Uche",
      });
    });

    EXPENSE_PLAN.forEach((plan, pIdx) => {
      const seasonal = 1 + Math.sin((m.month + pIdx) / 2.4) * 0.06;
      const spike = m.month === 9 && pIdx === 2 ? 1.42 : 1; // September cloud bill spike
      const amount = Math.round((plan.base * Math.pow(1 + plan.growth, idx) * seasonal * spike * (0.95 + rand() * 0.1)) / 1000) * 1000;
      transactions.push({
        id: txId(),
        date: isoDate(m.year, m.month, plan.day),
        description: `${monthLabel} – ${plan.vendor}`,
        categoryId: plan.cat,
        amount,
        method: plan.method,
        status: "paid",
        amountPaid: amount,
        vendorOrCustomer: plan.vendor,
        createdBy: "Grace Onu",
      });
    });

    targets.push({ month: m.key, revenue: Math.round((8_900_000 * Math.pow(1.02, idx)) / 1000) * 1000, sales: 26 + Math.round(idx / 2) });
  });

  // A development loan — capital, explicitly excluded from revenue.
  transactions.push({
    id: txId(),
    date: isoDate(months[8].year, months[8].month, 14),
    description: "Development loan disbursement – Bank of Industry",
    categoryId: "c-loan",
    amount: 12_000_000,
    method: "loan",
    status: "paid",
    amountPaid: 12_000_000,
    vendorOrCustomer: "Bank of Industry",
    note: "Capital inflow. Excluded from revenue and profit.",
    createdBy: "Ngozi Uche",
  });

  const sales: Dataset["sales"] = [];
  const productPlan = ["p-1", "p-2", "p-3", "p-4", "p-5", "p-6", "p-7", "p-8"];
  let s = 0;
  months.forEach((m, idx) => {
    const count = 9 + Math.floor(rand() * 6) + Math.floor(idx / 3);
    for (let i = 0; i < count; i++) {
      const productId = productPlan[Math.floor(rand() * productPlan.length)];
      const product = PRODUCTS.find((p) => p.id === productId)!;
      const qty = productId === "p-7" ? 2 + Math.floor(rand() * 9) : 1;
      const discountPct = rand() > 0.7 ? 0.05 : 0;
      const gross = product.unitPrice * qty;
      const discount = Math.round(gross * discountPct);
      const tax = Math.round((gross - discount) * 0.075);
      const total = gross - discount + tax;
      const customer = CUSTOMERS[Math.floor(rand() * CUSTOMERS.length)];
      const rep = rand() > 0.4 ? "e-2" : "e-3";
      const payRoll = rand();
      const cancelled = idx === 4 && i === 3;
      const isLatest = idx === months.length - 1;
      const paymentStatus = cancelled ? "unpaid" : payRoll < 0.72 || !isLatest ? "paid" : payRoll < 0.9 ? "partial" : "unpaid";
      s++;
      sales.push({
        id: `s-${s}`,
        reference: `MRD-${m.key.replace("-", "")}-${String(s).padStart(3, "0")}`,
        date: isoDate(m.year, m.month, 2 + Math.floor(rand() * 26)),
        customerId: customer.id,
        salesRepId: rep,
        lines: [{ productId, quantity: qty, unitPrice: product.unitPrice, discount, tax }],
        status: cancelled ? "cancelled" : rand() > 0.15 ? "fulfilled" : "pending",
        paymentStatus: paymentStatus as Dataset["sales"][number]["paymentStatus"],
        amountPaid: paymentStatus === "paid" ? total : paymentStatus === "partial" ? Math.round(total * 0.5) : 0,
      });
    }
  });

  const now = new Date().toISOString();
  const audit: Dataset["audit"] = [
    { id: "a-1", at: now, actor: "Grace Onu", action: "Exported report", entity: "Profit & loss – September 2026", detail: "CSV export, 148 rows" },
    { id: "a-2", at: now, actor: "Ngozi Uche", action: "Updated transaction", entity: "Cloud & hosting", detail: "Amount corrected to ₦1,420,000 after invoice re-issue" },
    { id: "a-3", at: now, actor: "Vibely Admin", action: "Changed role", entity: "Grace Onu", detail: "Staff member → Read-only analyst" },
    { id: "a-4", at: now, actor: "Samuel Ojo", action: "Recorded sale", entity: "MRD-202610-014", detail: "Greenacre Logistics renewal" },
    { id: "a-5", at: now, actor: "Vibely Admin", action: "Suspended account", entity: "demo-retail@example.com", detail: "Awaiting verification" },
  ];

  return {
    business: {
      name: "Meridian BI",
      legalName: "Meridian Business Intelligence Ltd",
      currency: "NGN",
      plan: "Professional",
      address: "14 Wingate Business Park, Lekki, Lagos",
      fiscalYearStart: "January",
    },
    categories: CATEGORIES,
    transactions,
    products: PRODUCTS,
    sales,
    customers: CUSTOMERS,
    employees: EMPLOYEES,
    budgets: BUDGETS,
    audit,
    targets,
  };
}
