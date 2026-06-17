'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X, AlertCircle, Plus, Check, ChevronRight, Palette, Ruler } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────
export interface NestedSizeEntry {
  size: string;
  displayForSale: boolean;
  displayForRent: boolean;
}

export interface VariantGroup {
  colorName: string;
  colorHex?: string;
  sizes: NestedSizeEntry[];
}

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
  country?: string;
  badge?: string | null;
  variants?: VariantGroup[];
  sizes?: any;
  colors?: any;
  color?: string;
  material?: string;
  condition?: string;
  careInstructions?: string;
  availableForBuy?: boolean;
  availableForRent?: boolean;
}

// ─── Color resolver ───────────────────────────────────────────────────────────
const colorDictionary: Record<string, string> = {
  burgundy: '#800020', emerald: '#50c878', ruby: '#e0115f', sapphire: '#0f52ba',
  rose: '#ff007f', mint: '#3eb489', mustard: '#e1ad01', wine: '#722f37',
  champagne: '#f7e7ce', cream: '#fffdd0', apricot: '#fbceb1', mauve: '#e0b0ff',
  amber: '#ffbf00', bronze: '#cd7f32', copper: '#b87333', brass: '#b5a642',
  rust: '#b7410e', 'rose gold': '#b76e79', rosegold: '#b76e79',
  'emerald green': '#50c878', 'royal blue': '#4169e1', 'sky blue': '#87ceeb',
  'navy blue': '#000080', 'forest green': '#228b22', 'hot pink': '#ff69b4',
  'dark red': '#8b0000', 'light blue': '#add8e6', gold: '#ffd700',
  silver: '#c0c0c0', black: '#111111', white: '#f5f5f5', red: '#ef4444',
  blue: '#3b82f6', green: '#22c55e', yellow: '#eab308', orange: '#f97316',
  purple: '#a855f7', pink: '#ec4899', gray: '#6b7280', brown: '#92400e',
};

export function getVariantColorStyle(name: string): React.CSSProperties {
  const normalized = name.trim().toLowerCase();
  if (colorDictionary[normalized]) return { backgroundColor: colorDictionary[normalized] };
  if (typeof window !== 'undefined' && CSS.supports('color', normalized))
    return { backgroundColor: normalized };
  const charCode = normalized.charCodeAt(0) || 0;
  const hue = (charCode * 7) % 360;
  return {
    background: `linear-gradient(135deg, hsl(${hue},70%,60%), hsl(${(hue + 40) % 360},70%,45%))`,
    color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 'bold', fontSize: '0.75rem',
  };
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface EditProductModalProps {
  product: Product | null;
  onClose: () => void;
  onSave: (updatedProduct: Product) => Promise<void>;
  isSaving?: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function EditProductModal({
  product,
  onClose,
  onSave,
  isSaving = false,
}: EditProductModalProps) {
  if (!product) return null;

  // ── Migrate legacy data ──
  let initialVariants: VariantGroup[] = [];
  if (Array.isArray(product?.variants) && product.variants.length > 0) {
    initialVariants = product.variants;
  } else if (product) {
    let legacySizes: NestedSizeEntry[] = [];
    if (Array.isArray(product.sizes)) {
      legacySizes = product.sizes
        .map((s: any) => ({
          size: typeof s === 'string' ? s : s.name || s.size || '',
          displayForSale: s.displayInStore !== false && s.displayForSale !== false,
          displayForRent: s.displayInStore !== false && s.displayForRent !== false,
        }))
        .filter((s) => s.size);
    } else if (typeof product.sizes === 'string' && product.sizes.trim()) {
      legacySizes = product.sizes
        .split(',')
        .map((s: string) => ({ size: s.trim(), displayForSale: true, displayForRent: true }))
        .filter((s) => s.size);
    }

    if (Array.isArray(product.colors) && product.colors.length > 0) {
      initialVariants = product.colors
        .map((c: any) => ({
          colorName: typeof c === 'string' ? c : c.name || '',
          colorHex: c.hexCode || '',
          sizes: legacySizes,
        }))
        .filter((c) => c.colorName);
    } else if (typeof product.color === 'string' && product.color.trim()) {
      initialVariants = product.color
        .split(',')
        .map((c: string) => ({ colorName: c.trim(), colorHex: '', sizes: legacySizes }))
        .filter((c) => c.colorName);
    } else if (legacySizes.length > 0) {
      initialVariants = [{ colorName: 'Standard', colorHex: '', sizes: legacySizes }];
    }
  }

  // ── Form State ──
  const [formData, setFormData] = useState<any>({
    ...product,
    variants: initialVariants,
    availableForBuy: product.availableForBuy ?? true,
    availableForRent: product.availableForRent ?? true,
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // ── Color Group Modal State ──
  const [isColorModalOpen, setIsColorModalOpen] = useState(false);
  const [editingColorIndex, setEditingColorIndex] = useState<number | null>(null);
  const [modalColorName, setModalColorName] = useState('');
  const [modalSizes, setModalSizes] = useState<NestedSizeEntry[]>([]);
  const [modalNewSizeName, setModalNewSizeName] = useState('');
  const [modalNewSizeForSale, setModalNewSizeForSale] = useState(true);
  const [modalNewSizeForRent, setModalNewSizeForRent] = useState(true);

  // ── Handlers ──
  const handleInput = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: name === 'sellPrice' || name === 'rentPrice' ? parseFloat(value) || 0 : value,
    }));
  };

  const openAddColorModal = () => {
    setEditingColorIndex(null);
    setModalColorName('');
    setModalSizes([]);
    setModalNewSizeName('');
    setModalNewSizeForSale(true);
    setModalNewSizeForRent(true);
    setIsColorModalOpen(true);
  };

  const openEditColorModal = (idx: number) => {
    const variant = formData.variants[idx];
    setEditingColorIndex(idx);
    setModalColorName(variant.colorName);
    setModalSizes([...(variant.sizes || [])]);
    setModalNewSizeName('');
    setModalNewSizeForSale(true);
    setModalNewSizeForRent(true);
    setIsColorModalOpen(true);
  };

  const addSizeToModal = () => {
    const val = modalNewSizeName.trim();
    if (!val || modalSizes.some((s) => s.size.toLowerCase() === val.toLowerCase())) return;
    setModalSizes((prev) => [
      ...prev,
      { size: val, displayForSale: modalNewSizeForSale, displayForRent: modalNewSizeForRent },
    ]);
    setModalNewSizeName('');
  };

  const saveColorGroup = () => {
    if (!modalColorName.trim()) return;
    const newGroup: VariantGroup = {
      colorName: modalColorName.trim(),
      colorHex: '',
      sizes: modalSizes,
    };
    if (editingColorIndex !== null) {
      const updated = [...formData.variants];
      updated[editingColorIndex] = newGroup;
      setFormData((prev: any) => ({ ...prev, variants: updated }));
    } else {
      setFormData((prev: any) => ({
        ...prev,
        variants: [...(prev.variants || []), newGroup],
      }));
    }
    setIsColorModalOpen(false);
  };

  const removeVariant = (idx: number) => {
    setFormData((prev: any) => ({
      ...prev,
      variants: prev.variants.filter((_: any, i: number) => i !== idx),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    if (!formData.name?.trim()) return setError('Product name is required');
    if (!formData.description?.trim()) return setError('Description is required');
    if ((formData.sellPrice ?? 0) <= 0) return setError('Sell price must be greater than 0');
    try {
      await onSave(formData);
      setSuccessMessage('✅ Product updated successfully!');
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save product');
    }
  };

  const colorStyle = (name: string) => getVariantColorStyle(name);

  return (
    <>
      {/* ── Main Edit Modal ── */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl w-full max-w-2xl my-8 shadow-2xl flex flex-col">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
            <div>
              <h2 className="text-xl font-black text-gray-900">Edit Product</h2>
              <p className="text-xs text-lime-600 font-semibold uppercase tracking-widest mt-0.5">
                EMPI Costumes Admin
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-xl transition text-gray-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Scrollable Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[80vh]">

            {/* Alerts */}
            {error && (
              <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            )}
            {successMessage && (
              <div className="flex gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-700 font-medium">{successMessage}</p>
              </div>
            )}

            {/* Image Preview */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                Product Image
              </label>
              <div className="relative w-full h-56 bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                <Image src={formData.imageUrl} alt={formData.name} fill className="object-cover" />
                {formData.imageUrls && formData.imageUrls.length > 1 && (
                  <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded-full">
                    📸 {formData.imageUrls.length} photos
                  </div>
                )}
              </div>
              <p className="text-[11px] text-gray-400 mt-1.5">
                ℹ️ To change photos, delete this product and re-upload with new images.
              </p>
            </div>

            {/* ── Section: Basic Info ── */}
            <div className="space-y-4">
              <SectionTitle emoji="📋" title="Basic Information" />

              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                  Product Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name || ''}
                  onChange={handleInput}
                  placeholder="e.g., Sexy in Red Carnival Set"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-lime-400 !text-black !bg-white"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description || ''}
                  onChange={handleInput}
                  rows={3}
                  placeholder="Describe the costume..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-lime-400 !text-black !bg-white"
                />
              </div>
            </div>

            {/* ── Section: Pricing ── */}
            <div className="space-y-4">
              <SectionTitle emoji="💰" title="Pricing" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                    Sell Price (₦) *
                  </label>
                  <input
                    type="number"
                    name="sellPrice"
                    value={formData.sellPrice || ''}
                    onChange={handleInput}
                    placeholder="0"
                    min="0"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-lime-400 !text-black !bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                    Rent Price (₦/day)
                  </label>
                  <input
                    type="number"
                    name="rentPrice"
                    value={formData.rentPrice || ''}
                    onChange={handleInput}
                    placeholder="0"
                    min="0"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-lime-400 !text-black !bg-white"
                  />
                </div>
              </div>
            </div>

            {/* ── Section: Categories ── */}
            <div className="space-y-4">
              <SectionTitle emoji="🎭" title="Category & Type" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category || 'adults'}
                    onChange={handleInput}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-lime-400 !text-black !bg-white"
                  >
                    <option value="adults">👔 Adults</option>
                    <option value="kids">👶 Kids</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                    Costume Type
                  </label>
                  <select
                    name="costumeType"
                    value={formData.costumeType || 'Other'}
                    onChange={handleInput}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-lime-400 !text-black !bg-white"
                  >
                    <option value="Angel">👼 Angel</option>
                    <option value="Carnival">🎪 Carnival</option>
                    <option value="Western">🤠 Western</option>
                    <option value="Traditional Africa">🥁 Traditional Africa</option>
                    <option value="Cosplay">🎭 Cosplay</option>
                    <option value="Superhero">🦸 Superhero</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Condition & Material */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                    Condition
                  </label>
                  <select
                    name="condition"
                    value={formData.condition || ''}
                    onChange={handleInput}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-lime-400 !text-black !bg-white"
                  >
                    <option value="">Select condition</option>
                    <option value="new">✨ New</option>
                    <option value="like-new">⭐ Like New</option>
                    <option value="good">👍 Good</option>
                    <option value="fair">🔧 Fair</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                    Material
                  </label>
                  <input
                    type="text"
                    name="material"
                    value={formData.material || ''}
                    onChange={handleInput}
                    placeholder="e.g., Cotton, Silk"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-lime-400 !text-black !bg-white"
                  />
                </div>
              </div>

              {/* Badge */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                  Badge <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  name="badge"
                  value={formData.badge || ''}
                  onChange={handleInput}
                  placeholder="e.g., New, Sale, Premium"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-lime-400 !text-black !bg-white"
                />
              </div>
            </div>

            {/* ── Section: Variants ── */}
            <div className="space-y-4">
              <SectionTitle emoji="👕" title="Colors & Sizes Variants" />

              <div className="bg-gray-50 rounded-2xl border border-gray-200 p-4">
                {/* Add Color Button */}
                <div className="flex justify-center mb-4">
                  <button
                    type="button"
                    onClick={openAddColorModal}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-gray-900 to-black text-white rounded-xl text-sm font-bold shadow hover:shadow-lg transition hover:-translate-y-0.5 active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    Add Color Group
                  </button>
                </div>

                {/* Variant Cards */}
                {formData.variants && formData.variants.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {formData.variants.map((variant: VariantGroup, vIdx: number) => {
                      const cs = colorStyle(variant.colorName);
                      const isGradient = !!cs.background;
                      return (
                        <div
                          key={vIdx}
                          className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow transition"
                        >
                          {/* Color Header */}
                          <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100 bg-gray-50/60">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-5 h-5 rounded-full border border-gray-200 shadow-inner flex-shrink-0 flex items-center justify-center"
                                style={cs}
                              >
                                {isGradient && (
                                  <span className="text-white text-[8px] font-black uppercase">
                                    {variant.colorName.charAt(0)}
                                  </span>
                                )}
                              </div>
                              <span className="font-bold text-gray-900 text-xs">
                                {variant.colorName}
                              </span>
                              <span className="text-[9px] font-bold bg-gray-200/70 text-gray-500 px-1.5 py-0.5 rounded">
                                {variant.sizes?.length || 0} sizes
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => openEditColorModal(vIdx)}
                                className="text-[10px] font-black text-lime-600 hover:bg-lime-50 px-2 py-1 rounded transition uppercase tracking-wider"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => removeVariant(vIdx)}
                                className="text-gray-300 hover:text-red-400 hover:bg-red-50 p-1 rounded transition"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Sizes */}
                          <div className="p-2.5 flex flex-wrap gap-1.5">
                            {variant.sizes && variant.sizes.length > 0 ? (
                              variant.sizes.map((sz, sIdx) => {
                                const tag = [sz.displayForSale ? 'S' : '', sz.displayForRent ? 'R' : '']
                                  .filter(Boolean)
                                  .join('/');
                                return (
                                  <span
                                    key={sIdx}
                                    className="inline-flex items-center gap-0.5 bg-gray-100 text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded"
                                  >
                                    {sz.size}
                                    {tag && (
                                      <span className="text-[8px] text-gray-400 font-black ml-0.5">
                                        ({tag})
                                      </span>
                                    )}
                                  </span>
                                );
                              })
                            ) : (
                              <p className="text-[11px] text-gray-400 italic">
                                No sizes — click Edit to add
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
                    <Palette className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm font-bold text-gray-400">No variants yet</p>
                    <p className="text-xs text-gray-400">Click "Add Color Group" to start</p>
                  </div>
                )}
              </div>
            </div>

            {/* ── Section: Availability ── */}
            <div className="space-y-3">
              <SectionTitle emoji="📦" title="Availability" />
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl hover:border-lime-300 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={formData.availableForBuy ?? true}
                  onChange={(e) => setFormData((p: any) => ({ ...p, availableForBuy: e.target.checked }))}
                  className="w-5 h-5 accent-lime-600 rounded"
                />
                <div>
                  <p className="text-sm font-semibold text-gray-900">🛒 Available for Purchase</p>
                  <p className="text-xs text-gray-500">Show this product in the sale section</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl hover:border-lime-300 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={formData.availableForRent ?? true}
                  onChange={(e) => setFormData((p: any) => ({ ...p, availableForRent: e.target.checked }))}
                  className="w-5 h-5 accent-lime-600 rounded"
                />
                <div>
                  <p className="text-sm font-semibold text-gray-900">🎪 Available for Rental</p>
                  <p className="text-xs text-gray-500">Show this product in the rental section</p>
                </div>
              </label>
            </div>

            {/* ── Sticky Footer Actions ── */}
            <div className="flex gap-3 pt-2 border-t border-gray-100 sticky bottom-0 bg-white py-4">
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 py-3 px-4 bg-lime-600 hover:bg-lime-700 text-white rounded-xl font-bold transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-lime-500/20 active:scale-95"
              >
                {isSaving ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block animate-spin">⏳</span>
                    Saving...
                  </span>
                ) : (
                  '✅ Save Changes'
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-xl font-bold transition disabled:opacity-50 active:scale-95"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ── Color Group Sub-Modal ── */}
      {isColorModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-y-auto max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-base font-black text-gray-900">
                  {editingColorIndex !== null ? 'Edit Color Group' : 'Add Color Group'}
                </h3>
                <p className="text-xs font-bold text-lime-600 uppercase tracking-widest mt-0.5">
                  Configure color & sizes
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsColorModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Color Name + Preview */}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">
                  Color Name
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={modalColorName}
                    onChange={(e) => setModalColorName(e.target.value)}
                    placeholder="e.g. Midnight Blue, Crimson Red"
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-gray-900 !text-black !bg-white transition"
                    autoFocus
                  />
                  {modalColorName.trim() && (
                    <div
                      className="w-12 h-12 rounded-xl border border-gray-200 shadow-inner flex-shrink-0 flex items-center justify-center transition-all"
                      style={colorStyle(modalColorName)}
                    >
                      {colorStyle(modalColorName).display === 'flex' && (
                        <span className="text-white text-xs font-black uppercase">
                          {modalColorName.trim().charAt(0)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-gray-400 mt-1.5">
                  The color will auto-preview — try: red, gold, navy blue, rose gold…
                </p>
              </div>

              {/* Sizes Section */}
              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Ruler className="w-3.5 h-3.5 text-gray-500" />
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-widest">
                    Sizes & Availability
                  </h4>
                </div>

                {/* Add Size Sub-form */}
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-3 mb-3">
                  <div className="grid grid-cols-3 gap-2 items-end">
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                        Size
                      </label>
                      <input
                        type="text"
                        value={modalNewSizeName}
                        onChange={(e) => setModalNewSizeName(e.target.value)}
                        placeholder="e.g. S, XL, 32"
                        className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-gray-900 !text-black !bg-white"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addSizeToModal();
                          }
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={addSizeToModal}
                      disabled={!modalNewSizeName.trim()}
                      className="py-2.5 bg-gray-900 hover:bg-black disabled:bg-gray-200 disabled:text-gray-400 text-white font-black rounded-xl text-xs transition active:scale-95"
                    >
                      Add
                    </button>
                  </div>

                  {/* Availability Checkboxes */}
                  <div className="flex gap-5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={modalNewSizeForSale}
                        onChange={(e) => setModalNewSizeForSale(e.target.checked)}
                        className="w-4 h-4 accent-lime-600 rounded cursor-pointer"
                      />
                      <span className="text-xs font-bold text-gray-700">For Sale</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={modalNewSizeForRent}
                        onChange={(e) => setModalNewSizeForRent(e.target.checked)}
                        className="w-4 h-4 accent-blue-500 rounded cursor-pointer"
                      />
                      <span className="text-xs font-bold text-gray-700">For Rent</span>
                    </label>
                  </div>
                </div>

                {/* Added Sizes List */}
                {modalSizes.length > 0 ? (
                  <div className="space-y-2 max-h-44 overflow-y-auto pr-0.5">
                    {modalSizes.map((sz, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-3 py-2.5 shadow-sm"
                      >
                        <span className="font-bold text-sm text-gray-900">{sz.size}</span>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                              sz.displayForSale
                                ? 'bg-green-50 text-green-700 border-green-100'
                                : 'bg-gray-100 text-gray-400 border-gray-200'
                            }`}
                          >
                            Sale
                          </span>
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                              sz.displayForRent
                                ? 'bg-blue-50 text-blue-700 border-blue-100'
                                : 'bg-gray-100 text-gray-400 border-gray-200'
                            }`}
                          >
                            Rent
                          </span>
                          <button
                            type="button"
                            onClick={() => setModalSizes((prev) => prev.filter((_, i) => i !== idx))}
                            className="text-gray-300 hover:text-red-400 p-1 rounded transition"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-5 border-2 border-dashed border-gray-200 rounded-2xl">
                    <Ruler className="w-5 h-5 text-gray-300 mx-auto mb-1.5" />
                    <p className="text-xs text-gray-400 italic">
                      No sizes added yet — type a size and click Add
                    </p>
                  </div>
                )}
              </div>

              {/* Save Button */}
              <button
                type="button"
                onClick={saveColorGroup}
                disabled={!modalColorName.trim()}
                className="w-full py-3.5 bg-lime-500 hover:bg-lime-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-black rounded-xl transition shadow-lg shadow-lime-500/20 active:scale-95 text-sm uppercase tracking-wider"
              >
                {editingColorIndex !== null ? '✅ Save Changes' : '➕ Add Color Group'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Helper: Section Title ────────────────────────────────────────────────────
function SectionTitle({ emoji, title }: { emoji: string; title: string }) {
  return (
    <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
      <span className="text-base">{emoji}</span>
      <h3 className="text-xs font-black text-gray-700 uppercase tracking-widest">{title}</h3>
    </div>
  );
}
