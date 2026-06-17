"use client";

import { useState, useEffect, useMemo } from "react";
import { Package, Search, AlertCircle, Trash2, Edit2, X, ChevronDown, ChevronUp } from "lucide-react";
import Image from "next/image";
import EditProductModal from "../components/EditProductModal";


interface ProductData {
  _id: string;
  id?: string;
  name: string;
  description: string;
  category: string;
  sellPrice: number;
  rentPrice: number;
  imageUrl: string;
  imageUrls?: string[];
  badge?: string;
  createdAt: string;
  color?: string;
  material?: string;
  sizes?: string;
  condition?: string;
}

export function ProductsPanel() {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [editingProduct, setEditingProduct] = useState<ProductData | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const loadProducts = async () => {
    let mounted = true;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/products?limit=500');
      if (!res.ok) throw new Error('Failed to load products');
      const data = await res.json();
      const productsList = Array.isArray(data) ? data : (data.data || data.products || []);
      if (mounted) setProducts(productsList);
    } catch (err: any) {
      console.error('[ProductsPanel] Error loading products:', err);
      if (mounted) setError(err.message || 'Failed to load products');
    } finally {
      if (mounted) setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = ['all', ...new Set(products.map(p => p.category))];
    return cats.filter(c => c);
  }, [products]);

  // Filter and search products
  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(p => p.category === categoryFilter);
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [products, searchQuery, categoryFilter]);

  const formatCurrency = (amount: number) => `₦${Number(amount || 0).toLocaleString()}`;

  const getCategoryStats = () => {
    return categories.reduce((acc, cat) => {
      if (cat === 'all') return acc;
      acc[cat] = products.filter(p => p.category === cat).length;
      return acc;
    }, {} as Record<string, number>);
  };

  const handleDeleteProduct = async (productId: string, imageUrls: string[]) => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }

    setDeletingId(productId);
    setDeleteError(null);
    
    try {
      const deleteResponse = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });

      if (!deleteResponse.ok) {
        throw new Error('Failed to delete product');
      }

      // Delete images from Cloudinary
      if (imageUrls && imageUrls.length > 0) {
        for (const imageUrl of imageUrls) {
          try {
            const urlParts = imageUrl.split('/');
            const lastPart = urlParts[urlParts.length - 1];
            const publicId = lastPart.includes('.') ? lastPart.split('.')[0] : lastPart;
            const folderPrefix = imageUrl.includes('/empi/') ? 'empi/' : '';
            const fullPublicId = folderPrefix + publicId;

            await fetch('/api/cloudinary/delete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ publicId: fullPublicId }),
            });
          } catch (err) {
            console.error('Failed to delete image from Cloudinary:', err);
          }
        }
      }

      setProducts(products.filter(p => p._id !== productId && p.id !== productId));
      setSuccessMessage('Product deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete product');
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditProduct = async (updatedProduct: ProductData) => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/products/${updatedProduct._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProduct),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update product');
      }

      const updated = await response.json();
      setProducts((prev) =>
        prev.map((p) => (p._id === updated._id ? updated : p))
      );
      setEditingProduct(null);
      setSuccessMessage('✅ Product updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update product';
      setDeleteError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const stats = getCategoryStats();

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Products Catalog</h2>
            <p className="text-green-100 mt-1">{products.length} total products</p>
          </div>
          <Package className="h-8 w-8 opacity-20" />
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-green-200" />
          <input
            type="text"
            placeholder="Search products by name or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-green-500 placeholder-green-200 text-white outline-none focus:ring-2 focus:ring-white focus:bg-green-600 transition"
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 font-medium">{successMessage}</p>
          </div>
        )}

        {/* Error State */}
        {(error || deleteError) && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900">Error</p>
              <p className="text-sm text-red-700">{error || deleteError}</p>
              <button
                onClick={() => {
                  setError(null);
                  setDeleteError(null);
                  loadProducts();
                }}
                className="mt-2 text-sm font-semibold text-red-700 hover:text-red-900 underline"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="space-y-3">
              <div className="h-8 w-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto" />
              <p className="text-gray-600 text-sm">Loading products...</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && products.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Package className="h-6 w-6 text-gray-400" />
              </div>
              <p className="font-semibold text-gray-900">No products yet</p>
              <p className="text-gray-600 text-sm mt-1">Products will appear here once you add them</p>
            </div>
          </div>
        )}

        {/* Category Filter Tabs */}
        {!loading && !error && products.length > 0 && (
          <>
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap font-semibold transition ${
                    categoryFilter === cat
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat === 'all' ? 'All Products' : cat}
                  {cat !== 'all' && <span className="text-xs ml-1">({stats[cat] || 0})</span>}
                </button>
              ))}
            </div>

            {/* Products Grid */}
            {filteredProducts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No products found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredProducts.map((product) => (
                  <div key={product._id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition hover:border-green-300 flex flex-col">
                    {/* Image */}
                    <div className="relative aspect-square bg-gray-100 overflow-hidden">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover hover:scale-105 transition"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Package className="h-12 w-12" />
                        </div>
                      )}
                      {product.badge && (
                        <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold">
                          {product.badge}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-3 flex flex-col flex-1">
                      <h3 className="font-semibold text-gray-900 line-clamp-2 text-sm mb-2">
                        {product.name}
                      </h3>

                      {/* Category Badge */}
                      <div className="mb-3">
                        <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
                          {product.category}
                        </span>
                      </div>

                      {/* Prices */}
                      <div className="space-y-1 border-t border-gray-200 pt-2 mb-3 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">Sell Price</span>
                          <span className="font-bold text-green-600">{formatCurrency(product.sellPrice)}</span>
                        </div>
                        {product.rentPrice > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600">Rent Price</span>
                            <span className="font-bold text-blue-600">{formatCurrency(product.rentPrice)}</span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2 border-t border-gray-200">
                        <button
                          onClick={() => setEditingProduct(product)}
                          className="flex-1 py-2 px-2 bg-lime-50 hover:bg-lime-100 text-lime-700 rounded-lg font-semibold transition text-xs flex items-center justify-center gap-1"
                        >
                          <Edit2 className="h-3 w-3" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product._id || product.id!, product.imageUrls || [product.imageUrl])}
                          disabled={deletingId === (product._id || product.id)}
                          className="flex-1 py-2 px-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg font-semibold transition text-xs flex items-center justify-center gap-1 disabled:opacity-50"
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {searchQuery && (
              <p className="text-sm text-gray-600 mt-4">
                Showing {filteredProducts.length} of {products.length} products
              </p>
            )}

            {/* Stats Footer */}
            <div className="mt-8 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
              <p className="text-gray-700 font-medium">
                📊 Total Products: <span className="text-green-600 font-bold">{products.length}</span> | Showing: <span className="text-green-600 font-bold">{filteredProducts.length}</span>
              </p>
            </div>
          </>
        )}
      </div>

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
