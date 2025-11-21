"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Upload, X, Plus, Trash2 } from "lucide-react";
import * as Sentry from "@sentry/nextjs";
import { captureImageUploadError, captureUploadSuccess } from "@/lib/sentry-utils";

interface ProductForm {
  name: string;
  description: string;
  sellPrice: string;
  rentPrice: string;
  category: "adults" | "kids";
  badge: string;
  sizes: string;
  color: string;
  material: string;
  condition: string;
  careInstructions: string;
  imageFiles: File[];
  imagePreviews: string[];
}

export default function AdminDashboard() {
  const [form, setForm] = useState<ProductForm>({
    name: "",
    description: "",
    sellPrice: "",
    rentPrice: "",
    category: "adults",
    badge: "",
    sizes: "",
    color: "",
    material: "",
    condition: "new",
    careInstructions: "",
    imageFiles: [],
    imagePreviews: [],
  });

  const [recentProducts, setRecentProducts] = useState<ProductForm[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [uploadProgress, setUploadProgress] = useState<string>("");

  // Simple image resize without canvas (avoids MIME type issues on mobile)
  const resizeImage = (base64: string, maxWidth: number = 800, maxHeight: number = 800): string => {
    // For now, just return the base64 as-is since we can't reliably resize without canvas
    // Canvas toDataURL() is problematic on mobile due to MIME type validation
    // The base64 itself is already compressed by the browser when reading the file
    return base64;
  };

  // Compress image asynchronously (properly handles mobile uploads)
  // FIXED: Skip canvas compression on mobile - use simpler approach
  const compressImage = (base64: string, mimeType: string, fileName?: string): Promise<string> => {
    return new Promise((resolve) => {
      try {
        console.log(`🔧 Attempting compression for ${fileName}`, {
          mimeType,
          base64Length: base64.length,
        });

        // For mobile, just resolve the base64 as-is
        // Mobile browsers already handle image optimization
        // Canvas toDataURL() causes "string did not match pattern" error
        console.log(`✅ Skipping canvas compression (mobile-safe)`);
        resolve(base64);
      } catch (err) {
        console.error('Compression fallback:', err);
        // If anything fails, just return original
        resolve(base64);
      }
    });
  };

  // Convert an array of File objects to base64 data URLs with compression for mobile
  const filesToBase64 = async (files: File[]) => {
    const results: string[] = [];
    let totalSize = 0;
    
    for (let i = 0; i < files.length; i++) {
      try {
        const file = files[i];
        totalSize += file.size;
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          const error = new Error(`File ${i + 1} is not a valid image`);
          captureImageUploadError(error, {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            step: 'validation',
          });
          throw error;
        }
        
        setUploadProgress(`Processing image ${i + 1}/${files.length}...`);
        
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onerror = () => {
            const error = new Error("Failed to read file");
            captureImageUploadError(error, {
              fileName: file.name,
              fileSize: file.size,
              fileType: file.type,
              step: 'reading',
            });
            reject(error);
          };
          reader.onload = () => {
            try {
              const result = reader.result;
              if (typeof result !== 'string') {
                const error = new Error("Invalid file read result");
                captureImageUploadError(error, {
                  fileName: file.name,
                  fileSize: file.size,
                  fileType: file.type,
                  step: 'reading',
                });
                reject(error);
                return;
              }
              // Validate base64 starts with proper data URL prefix
              if (!result.startsWith('data:')) {
                const error = new Error("Invalid image data format");
                captureImageUploadError(error, {
                  fileName: file.name,
                  fileSize: file.size,
                  fileType: file.type,
                  step: 'reading',
                });
                reject(error);
                return;
              }
              resolve(result);
            } catch (err) {
              const error = err instanceof Error ? err : new Error(String(err));
              captureImageUploadError(error, {
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type,
                step: 'reading',
              });
              reject(error);
            }
          };
          reader.readAsDataURL(file);
        });
        
        // Compress if larger than 1.5MB (common for mobile photos)
        let finalBase64 = base64;
        if (file.size > 1.5 * 1024 * 1024) {
          setUploadProgress(`Compressing image ${i + 1}/${files.length}...`);
          finalBase64 = await compressImage(base64, file.type, file.name);
        }
        
        results.push(finalBase64);
      } catch (err) {
        console.error(`Error processing image ${i + 1}:`, err);
        throw err;
      }
    }
    
    setUploadProgress("");
    // Track successful processing
    if (results.length > 0) {
      captureUploadSuccess(results.length, totalSize);
    }
    return results;
  };

  // Handle selecting one or more images at once. startIndex is the slot to begin filling.
  const handleBulkImageChange = async (startIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;

    // On mobile, warn if selecting too many high-resolution images
    const isSlowNetwork = (navigator as any).connection?.effectiveType === '4g';
    if (files.length > 3 && isSlowNetwork) {
      console.warn("⚠️ Mobile: Selecting many high-resolution images may take time to process");
    }

    // Max 5 slots total
    const maxSlots = 5;
    const insertFiles = files.slice(0, Math.min(files.length, maxSlots));

    try {
      setUploadProgress(`Loading ${insertFiles.length} image${insertFiles.length > 1 ? 's' : ''}...`);
      const base64s = await filesToBase64(insertFiles);

      setForm((prev) => {
        const newFiles = [...prev.imageFiles];
        const newPreviews = [...prev.imagePreviews];

        // Fill slots starting at startIndex; if slot already exists, overwrite
        let slot = startIndex;
        for (let i = 0; i < base64s.length && slot < maxSlots; i++, slot++) {
          const file = insertFiles[i];
          if (slot < newFiles.length) {
            newFiles[slot] = file;
            newPreviews[slot] = base64s[i];
          } else {
            newFiles.push(file);
            newPreviews.push(base64s[i]);
          }
        }

        // If more than 5, trim
        return {
          ...prev,
          imageFiles: newFiles.slice(0, maxSlots),
          imagePreviews: newPreviews.slice(0, maxSlots),
        };
      });
      
      setUploadProgress("");
    } catch (err) {
      console.error("Error reading images:", err);
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      setSubmitMessage(`❌ Error loading images: ${errorMsg}`);
      setUploadProgress("");
      
      // Capture in Sentry
      Sentry.captureException(err, {
        tags: {
          component: "product-upload",
          stage: "image-selection",
        },
        contexts: {
          error_details: {
            message: errorMsg,
          },
        },
      });
    } finally {
      // Clear the input value so the same files can be selected again if needed
      try {
        e.currentTarget.value = "";
      } catch (e) {
        // ignore
      }
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
      !form.sizes ||
      !form.color ||
      !form.material ||
      !form.condition ||
      !form.careInstructions ||
      form.imageFiles.length === 0
    ) {
      setSubmitMessage("Please fill in all fields and upload at least one image");
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage("");
    setUploadProgress("Preparing upload...");

    try {
      // Step 1: Upload all images to Cloudinary first
      console.log(`📤 Uploading ${form.imagePreviews.length} images to Cloudinary...`);
      const cloudinaryUrls: string[] = [];
      
      for (let i = 0; i < form.imagePreviews.length; i++) {
        setUploadProgress(`Uploading image ${i + 1}/${form.imagePreviews.length} to cloud...`);
        
        const uploadResponse = await fetch("/api/cloudinary/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageData: form.imagePreviews[i],
            fileName: form.imageFiles[i]?.name || `image-${i + 1}`,
          }),
        });

        if (!uploadResponse.ok) {
          const error = await uploadResponse.json();
          throw new Error(`Failed to upload image ${i + 1}: ${error.details || error.error}`);
        }

        const uploadData = await uploadResponse.json();
        if (!uploadData.url) {
          throw new Error(`No URL returned for image ${i + 1}`);
        }

        cloudinaryUrls.push(uploadData.url);
        console.log(`✅ Image ${i + 1} uploaded: ${uploadData.url}`);
      }

      // Step 2: Create product with Cloudinary URLs (not base64)
      const mainImage = cloudinaryUrls[0];
      
      const payload = {
        name: form.name,
        description: form.description,
        sellPrice: parseFloat(form.sellPrice),
        rentPrice: parseFloat(form.rentPrice),
        category: form.category,
        badge: form.badge || null,
        imageUrl: mainImage,
        imageUrls: cloudinaryUrls,
        sizes: form.sizes,
        color: form.color,
        material: form.material,
        condition: form.condition,
        careInstructions: form.careInstructions,
      };

      console.log("📤 Submitting product:", { name: form.name, imageCount: cloudinaryUrls.length });
      setUploadProgress("Creating product record...");

      // Add timeout for mobile networks (60 seconds for full upload + product creation)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json();
        console.error("❌ API Error:", error);
        console.error("❌ Response Status:", response.status);
        const errorMsg = error.message || error.error || "Failed to post product";
        setSubmitMessage(`❌ Error: ${errorMsg}`);
        setUploadProgress("");
        
        // Capture in Sentry
        Sentry.captureException(new Error(errorMsg), {
          tags: {
            component: "product-upload",
            stage: "submission",
            http_status: response.status,
          },
        });
        return;
      }

      const data = await response.json();
      console.log("✅ Product created successfully:", data);
      setUploadProgress("Cache clearing...");

      // Immediately clear all cached products to show new one instantly
      try {
        ['all', 'adults', 'kids'].forEach(cat => {
          localStorage.removeItem(`products_${cat}`);
          localStorage.removeItem(`products_${cat}_time`);
        });
        console.log("✅ Cleared localStorage cache");
      } catch (e) {
        // ignore
      }

      // Notify other tabs/pages to refetch products (BroadcastChannel + localStorage fallback)
      try {
        const bc = new BroadcastChannel("empi-products");
        bc.postMessage("products-updated");
        bc.close();
        console.log("📢 Broadcast notification sent");
      } catch (e) {
        // ignore if BroadcastChannel not supported
      }
      try {
        localStorage.setItem("empi-products-updated", Date.now().toString());
      } catch (e) {
        // ignore
      }

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
        sizes: "",
        color: "",
        material: "",
        condition: "new",
        careInstructions: "",
        imageFiles: [],
        imagePreviews: [],
      });

      setSubmitMessage("Product posted successfully! ✓");
      setUploadProgress("");
      setTimeout(() => setSubmitMessage(""), 3000);
    } catch (error) {
      console.error("❌ Submission error:", error);
      
      // Handle timeout error
      if (error instanceof Error && error.name === "AbortError") {
        setSubmitMessage("❌ Upload timeout. Check your internet connection and try again.");
        Sentry.captureException(error, {
          tags: {
            component: "product-upload",
            stage: "submission",
            error_type: "timeout",
          },
        });
      } else {
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        setSubmitMessage(`❌ Error: ${errorMsg}`);
        Sentry.captureException(error, {
          tags: {
            component: "product-upload",
            stage: "submission",
          },
          contexts: {
            error_details: {
              message: errorMsg,
            },
          },
        });
      }
      setUploadProgress("");
    } finally {
      setIsSubmitting(false);
      setUploadProgress("");
    }
  };

  const clearImage = (index: number) => {
    setForm((prev) => {
      const newFiles = [...prev.imageFiles];
      const newPreviews = [...prev.imagePreviews];
      newFiles.splice(index, 1);
      newPreviews.splice(index, 1);
      return { ...prev, imageFiles: newFiles, imagePreviews: newPreviews };
    });
  };

  const uploadedImageCount = form.imageFiles.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 w-full">
      {/* Main Content */}
      <main className="w-full px-3 md:px-6 py-6 md:py-12">
        <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
          {/* Product Creation Form */}
          <div className="lg:col-span-2 w-full">
            <div className="bg-white rounded-lg md:rounded-2xl shadow-sm border border-gray-200 p-4 md:p-8 w-full">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">Post New Product</h2>
              <p className="text-sm text-gray-600 mb-6">Upload up to 5 images for your product</p>

              {/* Upload Progress Indicator */}
              {uploadProgress && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-blue-800 font-medium">{uploadProgress}</p>
                    <div className="animate-spin h-4 w-4 border-2 border-blue-400 border-t-blue-600 rounded-full" />
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                {/* Product Images Section */}
                <div>
                  <div className="flex items-center justify-between mb-3 md:mb-4">
                    <label className="block text-sm font-semibold text-gray-900">
                      Product Images ({uploadedImageCount}/5)
                    </label>
                    <div className="text-xs font-medium px-3 py-1 bg-lime-100 text-lime-700 rounded-full">
                      {uploadedImageCount} uploaded
                    </div>
                  </div>
                  
                  {/* Images Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <div key={index} className="relative">
                        {form.imagePreviews[index] ? (
                          <div className="relative w-full aspect-square bg-gray-100 rounded-lg md:rounded-xl overflow-hidden border-2 border-gray-200">
                            <Image
                              src={form.imagePreviews[index]}
                              alt={`Product ${index + 1}`}
                              fill
                              className="object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => clearImage(index)}
                              className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full transition shadow-lg"
                            >
                              <X className="h-3 w-3" />
                            </button>
                            <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-2 py-1 rounded">
                              #{index + 1}
                            </div>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center w-full aspect-square border-2 border-dashed border-gray-300 rounded-lg md:rounded-xl hover:border-lime-600 cursor-pointer transition bg-gray-50 hover:bg-lime-50">
                            <div className="flex flex-col items-center justify-center p-3">
                              <Upload className="h-6 md:h-7 w-6 md:w-7 text-gray-400 mb-1" />
                              <p className="text-xs font-semibold text-gray-700 text-center">
                                #{index + 1}
                              </p>
                            </div>
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*"
                              multiple
                              onChange={(e) => handleBulkImageChange(index, e)}
                            />
                          </label>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">PNG, JPG, GIF up to 10MB each</p>
                </div>

                {/* Product Name */}
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-900 mb-2">
                    Product Name *
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
                  <label className="block text-xs md:text-sm font-semibold text-gray-900 mb-2">
                    Description *
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
                    <label className="block text-xs md:text-sm font-semibold text-gray-900 mb-2">
                      Sell Price (NGN) *
                    </label>
                    <input
                      type="number"
                      name="sellPrice"
                      value={form.sellPrice}
                      onChange={handleInputChange}
                      placeholder="25000"
                      step="100"
                      min="0"
                      className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-gray-900 mb-2">
                      Rent Price/Day (NGN) *
                    </label>
                    <input
                      type="number"
                      name="rentPrice"
                      value={form.rentPrice}
                      onChange={handleInputChange}
                      placeholder="5000"
                      step="100"
                      min="0"
                      className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Category & Badge */}
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-gray-900 mb-2">
                      Category *
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
                    <label className="block text-xs md:text-sm font-semibold text-gray-900 mb-2">
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

                {/* Product Details Section */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-sm font-bold text-gray-900 mb-4">Product Details</h3>
                  
                  {/* Sizes & Color */}
                  <div className="grid grid-cols-2 gap-3 md:gap-4 mb-4">
                    <div>
                      <label className="block text-xs md:text-sm font-semibold text-gray-900 mb-2">
                        Sizes (comma-separated) *
                      </label>
                      <input
                        type="text"
                        name="sizes"
                        value={form.sizes}
                        onChange={handleInputChange}
                        placeholder="e.g., XS, S, M, L, XL"
                        className="w-full px-3 md:px-4 py-2 md:py-3 text-xs md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs md:text-sm font-semibold text-gray-900 mb-2">
                        Color *
                      </label>
                      <input
                        type="text"
                        name="color"
                        value={form.color}
                        onChange={handleInputChange}
                        placeholder="e.g., Red, Blue, Black"
                        className="w-full px-3 md:px-4 py-2 md:py-3 text-xs md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Material & Condition */}
                  <div className="grid grid-cols-2 gap-3 md:gap-4 mb-4">
                    <div>
                      <label className="block text-xs md:text-sm font-semibold text-gray-900 mb-2">
                        Material *
                      </label>
                      <input
                        type="text"
                        name="material"
                        value={form.material}
                        onChange={handleInputChange}
                        placeholder="e.g., Polyester, Cotton"
                        className="w-full px-3 md:px-4 py-2 md:py-3 text-xs md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs md:text-sm font-semibold text-gray-900 mb-2">
                        Condition *
                      </label>
                      <select
                        name="condition"
                        value={form.condition}
                        onChange={handleInputChange}
                        className="w-full px-3 md:px-4 py-2 md:py-3 text-xs md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                      >
                        <option value="new">New</option>
                        <option value="like-new">Like New</option>
                        <option value="good">Good</option>
                        <option value="fair">Fair</option>
                      </select>
                    </div>
                  </div>

                  {/* Care Instructions */}
                  <div className="mb-4">
                    <label className="block text-xs md:text-sm font-semibold text-gray-900 mb-2">
                      Care Instructions *
                    </label>
                    <textarea
                      name="careInstructions"
                      value={form.careInstructions}
                      onChange={handleInputChange}
                      placeholder="e.g., Dry clean only, Do not bleach..."
                      rows={2}
                      className="w-full px-3 md:px-4 py-2 md:py-3 text-xs md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent resize-none"
                    />
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
                  disabled={isSubmitting || uploadProgress !== ""}
                  className="w-full bg-lime-600 hover:bg-lime-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 md:py-4 rounded-lg transition flex items-center justify-center gap-2 text-sm md:text-base"
                >
                  {isSubmitting || uploadProgress ? (
                    <>
                      <div className="animate-spin h-4 w-4 md:h-5 md:w-5 border-2 border-white border-t-transparent rounded-full" />
                      <span>{uploadProgress ? "Processing..." : "Posting..."}</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 md:h-5 md:w-5" />
                      Post Product
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Recent Products Sidebar */}
          <div className="lg:col-span-1 w-full h-max">
            <div className="bg-white rounded-lg md:rounded-2xl shadow-sm border border-gray-200 p-4 md:p-6 sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto">
              <h3 className="text-base md:text-lg font-bold text-gray-900 mb-4">Recently Posted</h3>

              {recentProducts.length === 0 ? (
                <div className="text-center py-6 md:py-8 text-gray-500">
                  <p className="text-xs md:text-sm">No products posted yet</p>
                </div>
              ) : (
                <div className="space-y-3 md:space-y-4">
                  {recentProducts.map((product, index) => {
                    const firstImage = product.imagePreviews?.[0];
                    return (
                      <div
                        key={index}
                        className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition"
                      >
                        {firstImage && (
                          <div className="relative w-full aspect-[4/5] bg-gray-100">
                            <Image
                              src={firstImage}
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
                            <span>₦{Number(product.sellPrice).toLocaleString()}</span>
                            <span className="text-lime-600 font-semibold">
                              ₦{Number(product.rentPrice).toLocaleString()}/day
                            </span>
                          </div>
                          <div className="mt-2 flex gap-1 md:gap-2 text-xs">
                            <span className="inline-block bg-blue-100 text-blue-700 px-2 py-0.5 md:py-1 rounded font-medium">
                              {product.category === "kids" ? "👶 Kids" : "👔 Adults"}
                            </span>
                            <span className="inline-block bg-gray-100 text-gray-700 px-2 py-0.5 md:py-1 rounded">
                              {product.imageFiles.length} images
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="mt-4 md:mt-6 bg-white rounded-lg md:rounded-2xl shadow-sm border border-gray-200 p-4 md:p-6">
              <h3 className="text-base md:text-lg font-bold text-gray-900 mb-4">Stats</h3>
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
                  <span className="text-xs md:text-sm font-semibold text-gray-900">
                    {recentProducts.filter((p) => p.category === "adults").length}/
                    {recentProducts.filter((p) => p.category === "kids").length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
