"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Upload, X, Plus } from "lucide-react";

interface ProductForm {
  name: string;
  description: string;
  sellPrice: string;
  rentPrice: string;
  category: "adults" | "kids";
  badge: string;
  imageFile: File | null;
  imagePreview: string | null;
}

export default function AdminDashboard() {
  const [form, setForm] = useState<ProductForm>({
    name: "",
    description: "",
    sellPrice: "",
    rentPrice: "",
    category: "adults",
    badge: "",
    imageFile: null,
    imagePreview: null,
  });

  const [recentProducts, setRecentProducts] = useState<ProductForm[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setForm((prev) => ({
        ...prev,
        imageFile: file,
        imagePreview: URL.createObjectURL(file),
      }));
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !form.name ||
      !form.description ||
      !form.sellPrice ||
      !form.rentPrice ||
      !form.imageFile
    ) {
      setSubmitMessage("Please fill in all fields and upload an image");
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage("");

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Add to recent products
      setRecentProducts((prev) => [form, ...prev.slice(0, 4)]);

      // Reset form
      setForm({
        name: "",
        description: "",
        sellPrice: "",
        rentPrice: "",
        category: "adults",
        badge: "",
        imageFile: null,
        imagePreview: null,
      });

      setSubmitMessage("Product posted successfully! ✓");
      setTimeout(() => setSubmitMessage(""), 3000);
    } catch (error) {
      setSubmitMessage("Error posting product. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearImage = () => {
    setForm((prev) => ({
      ...prev,
      imageFile: null,
      imagePreview: null,
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 w-full">
      {/* Main Content */}
      <main className="w-full px-3 md:px-6 py-6 md:py-12">
        <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
          {/* Product Creation Form */}
          <div className="lg:col-span-2 w-full">
            <div className="bg-white rounded-lg md:rounded-2xl shadow-sm border border-gray-200 p-4 md:p-8 w-full">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6">Post New Product</h2>

              <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                {/* Image Upload Section */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2 md:mb-3">
                    Product Image
                  </label>
                  {form.imagePreview ? (
                    <div className="relative">
                      <div className="relative w-full aspect-[4/5] bg-gray-100 rounded-lg md:rounded-xl overflow-hidden">
                        <Image
                          src={form.imagePreview}
                          alt="Preview"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={clearImage}
                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1.5 md:p-2 rounded-full transition"
                      >
                        <X className="h-4 w-4 md:h-5 md:w-5" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full aspect-[4/5] border-2 border-dashed border-gray-300 rounded-lg md:rounded-xl hover:border-lime-600 cursor-pointer transition bg-gray-50 hover:bg-lime-50">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4">
                        <Upload className="h-10 md:h-12 w-10 md:w-12 text-gray-400 mb-2" />
                        <p className="text-xs md:text-sm font-semibold text-gray-700 text-center">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                    </label>
                  )}
                </div>

                {/* Product Name */}
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-900 mb-1 md:mb-2">
                    Product Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Classic Vampire Cape"
                    className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-900 mb-1 md:mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleInputChange}
                    placeholder="Tell customers about this costume..."
                    rows={3}
                    className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Pricing */}
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-gray-900 mb-1 md:mb-2">
                      Sell Price (USD)
                    </label>
                    <input
                      type="number"
                      name="sellPrice"
                      value={form.sellPrice}
                      onChange={handleInputChange}
                      placeholder="49.00"
                      step="0.01"
                      min="0"
                      className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-gray-900 mb-1 md:mb-2">
                      Rent Price/Day (USD)
                    </label>
                    <input
                      type="number"
                      name="rentPrice"
                      value={form.rentPrice}
                      onChange={handleInputChange}
                      placeholder="9.99"
                      step="0.01"
                      min="0"
                      className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Category & Badge */}
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-gray-900 mb-1 md:mb-2">
                      Category
                    </label>
                    <select
                      name="category"
                      value={form.category}
                      onChange={handleInputChange}
                      className="w-full px-3 md:px-4 py-2 md:py-3 text-xs md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                    >
                      <option value="adults">👔 Adults</option>
                      <option value="kids">👶 Kids</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-gray-900 mb-1 md:mb-2">
                      Badge (Optional)
                    </label>
                    <select
                      name="badge"
                      value={form.badge}
                      onChange={handleInputChange}
                      className="w-full px-3 md:px-4 py-2 md:py-3 text-xs md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                    >
                      <option value="">None</option>
                      <option value="Popular">🔥 Popular</option>
                      <option value="New">✨ New</option>
                      <option value="Premium">👑 Premium</option>
                    </select>
                  </div>
                </div>

                {/* Submit Message */}
                {submitMessage && (
                  <div
                    className={`p-3 md:p-4 rounded-lg text-xs md:text-sm font-semibold ${
                      submitMessage.includes("successfully")
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-red-50 text-red-700 border border-red-200"
                    }`}
                  >
                    {submitMessage}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-lime-600 hover:bg-lime-700 disabled:bg-gray-400 text-white font-bold py-2 md:py-3 rounded-lg transition flex items-center justify-center gap-2 text-sm md:text-base"
                >
                  <Plus className="h-4 w-4 md:h-5 md:w-5" />
                  {isSubmitting ? "Posting..." : "Post Product"}
                </button>
              </form>
            </div>
          </div>

          {/* Recent Products Sidebar */}
          <div className="lg:col-span-1 w-full">
            <div className="bg-white rounded-lg md:rounded-2xl shadow-sm border border-gray-200 p-4 md:p-6 sticky top-24">
              <h3 className="text-base md:text-lg font-bold text-gray-900 mb-3 md:mb-4">Recently Posted</h3>

              {recentProducts.length === 0 ? (
                <div className="text-center py-6 md:py-8 text-gray-500">
                  <p className="text-xs md:text-sm">No products posted yet</p>
                </div>
              ) : (
                <div className="space-y-3 md:space-y-4">
                  {recentProducts.map((product, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition"
                    >
                      {product.imagePreview && (
                        <div className="relative w-full aspect-[4/5] bg-gray-100">
                          <Image
                            src={product.imagePreview}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                          {product.badge && (
                            <div className="absolute top-1 right-1 md:top-2 md:right-2 bg-lime-600 text-white text-xs font-bold px-2 py-1 rounded">
                              {product.badge}
                            </div>
                          )}
                        </div>
                      )}
                      <div className="p-2 md:p-3">
                        <h4 className="font-semibold text-gray-900 text-xs md:text-sm line-clamp-2">
                          {product.name}
                        </h4>
                        <div className="mt-1 md:mt-2 flex justify-between items-center text-xs text-gray-600">
                          <span>${product.sellPrice}</span>
                          <span className="text-lime-600 font-semibold">
                            ${product.rentPrice}/day
                          </span>
                        </div>
                        <div className="mt-1 md:mt-2 flex gap-1 md:gap-2">
                          <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-0.5 md:py-1 rounded">
                            {product.category === "kids" ? "👶 Kids" : "👔 Adults"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="mt-4 md:mt-6 bg-white rounded-lg md:rounded-2xl shadow-sm border border-gray-200 p-4 md:p-6">
              <h3 className="text-base md:text-lg font-bold text-gray-900 mb-3 md:mb-4">Stats</h3>
              <div className="space-y-2 md:space-y-3">
                <div className="flex justify-between items-center pb-2 md:pb-3 border-b border-gray-200">
                  <span className="text-xs md:text-sm text-gray-600">Total Products</span>
                  <span className="text-xl md:text-2xl font-bold text-lime-600">24</span>
                </div>
                <div className="flex justify-between items-center pb-2 md:pb-3 border-b border-gray-200">
                  <span className="text-xs md:text-sm text-gray-600">Posted Today</span>
                  <span className="text-xl md:text-2xl font-bold text-gray-900">{recentProducts.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs md:text-sm text-gray-600">Adults/Kids</span>
                  <span className="text-xs md:text-sm font-semibold text-gray-900">12/12</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
