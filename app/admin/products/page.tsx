'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { Trash2, AlertCircle, ChevronDown, Edit2 } from 'lucide-react';
import { useResponsive } from "@/app/hooks/useResponsive";

// Components
import EditProductModal, { Product } from "../components/EditProductModal";

export default function ProductsPage() {
  const { mounted } = useResponsive();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch products from database
  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/products');
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  if (!mounted) {
    return null;
  }

  const handleDeleteProduct = async (productId: string, imageUrls: string[]) => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }

    setDeletingId(productId);
    setDeleteError('');
    
    try {
      // Delete product from database
      const deleteResponse = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });

      if (!deleteResponse.ok) {
        throw new Error('Failed to delete product from database');
      }

      // Delete images from Cloudinary
      if (imageUrls && imageUrls.length > 0) {
        for (const imageUrl of imageUrls) {
          try {
            // Extract public ID from Cloudinary URL
            // URL format: https://res.cloudinary.com/[cloud]/image/upload/[folder]/[public_id].[ext]
            const urlParts = imageUrl.split('/');
            const lastPart = urlParts[urlParts.length - 1];
            const publicId = lastPart.includes('.') ? lastPart.split('.')[0] : lastPart;
            
            // Add folder prefix if needed
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

      // Remove product from UI
      setProducts(products.filter(p => p._id !== productId && p.id !== productId));
      setSuccessMessage('Product deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete product');
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditProduct = async (updatedProduct: Product) => {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 w-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Products Management</h1>
        <p className="text-gray-600">View, manage and delete your products and images</p>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">Error</h3>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-700 font-medium">{successMessage}</p>
        </div>
      )}

      {deleteError && (
        <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg flex gap-3">
          <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-orange-900">Delete Error</h3>
            <p className="text-orange-700 text-sm">{deleteError}</p>
          </div>
        </div>
      )}

      {/* Products Grid */}
      {products.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500 font-medium mb-2">No products found</p>
          <p className="text-gray-400 text-sm">Start by adding your first product</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {products.map((product, index) => {
            const uniqueKey = `product-${index}`;
            return (
            <div key={uniqueKey} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition border border-gray-200">
              {/* Product Image */}
              <div className="relative w-full h-64 bg-gray-100 overflow-hidden">
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  className="object-cover hover:scale-105 transition duration-300"
                />
                {product.badge && (
                  <div className="absolute top-3 right-3 bg-lime-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                    {product.badge}
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-5">
                {/* Name & Category */}
                <div className="mb-3">
                  <h3 className="font-bold text-gray-900 text-lg mb-1">{product.name}</h3>
                  <span className="inline-block text-xs font-semibold uppercase tracking-wider px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                    {product.category === 'kids' ? '👶 Kids' : '👔 Adults'}
                  </span>
                </div>

                {/* Description */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {product.description || 'No description'}
                </p>

                {/* Pricing */}
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-gray-600 text-sm">Sell Price:</span>
                    <span className="font-bold text-gray-900">₦{product.sellPrice.toLocaleString()}</span>
                  </div>
                  {product.rentPrice > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 text-sm">Rent Price:</span>
                      <span className="font-bold text-blue-600">₦{product.rentPrice.toLocaleString()}/day</span>
                    </div>
                  )}
                </div>

                {/* Expand/Collapse Details Button */}
                <button
                  onClick={() => setExpandedId(expandedId === uniqueKey ? null : uniqueKey)}
                  className="w-full py-2 px-3 flex items-center justify-between hover:bg-gray-50 rounded-lg transition mb-2"
                >
                  <span className="text-xs text-gray-600 font-medium uppercase tracking-wider">Details</span>
                  <ChevronDown 
                    className={`h-4 w-4 text-gray-600 transition-transform ${
                      expandedId === uniqueKey ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Collapsible Product Details */}
                {expandedId === uniqueKey && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm space-y-2 border border-gray-200">
                    {product.color && (
                      <p><span className="text-gray-600">Color:</span> <span className="font-medium text-gray-900">{product.color}</span></p>
                    )}
                    {product.material && (
                      <p><span className="text-gray-600">Material:</span> <span className="font-medium text-gray-900">{product.material}</span></p>
                    )}
                    {product.sizes && (
                      <p><span className="text-gray-600">Sizes:</span> <span className="font-medium text-gray-900">{product.sizes}</span></p>
                    )}
                    {product.imageUrls && product.imageUrls.length > 1 && (
                      <p className="text-xs text-gray-600 pt-2">
                        📸 {product.imageUrls.length} images
                      </p>
                    )}
                  </div>
                )}

                {/* Product Details (Hidden - will be removed after collapsible added) */}
                <div className="mb-4 text-sm space-y-1 hidden">
                  {product.color && (
                    <p><span className="text-gray-600">Color:</span> <span className="font-medium text-gray-900">{product.color}</span></p>
                  )}
                  {product.material && (
                    <p><span className="text-gray-600">Material:</span> <span className="font-medium text-gray-900">{product.material}</span></p>
                  )}
                  {product.sizes && (
                    <p><span className="text-gray-600">Sizes:</span> <span className="font-medium text-gray-900">{product.sizes}</span></p>
                  )}
                </div>

                {/* Images Count */}
                {product.imageUrls && product.imageUrls.length > 1 && (
                  <p className="text-xs text-gray-500 mb-4 hidden">
                    📸 {product.imageUrls.length} images
                  </p>
                )}

                {/* Delete Button */}
                <button
                  onClick={() => handleDeleteProduct(product._id, (product.imageUrls && product.imageUrls.length > 0) ? product.imageUrls : [product.imageUrl])}
                  disabled={deletingId === product._id}
                  className="w-full py-2.5 px-4 bg-red-50 hover:bg-red-100 text-red-700 hover:text-red-800 border border-red-200 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  {deletingId === product._id ? 'Deleting...' : 'Delete Product'}
                </button>

                {/* Edit Button */}
                <button
                  onClick={() => setEditingProduct(product)}
                  className="w-full py-2.5 px-4 bg-lime-50 hover:bg-lime-100 text-lime-700 hover:text-lime-800 border border-lime-200 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                >
                  <Edit2 className="h-4 w-4" />
                  Edit Product
                </button>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* Stats Footer */}
      <div className="mt-8 p-4 bg-gradient-to-r from-lime-50 to-blue-50 rounded-lg border border-lime-200">
        <p className="text-gray-700 font-medium">
          📊 Total Products: <span className="text-lime-600 font-bold">{products.length}</span>
        </p>
      </div>

      {/* Edit Product Modal - Using Component */}
      <EditProductModal
        product={editingProduct}
        onClose={() => setEditingProduct(null)}
        onSave={handleEditProduct}
        isSaving={isSaving}
      />
    </div>
  );
}
