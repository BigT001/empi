"use client";

import { useState } from "react";
import Image from "next/image";
import { Upload, X, Plus, Trash2, Check } from "lucide-react";
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

export default function MobileAdminUpload() {
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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"images" | "details">("images");

  const compressImage = (base64: string, mimeType: string): Promise<string> => {
    return new Promise((resolve) => {
      resolve(base64);
    });
  };

  const filesToBase64 = async (files: File[]) => {
    const results: string[] = [];
    let totalSize = 0;

    for (let i = 0; i < files.length; i++) {
      try {
        const file = files[i];
        totalSize += file.size;

        if (!file.type.startsWith("image/")) {
          const error = new Error(`File ${i + 1} is not a valid image`);
          captureImageUploadError(error, {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            step: "validation",
          });
          throw error;
        }

        setUploadProgress(`Processing ${i + 1}/${files.length}...`);

        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onerror = () => {
            reject(new Error("Failed to read file"));
          };
          reader.onload = () => {
            const result = reader.result;
            if (typeof result !== "string") {
              reject(new Error("Invalid file read result"));
              return;
            }
            if (!result.startsWith("data:")) {
              reject(new Error("Invalid image data format"));
              return;
            }
            resolve(result);
          };
          reader.readAsDataURL(file);
        });

        let finalBase64 = base64;
        if (file.size > 1.5 * 1024 * 1024) {
          setUploadProgress(`Compressing ${i + 1}/${files.length}...`);
          finalBase64 = await compressImage(base64, file.type);
        }

        results.push(finalBase64);
      } catch (err) {
        console.error(`Error processing image ${i + 1}:`, err);
        throw err;
      }
    }

    setUploadProgress("");
    if (results.length > 0) {
      captureUploadSuccess(results.length, totalSize);
    }
    return results;
  };

  const handleBulkImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;

    const maxSlots = 5;
    const insertFiles = files.slice(0, Math.min(files.length, maxSlots));

    try {
      setUploadProgress(`Loading ${insertFiles.length} image${insertFiles.length > 1 ? "s" : ""}...`);
      const base64s = await filesToBase64(insertFiles);

      setForm((prev) => {
        const newFiles = [...prev.imageFiles];
        const newPreviews = [...prev.imagePreviews];

        let slot = 0;
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
      setSubmitMessage(`❌ Error: ${errorMsg}`);
      setUploadProgress("");

      Sentry.captureException(err, {
        tags: {
          component: "product-upload",
          stage: "image-selection",
        },
      });
    } finally {
      try {
        e.currentTarget.value = "";
      } catch (e) {
        // ignore
      }
    }
  };

  const removeImage = (index: number) => {
    setForm((prev) => {
      const newFiles = prev.imageFiles.filter((_, i) => i !== index);
      const newPreviews = prev.imagePreviews.filter((_, i) => i !== index);
      return { ...prev, imageFiles: newFiles, imagePreviews: newPreviews };
    });
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
      setSubmitMessage("❌ Fill all fields and upload at least 1 image");
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage("");
    setUploadProgress("Uploading images...");

    try {
      console.log(`📤 Uploading ${form.imagePreviews.length} images...`);
      const cloudinaryUrls: string[] = [];

      for (let i = 0; i < form.imagePreviews.length; i++) {
        setUploadProgress(`Image ${i + 1}/${form.imagePreviews.length}...`);

        try {
          const uploadController = new AbortController();
          const uploadTimeoutId = setTimeout(() => uploadController.abort(), 120000);

          const uploadResponse = await fetch("/api/cloudinary/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              imageData: form.imagePreviews[i],
              fileName: form.imageFiles[i]?.name || `image-${i + 1}`,
            }),
            signal: uploadController.signal,
          });

          clearTimeout(uploadTimeoutId);

          if (!uploadResponse.ok) {
            const error = await uploadResponse.json();
            throw new Error(`Image ${i + 1}: ${error.error || error.details}`);
          }

          const uploadData = await uploadResponse.json();
          if (!uploadData.url) {
            throw new Error(`No URL for image ${i + 1}`);
          }

          cloudinaryUrls.push(uploadData.url);
          console.log(`✅ Image ${i + 1} uploaded`);
        } catch (uploadError) {
          const errorMsg = uploadError instanceof Error ? uploadError.message : "Unknown error";
          console.error(`❌ Error uploading image ${i + 1}:`, errorMsg);
          throw uploadError;
        }
      }

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

      console.log("📤 Creating product...");
      setUploadProgress("Creating product...");

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
        setSubmitMessage(`❌ Error: ${error.error || error.message}`);
        setUploadProgress("");
        return;
      }

      const data = await response.json();
      console.log("✅ Product created:", data);
      setUploadProgress("Clearing cache...");

      try {
        ["all", "adults", "kids"].forEach((cat) => {
          localStorage.removeItem(`products_${cat}`);
          localStorage.removeItem(`products_${cat}_time`);
        });
      } catch (e) {
        // ignore
      }

      try {
        const bc = new BroadcastChannel("empi-products");
        bc.postMessage("products-updated");
        bc.close();
      } catch (e) {
        // ignore
      }

      try {
        localStorage.setItem("empi-products-updated", Date.now().toString());
      } catch (e) {
        // ignore
      }

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

      setSubmitMessage("✅ Product uploaded successfully!");
      setUploadProgress("");
      setActiveTab("images");
      setTimeout(() => setSubmitMessage(""), 3000);
    } catch (error) {
      console.error("❌ Submission error:", error);

      if (error instanceof Error && error.name === "AbortError") {
        setSubmitMessage("❌ Upload timeout. Check your connection.");
      } else {
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        setSubmitMessage(`❌ Error: ${errorMsg}`);
      }
      setUploadProgress("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white pb-4 px-0">
      {/* Messages */}
      {submitMessage && (
        <div
          className={`sticky top-16 mx-4 mt-4 p-4 rounded-xl text-center font-semibold text-sm ${
            submitMessage.includes("✅")
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {submitMessage}
        </div>
      )}

      {uploadProgress && (
        <div className="sticky top-24 mx-4 mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-xs font-semibold text-center">
          {uploadProgress}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 mt-4">
        <div className="flex gap-4 px-4">
          <button
            onClick={() => setActiveTab("images")}
            className={`pb-3 px-2 font-semibold text-sm transition border-b-2 ${
              activeTab === "images"
                ? "border-lime-600 text-lime-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            📸 Images ({form.imagePreviews.length}/5)
          </button>
          <button
            onClick={() => setActiveTab("details")}
            className={`pb-3 px-2 font-semibold text-sm transition border-b-2 ${
              activeTab === "details"
                ? "border-lime-600 text-lime-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            📝 Details
          </button>
        </div>
      </div>

      {/* Images Tab */}
      {activeTab === "images" && (
        <div className="space-y-4 px-4 py-6">
          {/* Image Upload Area */}
          <div>
            <label
              htmlFor="image-input"
              className="flex flex-col items-center justify-center w-full p-8 bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:bg-gray-100 hover:border-lime-400 transition"
            >
              <Upload className="h-12 w-12 text-gray-400 mb-2" />
              <p className="font-semibold text-gray-900">Upload Photos</p>
              <p className="text-xs text-gray-600 mt-1">Tap to select (max 5)</p>
            </label>
            <input
              id="image-input"
              type="file"
              multiple
              accept="image/*"
              onChange={handleBulkImageChange}
              disabled={isSubmitting}
              className="hidden"
            />
          </div>

          {/* Image Previews - Grid */}
          {form.imagePreviews.length > 0 && (
            <div>
              <p className="font-semibold text-gray-900 mb-3">Selected Photos</p>
              <div className="grid grid-cols-2 gap-3">
                {form.imagePreviews.map((preview, index) => (
                  <div
                    key={index}
                    className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200"
                  >
                    <Image
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      fill
                      className="object-cover group-hover:scale-105 transition"
                    />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs font-bold px-2 py-1 rounded">
                      #{index + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Details Tab */}
      {activeTab === "details" && (
        <form onSubmit={handleSubmit} className="space-y-4 px-4 py-6">
          {/* Product Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Product Name *
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleInputChange}
              placeholder="e.g., Vintage Red Dress"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-lime-500 focus:border-transparent text-sm"
              disabled={isSubmitting}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Description *
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleInputChange}
              placeholder="Describe the product, condition, materials..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-lime-500 focus:border-transparent text-sm resize-none"
              disabled={isSubmitting}
            />
          </div>

          {/* Prices */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Sell Price (₦) *
              </label>
              <input
                type="number"
                name="sellPrice"
                value={form.sellPrice}
                onChange={handleInputChange}
                placeholder="50000"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-lime-500 focus:border-transparent text-sm"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Rent Price (₦) *
              </label>
              <input
                type="number"
                name="rentPrice"
                value={form.rentPrice}
                onChange={handleInputChange}
                placeholder="5000"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-lime-500 focus:border-transparent text-sm"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Category *
            </label>
            <select
              name="category"
              value={form.category}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-lime-500 focus:border-transparent text-sm bg-white"
              disabled={isSubmitting}
            >
              <option value="adults">Adults</option>
              <option value="kids">Kids</option>
            </select>
          </div>

          {/* Attributes */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Sizes *
              </label>
              <input
                type="text"
                name="sizes"
                value={form.sizes}
                onChange={handleInputChange}
                placeholder="S, M, L, XL"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-lime-500 focus:border-transparent text-sm"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Color *
              </label>
              <input
                type="text"
                name="color"
                value={form.color}
                onChange={handleInputChange}
                placeholder="Red, Blue..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-lime-500 focus:border-transparent text-sm"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* More Attributes */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Material *
              </label>
              <input
                type="text"
                name="material"
                value={form.material}
                onChange={handleInputChange}
                placeholder="Cotton, Silk..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-lime-500 focus:border-transparent text-sm"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Condition *
              </label>
              <select
                name="condition"
                value={form.condition}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-lime-500 focus:border-transparent text-sm bg-white"
                disabled={isSubmitting}
              >
                <option value="new">New</option>
                <option value="like-new">Like New</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
              </select>
            </div>
          </div>

          {/* Care Instructions */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Care Instructions *
            </label>
            <textarea
              name="careInstructions"
              value={form.careInstructions}
              onChange={handleInputChange}
              placeholder="Dry clean only, hand wash..."
              rows={2}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-lime-500 focus:border-transparent text-sm resize-none"
              disabled={isSubmitting}
            />
          </div>

          {/* Badge (Optional) */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Badge (Optional)
            </label>
            <input
              type="text"
              name="badge"
              value={form.badge}
              onChange={handleInputChange}
              placeholder="New, Sale, Premium..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-lime-500 focus:border-transparent text-sm"
              disabled={isSubmitting}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || form.imagePreviews.length === 0}
            className={`w-full py-4 px-4 font-bold rounded-xl text-white transition text-lg ${
              isSubmitting || form.imagePreviews.length === 0
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-lime-600 hover:bg-lime-700 active:scale-95"
            }`}
          >
            {isSubmitting ? "⏳ Uploading..." : "✨ Upload Product"}
          </button>
        </form>
      )}
    </div>
  );
}
