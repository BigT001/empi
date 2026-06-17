"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Trash2, Edit2, X, AlertCircle } from "lucide-react";
import EditProductModal from "./components/EditProductModal";


interface Product {
  _id: string;
  name: string;
  description: string;
  imageUrl: string;
  imageUrls: string[];
  sellPrice: number;
  rentPrice: number;
  category: string;
  costumeType?: string;
  badge?: string;
  condition: string;
  color?: string;
  material?: string;
  sizes?: string;
  country?: string;
}

const COUNTRIES = [
  { id: 'all', label: '🌍 All Countries', value: null },
  { id: 'Nigeria', label: '🇳🇬 Nigeria', value: 'Nigeria' },
  { id: 'Ghana', label: '🇬🇭 Ghana', value: 'Ghana' },
  { id: 'South Africa', label: '🇿🇦 South Africa', value: 'South Africa' },
  { id: 'Egypt', label: '🇪🇬 Egypt', value: 'Egypt' },
  { id: 'Algeria', label: '🇩🇿 Algeria', value: 'Algeria' },
  { id: 'Congo', label: '🇨🇩 Congo', value: 'Congo' },
  { id: 'Kenya', label: '🇰🇪 Kenya', value: 'Kenya' },
];

export default function MobileProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteMessage, setDeleteMessage] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      setError("");

      const response = await fetch("/api/products");
      if (!response.ok) throw new Error("Failed to fetch products");

      const data = await response.json();
      // API returns { data: [], pagination: {...} }
      const productList = data.data || (Array.isArray(data) ? data : (data.products || []));
      setProducts(productList);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error loading products";
      setError(message);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!confirm("Delete this product?")) return;

    try {
      setDeletingId(productId);
      const response = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete product");
      }

      setProducts((prev) => prev.filter((p) => p._id !== productId));
      setDeleteMessage("✅ Product deleted");
      setSelectedProduct(null);
      setTimeout(() => setDeleteMessage(""), 2000);
    } catch (err) {
      setDeleteMessage("❌ Delete failed");
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditProduct = async (updatedProduct: Product) => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/products/${updatedProduct._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedProduct),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update product");
      }

      const updated = await response.json();
      setProducts((prev) =>
        prev.map((p) => (p._id === updated._id ? updated : p))
      );
      setEditingProduct(null);
      setSelectedProduct(updated);
      setDeleteMessage("✅ Product updated successfully");
      setTimeout(() => setDeleteMessage(""), 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update product";
      setDeleteMessage(`❌ ${message}`);
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-gray-300 border-t-lime-600 rounded-full animate-spin mb-3"></div>
          <p className="text-gray-600 font-semibold">Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-600 font-semibold mb-4">❌ {error}</p>
          <button
            onClick={loadProducts}
            className="px-6 py-2 bg-lime-600 text-white rounded-lg font-semibold hover:bg-lime-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-gray-600 font-semibold mb-4">📭 No products yet</p>
          <p className="text-sm text-gray-500">Upload your first product to get started</p>
        </div>
      </div>
    );
  }

  // Filter to show only Traditional Africa costumes with country data
  const traditionalAfricaProducts = products.filter(
    (p) => p.costumeType?.toLowerCase() === 'traditional africa' && p.country
  );

  // Filter products by selected country (only among Traditional Africa costumes)
  const filteredProducts = selectedCountry
    ? traditionalAfricaProducts.filter((p) => p.country === selectedCountry)
    : traditionalAfricaProducts;

  // Show country tabs only if there are Traditional Africa products with country data
  const showCountryTabs = traditionalAfricaProducts.length > 0;

  // DEBUG LOGS
  console.log('📊 DEBUG: Total Products:', products.length);
  console.log('🥁 DEBUG: Traditional Africa Products:', traditionalAfricaProducts.length);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 py-4">
        <h1 className="text-xl font-bold text-gray-900">📦 Products ({filteredProducts.length})</h1>
      </div>

      {/* Country Filter Tabs */}
      {showCountryTabs && (
        <div className="sticky top-16 z-19 bg-white border-b border-gray-200 px-4 py-3">
          <p className="text-xs font-semibold text-gray-600 mb-2">🥁 Traditional Africa - Filter by Country:</p>
          <div className="flex gap-2 overflow-x-auto pb-2 -mb-2">
            {COUNTRIES.map((country) => (
              <button
                key={country.id}
                onClick={() => setSelectedCountry(country.value)}
                className={`px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition ${
                  selectedCountry === country.value
                    ? 'bg-lime-600 text-white shadow-md'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {country.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {deleteMessage && (
        <div
          className={`mx-4 mt-4 p-3 rounded-lg text-center font-semibold text-sm ${
            deleteMessage.includes("✅")
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {deleteMessage}
        </div>
      )}

      {/* Products Feed - Instagram Style */}
      <div className="space-y-4 px-4 py-4">
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-gray-500 text-lg font-semibold">No Traditional Africa products found</p>
            <p className="text-gray-400 text-sm">for {selectedCountry || 'any country'}</p>
          </div>
        ) : null}
        {filteredProducts.map((product) => (
          <div
            key={product._id}
            className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition cursor-pointer"
            onClick={() => setSelectedProduct(product)}
          >
            {/* Product Image */}
            <div className="relative w-full aspect-square bg-gray-100 overflow-hidden">
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-cover hover:scale-105 transition"
              />
              {product.badge && (
                <div className="absolute top-3 right-3 bg-lime-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                  {product.badge}
                </div>
              )}
              <div className="absolute top-3 left-3 bg-black/70 text-white text-xs font-bold px-2 py-1 rounded-lg">
                {product.category}
              </div>
            </div>

            {/* Product Info */}
            <div className="p-4">
              <h3 className="font-bold text-gray-900 line-clamp-2 mb-1">{product.name}</h3>
              <p className="text-xs text-gray-600 line-clamp-2 mb-3">{product.description}</p>

              {/* Prices */}
              <div className="flex gap-4 mb-3">
                <div>
                  <p className="text-xs text-gray-600 font-semibold">SELL</p>
                  <p className="text-lg font-bold text-lime-600">₦{product.sellPrice.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-semibold">RENT</p>
                  <p className="text-lg font-bold text-blue-600">₦{product.rentPrice.toLocaleString()}</p>
                </div>
              </div>

              {/* Condition Badge */}
              <div className="inline-block bg-gray-100 text-gray-700 text-xs font-semibold px-3 py-1 rounded-full mb-3">
                {product.condition}
              </div>

              {/* Country Badge - Show if product has country */}
              {product.country && (
                <div className="inline-block ml-2 bg-lime-100 text-lime-700 text-xs font-semibold px-3 py-1 rounded-full mb-3">
                  🌍 {product.country}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-3 border-t border-gray-200">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteProduct(product._id);
                  }}
                  disabled={deletingId === product._id}
                  className="flex-1 py-2 px-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-semibold text-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  {deletingId === product._id ? "Deleting..." : "Delete"}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingProduct(product);
                  }}
                  className="flex-1 py-2 px-3 bg-lime-50 hover:bg-lime-100 text-lime-600 rounded-lg font-semibold text-sm transition flex items-center justify-center gap-2"
                >
                  <Edit2 className="h-4 w-4" />
                  Edit
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="w-full bg-white rounded-t-3xl overflow-hidden max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom">
            {/* Close Button */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
              <h2 className="font-bold text-lg">{selectedProduct.name}</h2>
              <button
                onClick={() => setSelectedProduct(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Image Carousel */}
            <div className="w-full aspect-square bg-gray-100 relative overflow-hidden">
              <Image
                src={selectedProduct.imageUrl}
                alt={selectedProduct.name}
                fill
                className="object-cover"
              />
            </div>

            {/* Details */}
            <div className="p-6 space-y-4">
              {/* Prices */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-lime-50 p-4 rounded-2xl">
                  <p className="text-xs text-gray-600 font-bold mb-1">SELL PRICE</p>
                  <p className="text-2xl font-bold text-lime-600">₦{selectedProduct.sellPrice.toLocaleString()}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-2xl">
                  <p className="text-xs text-gray-600 font-bold mb-1">RENT PRICE</p>
                  <p className="text-2xl font-bold text-blue-600">₦{selectedProduct.rentPrice.toLocaleString()}</p>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Description</h3>
                <p className="text-sm text-gray-700 leading-relaxed">{selectedProduct.description}</p>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600 font-bold">Category</p>
                  <p className="text-sm font-bold text-gray-900">{selectedProduct.category}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600 font-bold">Condition</p>
                  <p className="text-sm font-bold text-gray-900">{selectedProduct.condition}</p>
                </div>
              </div>

              {/* All Images */}
              {selectedProduct.imageUrls && selectedProduct.imageUrls.length > 1 && (
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">All Photos ({selectedProduct.imageUrls.length})</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedProduct.imageUrls.map((url, idx) => (
                      <div key={idx} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                        <Image
                          src={url}
                          alt={`Photo ${idx + 1}`}
                          width={150}
                          height={150}
                          className="object-cover w-full h-full"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    deleteProduct(selectedProduct._id);
                  }}
                  className="flex-1 py-4 px-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-lg transition flex items-center justify-center gap-2"
                >
                  <Trash2 className="h-5 w-5" />
                  Delete
                </button>
                <button
                  onClick={() => setEditingProduct(selectedProduct)}
                  className="flex-1 py-4 px-4 bg-lime-500 hover:bg-lime-600 text-white rounded-xl font-bold text-lg transition flex items-center justify-center gap-2"
                >
                  <Edit2 className="h-5 w-5" />
                  Edit
                </button>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="flex-1 py-4 px-4 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-xl font-bold text-lg transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <EditProductModal
          product={editingProduct as any}
          onClose={() => setEditingProduct(null)}
          onSave={handleEditProduct as any}
          isSaving={isSaving}
        />
      )}
    </div>
  );
}
