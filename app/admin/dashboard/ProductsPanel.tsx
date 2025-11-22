"use client";

import { useState, useEffect } from "react";

export function ProductsPanel() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/products?limit=50');
        if (!res.ok) throw new Error('Failed to load products');
        const data = await res.json();
        if (mounted) setProducts(data.products || data || []);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h2 className="text-lg font-bold mb-4">Products</h2>
      {loading ? (
        <p className="text-sm text-gray-600">Loading...</p>
      ) : products.length === 0 ? (
        <p className="text-sm text-gray-600">No products found</p>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {products.map((p: any) => (
            <div key={p._id || p.id} className="border rounded p-3">
              <div className="font-medium text-sm line-clamp-1">{p.name}</div>
              <div className="text-xs text-gray-500">₦{Number(p.sellPrice || 0).toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
