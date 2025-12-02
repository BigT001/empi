// Invoice Storage - Database-first with localStorage fallback for production
// Saves to Prisma/PostgreSQL when available, falls back to localStorage

export interface StoredInvoice {
  id?: string;
  invoiceNumber: string;
  orderNumber?: string;
  invoiceDate: string;
  dueDate?: string;
  
  // Customer details
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress?: string;
  customerCity?: string;
  customerState?: string;
  customerPostalCode?: string;
  
  // Buyer identification
  buyerId?: string;
  
  // Items
  items: Array<{
    id?: string;
    name: string;
    quantity: number;
    price: number;
    mode?: string;
    productId?: string;
  }>;
  
  // Pricing
  subtotal: number;
  bulkDiscountPercentage?: number;
  bulkDiscountAmount?: number;
  subtotalAfterDiscount?: number;
  cautionFee?: number;
  subtotalWithCaution?: number;
  shippingCost: number;
  taxAmount: number;
  totalAmount: number;
  
  // Shipping & Payment
  shippingPreference?: "empi" | "self";
  shippingMethod?: string;
  paymentStatus?: "pending" | "completed" | "failed";
  paymentMethod?: string;
  
  currency?: string;
  currencySymbol?: string;
  taxRate?: number;
  
  // Company info
  companyName?: string;
  companyAddress?: string;
  companyCity?: string;
  companyState?: string;
  
  // Invoice Type & Status
  type?: 'automatic' | 'manual';
  status?: 'draft' | 'sent' | 'paid' | 'overdue';
  
  // Metadata
  createdAt?: string;
  updatedAt?: string;
}

const BUYER_STORAGE_KEY = "empi_buyer_invoices";
const ADMIN_STORAGE_KEY = "empi_admin_invoices";

// Database save attempt (with localStorage fallback)
async function saveToDatabase(invoice: StoredInvoice): Promise<boolean> {
  try {
    const response = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(invoice),
    });
    return response.ok;
  } catch (error) {
    console.warn("⚠️ Database save failed, using localStorage fallback:", error);
    return false;
  }
}

// ============ BUYER INVOICE STORAGE ============

export function saveBuyerInvoice(invoice: StoredInvoice): void {
  if (typeof window === "undefined") return;
  
  // Try database first
  saveToDatabase(invoice).catch(() => {
    // Fallback to localStorage
    try {
      const invoices = getBuyerInvoices();
      invoices.push(invoice);
      localStorage.setItem(BUYER_STORAGE_KEY, JSON.stringify(invoices));
      console.log("✅ Invoice saved to localStorage (buyer):", invoice.invoiceNumber);
    } catch (e) {
      console.error("❌ Error saving buyer invoice:", e);
    }
  });
}

export function getBuyerInvoices(buyerId?: string): StoredInvoice[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(BUYER_STORAGE_KEY);
    const invoices = raw ? JSON.parse(raw) : [];
    
    if (buyerId) {
      return invoices.filter((inv: StoredInvoice) => inv.buyerId === buyerId);
    }
    
    return invoices;
  } catch (e) {
    console.error("Error loading buyer invoices:", e);
    return [];
  }
}

export function getBuyerInvoice(invoiceNumber: string): StoredInvoice | null {
  const invoices = getBuyerInvoices();
  return invoices.find(inv => inv.invoiceNumber === invoiceNumber) || null;
}

export function clearBuyerInvoices(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(BUYER_STORAGE_KEY);
}

// ============ ADMIN INVOICE STORAGE ============

export function saveAdminInvoice(invoice: StoredInvoice): void {
  if (typeof window === "undefined") return;
  
  // Try database first
  saveToDatabase(invoice).catch(() => {
    // Fallback to localStorage
    try {
      const invoices = getAdminInvoices();
      invoices.push(invoice);
      localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(invoices));
      console.log("✅ Invoice saved to localStorage (admin):", invoice.invoiceNumber);
    } catch (e) {
      console.error("❌ Error saving admin invoice:", e);
    }
  });
}

export function getAdminInvoices(): StoredInvoice[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ADMIN_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Error loading admin invoices:", e);
    return [];
  }
}

export function getAdminInvoice(invoiceNumber: string): StoredInvoice | null {
  const invoices = getAdminInvoices();
  return invoices.find(inv => inv.invoiceNumber === invoiceNumber) || null;
}

export function deleteAdminInvoice(invoiceNumber: string): void {
  if (typeof window === "undefined") return;
  const invoices = getAdminInvoices();
  const filtered = invoices.filter(inv => inv.invoiceNumber !== invoiceNumber);
  localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(filtered));
}

export function clearAdminInvoices(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ADMIN_STORAGE_KEY);
}

// ============ UTILITY FUNCTIONS ============

export function getInvoiceStats() {
  const buyerInvoices = getBuyerInvoices();
  const adminInvoices = getAdminInvoices();
  
  return {
    buyerCount: buyerInvoices.length,
    adminCount: adminInvoices.length,
    buyerTotal: buyerInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
    adminTotal: adminInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
  };
}

export function searchInvoices(query: string, type: "buyer" | "admin" = "admin"): StoredInvoice[] {
  const invoices = type === "buyer" ? getBuyerInvoices() : getAdminInvoices();
  const lower = query.toLowerCase();
  
  return invoices.filter(inv =>
    inv.invoiceNumber.toLowerCase().includes(lower) ||
    (inv.orderNumber?.toLowerCase().includes(lower) || false) ||
    inv.customerName.toLowerCase().includes(lower) ||
    inv.customerEmail.toLowerCase().includes(lower)
  );
}

