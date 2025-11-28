"use client";

import { useState } from "react";
import Image from "next/image";
import { Upload, X, AlertCircle, CheckCircle2, Camera } from "lucide-react";

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

interface FormErrors {
  name?: string;
  description?: string;
  sellPrice?: string;
  rentPrice?: string;
  sizes?: string;
  color?: string;
  material?: string;
  careInstructions?: string;
  images?: string;
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
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateForm = (): FormErrors => {
    const errors: FormErrors = {};

    if (!form.name.trim()) {
      errors.name = "Product name is required";
    } else if (form.name.trim().length < 3) {
      errors.name = "Product name must be at least 3 characters";
    } else if (form.name.trim().length > 100) {
      errors.name = "Product name must be less than 100 characters";
    }

    if (!form.description.trim()) {
      errors.description = "Description is required";
    } else if (form.description.trim().length < 10) {
      errors.description = "Description must be at least 10 characters";
    } else if (form.description.trim().length > 1000) {
      errors.description = "Description must be less than 1000 characters";
    }

    const sellPrice = parseFloat(form.sellPrice);
    if (!form.sellPrice) {
      errors.sellPrice = "Sell price is required";
    } else if (isNaN(sellPrice) || sellPrice <= 0) {
      errors.sellPrice = "Sell price must be a valid positive number";
    } else if (sellPrice > 10000000) {
      errors.sellPrice = "Sell price is too high";
    }

    const rentPrice = parseFloat(form.rentPrice);
    if (!form.rentPrice) {
      errors.rentPrice = "Rent price is required";
    } else if (isNaN(rentPrice) || rentPrice <= 0) {
      errors.rentPrice = "Rent price must be a valid positive number";
    } else if (rentPrice > 1000000) {
      errors.rentPrice = "Rent price is too high";
    } else if (rentPrice >= sellPrice) {
      errors.rentPrice = "Rent price should be less than sell price";
    }

    if (!form.sizes.trim()) {
      errors.sizes = "Sizes are required";
    } else if (form.sizes.trim().length > 100) {
      errors.sizes = "Sizes must be less than 100 characters";
    }

    if (!form.color.trim()) {
      errors.color = "Color is required";
    } else if (form.color.trim().length > 50) {
      errors.color = "Color must be less than 50 characters";
    }

    if (!form.material.trim()) {
      errors.material = "Material is required";
    } else if (form.material.trim().length > 100) {
      errors.material = "Material must be less than 100 characters";
    }

    if (!form.careInstructions.trim()) {
      errors.careInstructions = "Care instructions are required";
    } else if (form.careInstructions.trim().length < 5) {
      errors.careInstructions = "Care instructions must be at least 5 characters";
    } else if (form.careInstructions.trim().length > 500) {
      errors.careInstructions = "Care instructions must be less than 500 characters";
    }

    if (form.imageFiles.length === 0) {
      errors.images = "At least 1 image is required";
    } else if (form.imageFiles.length > 5) {
      errors.images = "Maximum 5 images allowed";
    }

    return errors;
  };

  const compressImage = (base64: string, mimeType: string): Promise<string> => {
    return new Promise((resolve) => {
      resolve(base64);
    });
  };

  const filesToBase64 = async (files: File[]) => {
    const results: string[] = [];

    for (let i = 0; i < files.length; i++) {
      try {
        const file = files[i];

        if (!file.type.startsWith("image/")) {
          const error = new Error(`File ${i + 1} is not a valid image`);
          console.error(error);
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
      console.log(`Successfully processed ${results.length} images`);
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
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.images;
        return newErrors;
      });
    } catch (err) {
      console.error("Error reading images:", err);
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      setSubmitMessage(`❌ Error: ${errorMsg}`);
      setUploadProgress("");
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

    // Validate field as user types
    const newErrors = { ...formErrors };
    delete newErrors[name as keyof FormErrors];
    setFormErrors(newErrors);
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setSubmitMessage("❌ Please fill all required fields correctly");
      setActiveTab("details");
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage("");
    setUploadProgress("Uploading images...");

    try {
      console.log(`📤 Uploading ${form.imagePreviews.length} images...`);
      const cloudinaryUrls: string[] = [];

      for (let i = 0; i < form.imagePreviews.length; i++) {
        setUploadProgress(`Uploading image ${i + 1}/${form.imagePreviews.length}...`);

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
        name: form.name.trim(),
        description: form.description.trim(),
        sellPrice: parseFloat(form.sellPrice),
        rentPrice: parseFloat(form.rentPrice),
        category: form.category,
        badge: form.badge?.trim() || null,
        imageUrl: mainImage,
        imageUrls: cloudinaryUrls,
        sizes: form.sizes.trim(),
        color: form.color.trim(),
        material: form.material.trim(),
        condition: form.condition,
        careInstructions: form.careInstructions.trim(),
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
      setUploadProgress("Updating cache...");

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

      setFormErrors({});
      setTouched({});
      setSubmitMessage("✅ Product uploaded successfully!");
      setUploadProgress("");
      setActiveTab("images");
      setTimeout(() => setSubmitMessage(""), 4000);
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

  const renderFormField = (
    name: string,
    label: string,
    type: "text" | "number" | "textarea" | "select" = "text",
    placeholder: string = "",
    options?: { value: string; label: string }[],
    helperText?: string
  ) => {
    const hasError = touched[name] && formErrors[name as keyof FormErrors];
    const value = form[name as keyof ProductForm];

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-semibold text-gray-900">
            {label}
            <span className="text-red-500 ml-1">*</span>
          </label>
          {type !== "select" && (
            <span className="text-xs text-gray-500">
              {value && typeof value === "string"
                ? `${value.length} / ${type === "textarea" ? "500" : "100"}`
                : "0"}
            </span>
          )}
        </div>

        {type === "textarea" ? (
          <textarea
            name={name}
            value={value as string}
            onChange={handleInputChange}
            onBlur={() => handleBlur(name)}
            placeholder={placeholder}
            rows={3}
            className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-lime-500 focus:border-transparent text-sm resize-none transition ${
              hasError
                ? "border-red-300 bg-red-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
            disabled={isSubmitting}
          />
        ) : type === "select" ? (
          <select
            name={name}
            value={value as string}
            onChange={handleInputChange}
            onBlur={() => handleBlur(name)}
            className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-lime-500 focus:border-transparent text-sm bg-white transition ${
              hasError
                ? "border-red-300 bg-red-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
            disabled={isSubmitting}
          >
            {options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            type={type}
            name={name}
            value={value as string}
            onChange={handleInputChange}
            onBlur={() => handleBlur(name)}
            placeholder={placeholder}
            className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-lime-500 focus:border-transparent text-sm transition ${
              hasError
                ? "border-red-300 bg-red-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
            disabled={isSubmitting}
          />
        )}

        {helperText && (
          <p className="text-xs text-gray-600">{helperText}</p>
        )}

        {hasError && (
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-600 font-medium">
              {formErrors[name as keyof FormErrors]}
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-8">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-gradient-to-br from-lime-100 to-lime-50 rounded-xl border border-lime-200">
              <Camera className="h-6 w-6 text-lime-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Add New Product</h1>
              <p className="text-sm text-gray-600">Showcase your items with beautiful photos and details</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 bg-gray-100 p-1 rounded-lg w-fit">
            <button
              onClick={() => setActiveTab("images")}
              className={`py-2.5 px-4 rounded-md font-semibold text-sm transition flex items-center gap-2 ${
                activeTab === "images"
                  ? "bg-white text-lime-600 shadow-sm border border-lime-200"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <span className="text-lg">📸</span>
              <span>Images</span>
              {form.imagePreviews.length > 0 && (
                <span
                  className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                    activeTab === "images"
                      ? "bg-lime-100 text-lime-700"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {form.imagePreviews.length}/5
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("details")}
              className={`py-2.5 px-4 rounded-md font-semibold text-sm transition flex items-center gap-2 ${
                activeTab === "details"
                  ? "bg-white text-lime-600 shadow-sm border border-lime-200"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <span className="text-lg">📝</span>
              <span>Details</span>
              {Object.keys(formErrors).length > 0 && activeTab === "details" && (
                <span className="ml-1 w-2 h-2 rounded-full bg-red-600" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Messages - Status Alerts */}
      <div className="max-w-5xl mx-auto px-4 pt-4">
        {submitMessage && (
          <div
            className={`flex items-start gap-3 p-4 rounded-xl mb-4 border animate-in fade-in slide-in-from-top-2 ${
              submitMessage.includes("✅")
                ? "bg-green-50 border-green-200"
                : "bg-red-50 border-red-200"
            }`}
          >
            {submitMessage.includes("✅") ? (
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <p
              className={`font-semibold text-sm ${
                submitMessage.includes("✅") ? "text-green-700" : "text-red-700"
              }`}
            >
              {submitMessage}
            </p>
          </div>
        )}

        {uploadProgress && (
          <div className="flex items-start gap-3 p-4 rounded-xl mb-4 border bg-blue-50 border-blue-200">
            <div className="h-5 w-5 mt-0.5">
              <div className="h-5 w-5 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm text-blue-700">{uploadProgress}</p>
              <div className="w-full bg-blue-200 rounded-full h-2 mt-2 overflow-hidden">
                <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: "66%" }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Images Tab */}
        {activeTab === "images" && (
          <div className="space-y-6">
            {/* Upload Area */}
            <div>
              <label
                htmlFor="image-input"
                className="flex flex-col items-center justify-center w-full p-12 bg-white border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:bg-gray-50 hover:border-lime-400 transition group"
              >
                <div className="p-4 bg-gray-100 group-hover:bg-lime-50 rounded-xl mb-3 transition">
                  <Upload className="h-10 w-10 text-gray-400 group-hover:text-lime-600 transition" />
                </div>
                <p className="font-bold text-gray-900 text-lg">Upload Photos</p>
                <p className="text-sm text-gray-600 mt-1">Drag and drop or click to select</p>
                <p className="text-xs text-gray-500 mt-2">Maximum 5 photos, JPG, PNG formats</p>
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

            {/* Error Message */}
            {formErrors.images && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 font-medium">{formErrors.images}</p>
              </div>
            )}

            {/* Image Previews */}
            {form.imagePreviews.length > 0 && (
              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900">Selected Photos</h3>
                  <span className="text-sm text-gray-600 font-medium">
                    {form.imagePreviews.length} photo{form.imagePreviews.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {form.imagePreviews.map((preview, index) => (
                    <div
                      key={index}
                      className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200 hover:border-lime-400 transition"
                    >
                      <Image
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        fill
                        className="object-cover group-hover:scale-110 transition duration-300"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition shadow-lg"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg">
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
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info Section */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 space-y-5">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                <span className="text-lg">ℹ️</span>
                <h2 className="font-bold text-gray-900">Basic Information</h2>
              </div>
              {renderFormField("name", "Product Name", "text", "e.g., Vintage Red Dress", undefined, "Make it descriptive and catchy")}
              {renderFormField("description", "Description", "textarea", "Describe the product, condition, materials...", undefined, "Include details about condition, style, and care needs")}
            </div>

            {/* Pricing Section */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 space-y-5">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                <span className="text-lg">💰</span>
                <h2 className="font-bold text-gray-900">Pricing</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {renderFormField("sellPrice", "Sell Price", "number", "50000", undefined, "One-time purchase price in Naira")}
                {renderFormField("rentPrice", "Rent Price", "number", "5000", undefined, "Daily rental price in Naira")}
              </div>
            </div>

            {/* Category & Condition */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 space-y-5">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                <span className="text-lg">🏷️</span>
                <h2 className="font-bold text-gray-900">Category & Condition</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {renderFormField(
                  "category",
                  "Category",
                  "select",
                  "",
                  [
                    { value: "adults", label: "Adults" },
                    { value: "kids", label: "Kids" },
                  ]
                )}
                {renderFormField(
                  "condition",
                  "Condition",
                  "select",
                  "",
                  [
                    { value: "new", label: "New" },
                    { value: "like-new", label: "Like New" },
                    { value: "good", label: "Good" },
                    { value: "fair", label: "Fair" },
                  ]
                )}
              </div>
            </div>

            {/* Product Attributes */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 space-y-5">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                <span className="text-lg">👗</span>
                <h2 className="font-bold text-gray-900">Product Attributes</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {renderFormField("sizes", "Available Sizes", "text", "S, M, L, XL", undefined, "Separate sizes with commas")}
                {renderFormField("color", "Color", "text", "Red, Blue, etc.", undefined, "Main color or multiple colors")}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {renderFormField("material", "Material", "text", "Cotton, Silk, etc.", undefined, "Primary fabric or material")}
              </div>
            </div>

            {/* Care & Badge */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 space-y-5">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                <span className="text-lg">🎯</span>
                <h2 className="font-bold text-gray-900">Care & Marketing</h2>
              </div>
              {renderFormField("careInstructions", "Care Instructions", "textarea", "Dry clean only, hand wash...", undefined, "Important care details for customers")}
              {renderFormField("badge", "Badge (Optional)", "text", "New, Sale, Premium, Limited...", undefined, "Optional promotional badge")}
            </div>

            {/* Submit Button */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSubmitting || form.imagePreviews.length === 0}
                className={`flex-1 py-4 px-4 font-bold rounded-xl text-white transition text-lg flex items-center justify-center gap-2 ${
                  isSubmitting || form.imagePreviews.length === 0
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-lime-600 to-lime-700 hover:from-lime-700 hover:to-lime-800 active:scale-95 shadow-lg hover:shadow-xl"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <span>✨</span>
                    <span>Upload Product</span>
                  </>
                )}
              </button>
            </div>

            {/* Helper Text */}
            <p className="text-xs text-gray-600 text-center">
              All fields marked with * are required. Your product will be live immediately after upload.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
