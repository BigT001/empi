'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X, AlertCircle } from 'lucide-react';

export interface Product {
  _id: string;
  id?: string;
  name: string;
  description: string;
  imageUrl: string;
  imageUrls?: string[];
  sellPrice: number;
  rentPrice: number;
  category: string;
  costumeType?: string;
  badge?: string | null;
  sizes?: string;
  color?: string;
  material?: string;
  condition?: string;
}

interface EditProductModalProps {
  product: Product | null;
  onClose: () => void;
  onSave: (updatedProduct: Product) => Promise<void>;
  isSaving?: boolean;
}

export default function EditProductModal({
  product,
  onClose,
  onSave,
  isSaving = false,
}: EditProductModalProps) {
  const [formData, setFormData] = useState<Product | null>(product);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!product || !formData) return null;

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [name]: name === 'sellPrice' || name === 'rentPrice' ? parseFloat(value) : value,
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!formData) return;

    // Validation
    if (!formData.name.trim()) {
      setError('Product name is required');
      return;
    }

    if (!formData.description.trim()) {
      setError('Product description is required');
      return;
    }

    if (formData.sellPrice <= 0) {
      setError('Sell price must be greater than 0');
      return;
    }

    if (formData.rentPrice < 0) {
      setError('Rent price cannot be negative');
      return;
    }

    try {
      await onSave(formData);
      setSuccessMessage('✅ Product updated successfully!');
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save product');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full my-8">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-2xl font-bold text-gray-900">Edit Product</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="h-6 w-6 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-200px)]">
          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900">Error</h3>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 font-medium">{successMessage}</p>
            </div>
          )}

          {/* Product Image Preview */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">Product Image</label>
            <div className="relative w-full h-80 bg-gray-100 rounded-xl overflow-hidden border-2 border-gray-200">
              <Image
                src={formData.imageUrl}
                alt={formData.name}
                fill
                className="object-cover"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              ℹ️ To change the image, delete this product and upload a new one
            </p>
          </div>

          {/* Product Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-bold text-gray-700 mb-2">
              Product Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter product name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-bold text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Enter product description"
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
            />
          </div>

          {/* Prices */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="sellPrice" className="block text-sm font-bold text-gray-700 mb-2">
                Sell Price (₦) *
              </label>
              <input
                type="number"
                id="sellPrice"
                name="sellPrice"
                value={formData.sellPrice}
                onChange={handleInputChange}
                placeholder="0"
                step="0.01"
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
              />
            </div>
            <div>
              <label htmlFor="rentPrice" className="block text-sm font-bold text-gray-700 mb-2">
                Rent Price (₦/day) *
              </label>
              <input
                type="number"
                id="rentPrice"
                name="rentPrice"
                value={formData.rentPrice}
                onChange={handleInputChange}
                placeholder="0"
                step="0.01"
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-bold text-gray-700 mb-2">
              Category *
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
            >
              <option value="adults">👔 Adults</option>
              <option value="kids">👶 Kids</option>
            </select>
          </div>

          {/* Costume Type */}
          <div>
            <label htmlFor="costumeType" className="block text-sm font-bold text-gray-700 mb-2">
              Costume Type
            </label>
            <select
              id="costumeType"
              name="costumeType"
              value={formData.costumeType || "Other"}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
            >
              <option value="Angel">👼 Angel</option>
              <option value="Carnival">🎪 Carnival</option>
              <option value="Superhero">🦸 Superhero</option>
              <option value="Traditional">🥁 Traditional</option>
              <option value="Cosplay">🎭 Cosplay</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label htmlFor="condition" className="block text-sm font-bold text-gray-700 mb-2">
              Condition *
            </label>
            <select
              id="condition"
              name="condition"
              value={formData.condition || ''}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
            >
              <option value="">Select condition</option>
              <option value="New">New</option>
              <option value="Like New">Like New</option>
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
            </select>
          </div>

          {/* Additional Details */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-4">Additional Details</label>
            <div className="space-y-3">
              <input
                type="text"
                name="color"
                value={formData.color || ''}
                onChange={handleInputChange}
                placeholder="Color (e.g., Red, Blue)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
              />
              <input
                type="text"
                name="material"
                value={formData.material || ''}
                onChange={handleInputChange}
                placeholder="Material (e.g., Cotton, Silk)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
              />
              <input
                type="text"
                name="sizes"
                value={formData.sizes || ''}
                onChange={handleInputChange}
                placeholder="Available Sizes (e.g., S, M, L, XL)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
              />
              <input
                type="text"
                name="badge"
                value={formData.badge || ''}
                onChange={handleInputChange}
                placeholder="Badge (e.g., Sale, New, Trending) - Leave empty for none"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-3 px-4 bg-lime-600 hover:bg-lime-700 text-white rounded-lg font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 py-3 px-4 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg font-bold transition disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
