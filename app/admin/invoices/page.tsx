"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "../../components/Header";
import { Navigation } from "../../components/Navigation";
import { Footer } from "../../components/Footer";
import { getCart } from "../../../lib/cart";

type Invoice = {
  id: string;
  date: string;
  items: Array<{ id: string; name: string; qty: number; price: number; mode: string }>;
  total: number;
};

const STORAGE_KEY = "empi_invoices";

function loadInvoices(): Invoice[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Invoice[];
  } catch (e) {
    console.error(e);
    return [];
  }
}

function saveInvoices(invoices: Invoice[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
}

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [currency, setCurrency] = useState("NGN");
  const [category, setCategory] = useState("adults");

  useEffect(() => {
    setInvoices(loadInvoices());
  }, []);

  const createInvoiceFromCart = () => {
    const cart = getCart();
    if (cart.length === 0) return alert("Cart is empty — add items first to create invoice.");

    const id = `INV-${Date.now()}`;
    const items = cart.map((c) => ({ id: c.id, name: c.name, qty: c.quantity, price: c.unitPrice, mode: c.mode }));
    const total = cart.reduce((s, it) => s + it.unitPrice * it.quantity, 0);
    const invoice: Invoice = { id, date: new Date().toISOString(), items, total };
    const next = [invoice, ...invoices];
    setInvoices(next);
    saveInvoices(next);
    alert(`Invoice ${id} created.`);
  };

  const clearInvoices = () => {
    if (!confirm("Clear all saved invoices?")) return;
    saveInvoices([]);
    setInvoices([]);
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      <header className="border-b border-gray-100 sticky top-0 z-40 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto w-full px-2 md:px-6 py-2 md:py-4 flex items-center justify-center gap-2 md:justify-between md:gap-8">
          <Header />
          <nav className="flex items-center flex-1">
            <Navigation category={category} onCategoryChange={setCategory} currency={currency} onCurrencyChange={setCurrency} />
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Invoices</h1>
          <div className="flex gap-2">
            <button onClick={createInvoiceFromCart} className="bg-lime-600 text-white px-3 py-2 rounded">Create from Cart</button>
            <button onClick={clearInvoices} className="border px-3 py-2 rounded">Clear All</button>
          </div>
        </div>

        {invoices.length === 0 ? (
          <div className="text-center py-12 text-gray-600">No invoices yet. Use "Create from Cart" to make one from the current cart.</div>
        ) : (
          <div className="space-y-4">
            {invoices.map((inv) => (
              <div key={inv.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-semibold">{inv.id}</div>
                    <div className="text-sm text-gray-600">{new Date(inv.date).toLocaleString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{inv.total.toFixed(2)}</div>
                    <Link href="#" className="text-sm text-lime-600">View</Link>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                  {inv.items.map((it) => (
                    <div key={it.id + it.mode} className="p-2 border rounded">
                      <div className="font-medium text-sm">{it.name}</div>
                      <div className="text-xs text-gray-600">{it.qty} × {it.price.toFixed(2)} ({it.mode})</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
