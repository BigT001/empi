"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Navigation } from "../components/Navigation";
import { Footer } from "../components/Footer";
import { Upload, AlertCircle, CheckCircle, Loader, X } from "lucide-react";
import { useBuyer } from "../context/BuyerContext";
import { CategoryCards } from "../components/CategoryCards";
import { MobileLogoTop } from "../components/MobileLogoTop";

interface CustomCostumesPageProps {
  category?: string;
  onCategoryChange?: (category: string) => void;
  currency?: string;
  onCurrencyChange?: (currency: string) => void;
}

export default function CustomCostumesPage({
  category = "custom",
  onCategoryChange = () => {},
  currency = "NGN",
  onCurrencyChange = () => {},
}: CustomCostumesPageProps) {
  const { buyer } = useBuyer();
  const [localCurrency, setLocalCurrency] = useState(currency);
  const [localCategory, setLocalCategory] = useState(category);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [successOrderNumber, setSuccessOrderNumber] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    description: "",
    deliveryDate: "",
    quantity: 1,
  });

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [currentStep, setCurrentStep] = useState<"info" | "design" | "description" | "review">("info");

  // Auto-populate form with buyer profile data
  useEffect(() => {
    if (buyer) {
      setFormData((prev) => ({
        ...prev,
        fullName: buyer.fullName || prev.fullName,
        email: buyer.email || prev.email,
        phone: buyer.phone || prev.phone,
        address: buyer.address || prev.address,
        city: buyer.city || prev.city,
        state: buyer.state || prev.state,
      }));
    }
  }, [buyer]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    const totalFiles = selectedFiles.length + newFiles.length;

    // Check if total exceeds 5
    if (totalFiles > 5) {
      setErrorMessage(`You can upload a maximum of 5 pictures. You currently have ${selectedFiles.length}.`);
      return;
    }

    // Validate each file
    for (const file of newFiles) {
      // Validate file type
      const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      if (!validTypes.includes(file.type)) {
        setErrorMessage("Please upload image files (JPG, PNG, WebP, or GIF)");
        return;
      }

      // Validate file size (max 5MB each)
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage("Each file must be less than 5MB");
        return;
      }
    }

    // Add new files to existing ones
    setSelectedFiles([...selectedFiles, ...newFiles]);
    setErrorMessage("");

    // Create previews for new files
    const newPreviews: string[] = [];
    let loadedCount = 0;

    newFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result as string);
        loadedCount++;
        if (loadedCount === newFiles.length) {
          setPreviewUrls([...previewUrls, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
    setPreviewUrls(previewUrls.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSubmitStatus("idle");
    setErrorMessage("");

    console.log("[CustomCostumes] 📝 Form submission started");
    console.log("[CustomCostumes] User logged in?", !!buyer?.id);
    console.log("[CustomCostumes] Buyer ID:", buyer?.id);
    console.log("[CustomCostumes] Buyer Email:", buyer?.email);

    // Validate that at least one image is uploaded
    if (selectedFiles.length === 0) {
      setErrorMessage("Please upload at least one design image before submitting your order.");
      setIsLoading(false);
      return;
    }

    try {
      // Prepare FormData for multipart upload
      const uploadFormData = new FormData();
      uploadFormData.append("fullName", formData.fullName);
      uploadFormData.append("email", formData.email);
      uploadFormData.append("phone", formData.phone);
      uploadFormData.append("address", formData.address);
      uploadFormData.append("city", formData.city);
      uploadFormData.append("state", formData.state);
      uploadFormData.append("description", formData.description);
      uploadFormData.append("deliveryDate", formData.deliveryDate);
      uploadFormData.append("quantity", formData.quantity.toString());

      // Add buyerId if user is logged in
      if (buyer?.id) {
        uploadFormData.append("buyerId", buyer.id);
        console.log("[CustomCostumes] ✅ Adding buyerId to form:", buyer.id);
      } else {
        console.log("[CustomCostumes] ⚠️ No buyerId available, submitting with email fallback");
      }

      // Append all selected images
      selectedFiles.forEach((file) => {
        uploadFormData.append("designImages", file);
      });

      console.log("[CustomCostumes] 📤 Submitting custom order...");
      const response = await fetch("/api/custom-orders", {
        method: "POST",
        body: uploadFormData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to submit custom order");
      }

      const data = await response.json();
      
      console.log("[CustomCostumes] ✅ Order submitted successfully!");
      console.log("[CustomCostumes] Response:", data);
      console.log("[CustomCostumes] Order Number:", data.orderNumber);
      
      setSubmitStatus("success");
      setSuccessOrderNumber(data.orderNumber || "");
      setShowSuccessModal(true);
      
      // Reset form
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        description: "",
        deliveryDate: "",
        quantity: 1,
      });
      setSelectedFiles([]);
      setPreviewUrls([]);
    } catch (err: any) {
      console.error("[CustomCostumes] ❌ Error submitting order:", err);
      setSubmitStatus("error");
      setErrorMessage(err.message || "Failed to submit your custom order. Please try again.");
      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      {/* Mobile Logo Top - Part of page content, no background */}
      <MobileLogoTop />

      {/* Navigation with Logo */}
      {/* Navigation - Already has integrated fixed header with hide-on-scroll */}
      <Navigation 
        category={localCategory}
        onCategoryChange={onCategoryChange}
        currency={localCurrency}
        onCurrencyChange={onCurrencyChange}
      />

      {/* Category Cards Navigation */}
      <CategoryCards 
        currentCategory="custom"
        onCategoryChange={onCategoryChange}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-0 md:px-6 py-12 md:py-16 mt-4 md:mt-20">
        <div className="space-y-12">
          {/* Hero Section - Desktop Only */}
          <section className="hidden md:block text-center space-y-4 px-4 md:px-0 md:py-8">
            <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-lime-50 border border-purple-200 rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
              <div className="relative px-5 md:px-10 py-8 md:py-12">
                {/* Background decorative elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200 opacity-10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-pink-200 opacity-10 rounded-full -ml-16 -mb-16 blur-3xl"></div>
                
                {/* Content */}
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-1.5 mb-3 px-3 py-1.5 bg-white/60 backdrop-blur-sm rounded-full border border-purple-300/40">
                    <span className="text-base">✨</span>
                    <span className="text-xs font-bold text-purple-700 uppercase tracking-wide">Custom Orders</span>
                  </div>
                  
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-gray-900 mb-4 leading-tight">
                    Design Your <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Perfect Costume</span>
                  </h1>
                  
                  <p className="text-base md:text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
                    EMPI creates custom costumes on demand. Upload your design, describe your vision, and we will bring it to life exactly as you imagine it.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* How It Works */}
          <section className="px-4 md:px-0 py-8">
            <div className="mb-10">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">How It Works</h2>
              <p className="text-gray-600">Simple steps to get your perfect costume</p>
            </div>
            
            {/* Mobile - Icons and titles only in horizontal line */}
            <div className="md:hidden flex justify-between items-start gap-3">
              {/* Step 1 */}
              <div className="flex flex-col items-center flex-1">
                <div className="mb-2 text-3xl">📸</div>
                <h3 className="font-semibold text-gray-900 text-center text-sm">Submit Design</h3>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center flex-1">
                <div className="mb-2 text-3xl">💬</div>
                <h3 className="font-semibold text-gray-900 text-center text-sm">Get Quote</h3>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center flex-1">
                <div className="mb-2 text-3xl">✨</div>
                <h3 className="font-semibold text-gray-900 text-center text-sm">We Create</h3>
              </div>

              {/* Step 4 */}
              <div className="flex flex-col items-center flex-1">
                <div className="mb-2 text-3xl">🎁</div>
                <h3 className="font-semibold text-gray-900 text-center text-sm">Delivered</h3>
              </div>
            </div>

            {/* Desktop - Full details */}
            <div className="hidden md:grid md:grid-cols-4 gap-6">
              {/* Step 1 */}
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 text-4xl">📸</div>
                <h3 className="font-semibold text-gray-900 mb-2">Submit Design</h3>
                <p className="text-sm text-gray-600 leading-relaxed">Upload images or describe your costume idea in detail</p>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 text-4xl">💬</div>
                <h3 className="font-semibold text-gray-900 mb-2">Get Quote</h3>
                <p className="text-sm text-gray-600 leading-relaxed">We review and send you pricing & timeline</p>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 text-4xl">✨</div>
                <h3 className="font-semibold text-gray-900 mb-2">We Create</h3>
                <p className="text-sm text-gray-600 leading-relaxed">Our makers craft your custom costume</p>
              </div>

              {/* Step 4 */}
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 text-4xl">🎁</div>
                <h3 className="font-semibold text-gray-900 mb-2">Delivered</h3>
                <p className="text-sm text-gray-600 leading-relaxed">Receive your costume on your chosen date</p>
              </div>
            </div>
          </section>

          {/* Order Form */}
          <section className="bg-gray-50 rounded-none md:rounded-lg p-4 md:p-8 md:border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Submit Your Custom Order</h2>

            {submitStatus === "success" && (
              <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-green-900">Order Submitted Successfully!</h3>
                  <p className="text-sm text-green-700 mt-1">We'll review your custom costume request and send you a quote within 24 hours.</p>
                </div>
              </div>
            )}

            {submitStatus === "error" && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-900">Error Submitting Order</h3>
                  <p className="text-sm text-red-700 mt-1">{errorMessage}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-0 md:space-y-8">
              {/* Mobile Step Indicator */}
              <div className="md:hidden mb-6">
                <div className="flex justify-between items-center gap-2 mb-4">
                  {(['info', 'design', 'description', 'review'] as const).map((step, idx) => (
                    <div key={step} className="flex items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                          currentStep === step
                            ? 'bg-gradient-to-r from-lime-600 to-green-600 text-white ring-2 ring-offset-2 ring-green-300'
                            : idx < ['info', 'design', 'description', 'review'].indexOf(currentStep)
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {idx + 1}
                      </div>
                      {idx < 3 && <div className="w-1 h-1 bg-gray-300 mx-1" />}
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-xs font-medium text-gray-600">
                  <span>Info</span>
                  <span>Design</span>
                  <span>Details</span>
                  <span>Review</span>
                </div>
              </div>

              {/* Step 1: Contact Information */}
              {(currentStep === 'info' || window.innerWidth >= 768) && (
                <div className="bg-gradient-to-br from-blue-50 via-slate-50 to-white rounded-none md:rounded-2xl p-4 md:p-8 md:border border-blue-200 shadow-sm overflow-hidden">
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <span className="text-2xl">👤</span>
                    <span className="hidden md:inline">Contact Information</span>
                    <span className="md:hidden">Your Information</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div className="bg-white rounded-xl p-3 md:p-4 border border-blue-100 md:border-0 md:bg-transparent">
                      <label htmlFor="fullName" className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
                        Full Name <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        id="fullName"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm md:text-base"
                        placeholder="Your name"
                      />
                    </div>
                    <div className="bg-white rounded-xl p-3 md:p-4 border border-blue-100 md:border-0 md:bg-transparent">
                      <label htmlFor="email" className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
                        Email <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm md:text-base"
                        placeholder="your@email.com"
                      />
                    </div>
                    <div className="bg-white rounded-xl p-3 md:p-4 border border-blue-100 md:border-0 md:bg-transparent">
                      <label htmlFor="phone" className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
                        Phone <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm md:text-base"
                        placeholder="+234 123 456 7890"
                      />
                    </div>
                    <div className="bg-white rounded-xl p-3 md:p-4 border border-blue-100 md:border-0 md:bg-transparent">
                      <label htmlFor="city" className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
                        City <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm md:text-base"
                        placeholder="Lagos, Abuja..."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-4 md:mt-6">
                    <div className="bg-white rounded-xl p-3 md:p-4 border border-blue-100 md:border-0 md:bg-transparent">
                      <label htmlFor="address" className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
                        Address
                      </label>
                      <input
                        type="text"
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm md:text-base"
                        placeholder="Street address"
                      />
                    </div>
                    <div className="bg-white rounded-xl p-3 md:p-4 border border-blue-100 md:border-0 md:bg-transparent">
                      <label htmlFor="state" className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
                        State
                      </label>
                      <input
                        type="text"
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm md:text-base"
                        placeholder="State"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Design Upload */}
              {(currentStep === 'design' || window.innerWidth >= 768) && (
                <div className="bg-gradient-to-br from-purple-50 via-slate-50 to-white rounded-none md:rounded-2xl p-4 md:p-8 md:border border-purple-200 shadow-sm overflow-hidden">
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <span className="text-2xl">🖼️</span>
                    Design Pictures
                  </h3>
                  <p className="text-xs md:text-sm text-gray-600 mb-6">Upload up to 5 reference images, sketches, or designs</p>

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-purple-400 rounded-xl p-6 md:p-8 text-center cursor-pointer hover:bg-purple-50 transition duration-200 bg-white md:bg-transparent"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <Upload className="h-10 md:h-12 w-10 md:w-12 text-purple-600 mx-auto mb-2" />
                    <p className="font-semibold text-gray-900 mb-1 text-sm md:text-base">Click or tap to upload</p>
                    <p className="text-xs md:text-sm text-gray-600">JPG, PNG, WebP • Max 5MB each</p>
                  </div>

                  {previewUrls.length > 0 && (
                    <div className="mt-6 space-y-4">
                      <p className="text-sm font-semibold text-gray-700">
                        📸 Uploaded: <span className="text-purple-600">{previewUrls.length}/5</span>
                      </p>
                      
                      {/* Carousel */}
                      <div className="relative bg-gray-900 rounded-xl overflow-hidden border border-gray-700 shadow-lg">
                        <div className="aspect-video w-full flex items-center justify-center bg-gray-900">
                          <img
                            src={previewUrls[currentImageIndex]}
                            alt={`Design ${currentImageIndex + 1}`}
                            className="h-full w-full object-contain"
                          />
                        </div>

                        {previewUrls.length > 1 && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                setCurrentImageIndex(
                                  currentImageIndex === 0 ? previewUrls.length - 1 : currentImageIndex - 1
                                )
                              }
                              className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition"
                            >
                              ←
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setCurrentImageIndex(
                                  currentImageIndex === previewUrls.length - 1 ? 0 : currentImageIndex + 1
                                )
                              }
                              className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition"
                            >
                              →
                            </button>
                          </>
                        )}

                        <div className="absolute bottom-3 left-0 right-0 text-center text-xs text-white">
                          {currentImageIndex + 1} of {previewUrls.length}
                        </div>
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        {previewUrls.map((url, idx) => (
                          <div key={idx} className="relative">
                            <img
                              src={url}
                              alt={`Thumbnail ${idx + 1}`}
                              className={`w-16 h-16 rounded-lg object-cover cursor-pointer border-2 transition ${
                                currentImageIndex === idx ? 'border-purple-600' : 'border-gray-300'
                              }`}
                              onClick={() => setCurrentImageIndex(idx)}
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const newFiles = selectedFiles.filter((_, i) => i !== idx);
                                const newUrls = previewUrls.filter((_, i) => i !== idx);
                                setSelectedFiles(newFiles);
                                setPreviewUrls(newUrls);
                                setCurrentImageIndex(Math.min(currentImageIndex, newUrls.length - 1));
                              }}
                              className="absolute top-0 right-0 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 w-5 h-5 flex items-center justify-center text-xs"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Order Details & Description */}
              {(currentStep === 'description' || window.innerWidth >= 768) && (
                <>
                  <div className="bg-gradient-to-br from-green-50 via-slate-50 to-white rounded-none md:rounded-2xl p-4 md:p-8 md:border border-green-200 shadow-sm overflow-hidden">
                    <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <span className="text-2xl">📋</span>
                      Order Details
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                      <div className="bg-white rounded-xl p-3 md:p-4 border border-green-100 md:border-0 md:bg-transparent">
                        <label htmlFor="deliveryDate" className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
                          When Do You Need It?
                        </label>
                        <input
                          type="date"
                          id="deliveryDate"
                          name="deliveryDate"
                          value={formData.deliveryDate}
                          onChange={handleInputChange}
                          className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition text-sm md:text-base"
                        />
                      </div>

                      <div className="bg-white rounded-xl p-3 md:p-4 border border-green-100 md:border-0 md:bg-transparent">
                        <label htmlFor="quantity" className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
                          Quantity <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="number"
                          id="quantity"
                          name="quantity"
                          value={formData.quantity}
                          onChange={handleInputChange}
                          min="1"
                          max="100"
                          className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition text-sm md:text-base"
                        />
                      </div>
                    </div>

                    {formData.quantity >= 3 && (
                      <div className="mt-4 p-3 md:p-4 bg-gradient-to-r from-lime-50 to-green-50 border border-lime-300 rounded-xl">
                        <p className="text-sm font-semibold text-lime-700 flex items-center gap-2">
                          <span>🎉</span>
                          {formData.quantity >= 10 ? '10% Bulk Discount!' : formData.quantity >= 6 ? '7% Bulk Discount!' : '5% Bulk Discount!'}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="bg-gradient-to-br from-orange-50 via-slate-50 to-white rounded-none md:rounded-2xl p-4 md:p-8 md:border border-orange-200 shadow-sm overflow-hidden">
                    <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                      <span className="text-2xl">✍️</span>
                      Costume Description
                    </h3>
                    <p className="text-xs md:text-sm text-gray-600 mb-4">Tell us everything about your vision</p>

                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={5}
                      className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition resize-none text-sm md:text-base bg-white"
                      placeholder="Colors, materials, style, special features, reference inspirations..."
                    />
                    <p className="text-xs text-gray-500 mt-2">Min 10 characters required</p>
                  </div>
                </>
              )}

              {/* Mobile Step 4: Review & Submit */}
              {(currentStep === 'review' || window.innerWidth >= 768) && window.innerWidth < 768 && (
                <div className="bg-gradient-to-br from-cyan-50 to-white rounded-2xl p-6 border border-cyan-200 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="text-2xl">✅</span>
                    Review & Submit
                  </h3>
                  <div className="space-y-3 text-sm mb-6">
                    <div className="flex justify-between items-start">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-semibold text-gray-900 text-right max-w-xs">{formData.fullName || '—'}</span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-semibold text-gray-900 text-right max-w-xs truncate">{formData.email || '—'}</span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-gray-600">Quantity:</span>
                      <span className="font-semibold text-gray-900">{formData.quantity}</span>
                    </div>
                    {previewUrls.length > 0 && (
                      <div className="flex justify-between items-start">
                        <span className="text-gray-600">Images:</span>
                        <span className="font-semibold text-gray-900">{previewUrls.length}/5</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Form Actions */}
              <div className="md:hidden space-y-3 pt-4 sticky bottom-0 bg-white border-t border-gray-200 p-4 -mx-4">
                <button
                  type="button"
                  onClick={() => {
                    const steps: typeof currentStep[] = ['info', 'design', 'description', 'review'];
                    const idx = steps.indexOf(currentStep);
                    if (idx > 0) setCurrentStep(steps[idx - 1]);
                  }}
                  disabled={currentStep === 'info'}
                  className="w-full bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 text-gray-700 font-semibold py-3 rounded-lg transition text-sm"
                >
                  ← Back
                </button>

                {currentStep !== 'review' && (
                  <button
                    type="button"
                    onClick={() => {
                      const steps: Array<"info" | "design" | "description" | "review"> = ['info', 'design', 'description', 'review'];
                      const idx = steps.indexOf(currentStep);
                      if (idx < steps.length - 1) setCurrentStep(steps[idx + 1]);
                    }}
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-3 rounded-lg transition text-sm"
                  >
                    Next →
                  </button>
                )}

                {currentStep === 'review' && (
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-lime-600 to-green-600 hover:from-lime-700 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2 shadow-lg"
                  >
                    {isLoading ? (
                      <>
                        <Loader className="h-5 w-5 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <span>✨</span>
                        Get My Quote
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Desktop: Submit Button */}
              <div className="hidden md:block space-y-4 pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-lime-600 to-green-600 hover:from-lime-700 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                  {isLoading ? (
                    <>
                      <Loader className="h-5 w-5 animate-spin" />
                      Submitting Your Order...
                    </>
                  ) : (
                    <>
                      <span>✨</span>
                      Get Your Custom Quote
                    </>
                  )}
                </button>

                <p className="text-xs text-gray-600 text-center leading-relaxed">
                  Our team will carefully review your request and contact you within <strong>24 hours</strong> with a professional quote, timeline, and any questions.
                </p>
              </div>
            </form>
          </section>
          {/* FAQ */}
          <section className="px-4 md:px-0 space-y-6">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Frequently Asked Questions</h2>
              <p className="text-gray-600">Get answers to common questions</p>
            </div>
            <div className="space-y-3">
              <details className="bg-gray-50 rounded-none md:rounded-lg p-4 md:border border-gray-200 group">
                <summary className="font-semibold text-gray-900 cursor-pointer">How long does it take to create a custom costume?</summary>
                <p className="text-gray-700 mt-2 text-sm">Turnaround time depends on the complexity of your design. Simple costumes typically take 3-7 days, while intricate designs may take 2-4 weeks. We'll confirm the timeline when we send your quote.</p>
              </details>

              <details className="bg-gray-50 rounded-none md:rounded-lg p-4 md:border border-gray-200">
                <summary className="font-semibold text-gray-900 cursor-pointer">Can I request revisions?</summary>
                <p className="text-gray-700 mt-2 text-sm">Yes! We offer up to 2 revisions during the creation process to ensure you're happy with your custom costume before final delivery.</p>
              </details>

              <details className="bg-gray-50 rounded-none md:rounded-lg p-4 md:border border-gray-200">
                <summary className="font-semibold text-gray-900 cursor-pointer">Do you offer rush orders?</summary>
                <p className="text-gray-700 mt-2 text-sm">Yes, we can accommodate rush orders for an additional fee. Let us know your deadline in your order request, and we'll do our best to help!</p>
              </details>

              <details className="bg-gray-50 rounded-none md:rounded-lg p-4 md:border border-gray-200">
                <summary className="font-semibold text-gray-900 cursor-pointer">What about delivery?</summary>
                <p className="text-gray-700 mt-2 text-sm">We offer fast delivery to all areas of Lagos and nationwide shipping. Choose your preferred delivery method during checkout after receiving your quote.</p>
              </details>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <Footer />

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-6">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Order Submitted! 🎉</h2>
            <p className="text-gray-600 text-center mb-2">
              Your custom costume request has been received!
            </p>
            
            <div className="bg-lime-50 border border-lime-200 rounded-lg p-4 mb-6 text-center">
              <p className="text-xs text-lime-700 uppercase font-semibold mb-1">Order Number</p>
              <p className="text-lg font-bold text-lime-600">{successOrderNumber}</p>
            </div>

            <p className="text-sm text-gray-700 text-center mb-6">
              We'll review your request and contact you within 24 hours with a professional quote and timeline for your costume.
            </p>

            {buyer && buyer.email ? (
              // User is signed in
              <div className="space-y-3">
                <Link href={`/dashboard?order=${successOrderNumber}`}>
                  <button className="w-full bg-lime-600 hover:bg-lime-700 text-white font-semibold py-3 rounded-lg transition">
                    View Your Order
                  </button>
                </Link>
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    // Scroll to top and reset
                    window.scrollTo(0, 0);
                  }}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3 rounded-lg transition"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              // User is not signed in
              <div className="space-y-3">
                <p className="text-sm text-gray-700 text-center mb-4">
                  <span className="font-semibold">Create an account to track your order progress</span> and chat directly with our team throughout production!
                </p>
                <Link href="/auth">
                  <button className="w-full bg-lime-600 hover:bg-lime-700 text-white font-semibold py-3 rounded-lg transition">
                    Sign Up Now
                  </button>
                </Link>
                <p className="text-xs text-gray-600 text-center">
                  You'll be able to track your costume from design review through delivery
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-6">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">Oops! Something Went Wrong</h2>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-700">{errorMessage}</p>
            </div>

            <p className="text-sm text-gray-700 text-center mb-6">
              Please check your details and try again. If the problem persists, contact us directly.
            </p>

            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowErrorModal(false);
                  // Form data is preserved, user can try again
                }}
                className="w-full bg-lime-600 hover:bg-lime-700 text-white font-semibold py-3 rounded-lg transition"
              >
                Try Again
              </button>
              <button
                onClick={() => {
                  setShowErrorModal(false);
                  // Reset form
                  setFormData({
                    fullName: "",
                    email: "",
                    phone: "",
                    address: "",
                    city: "",
                    state: "",
                    description: "",
                    deliveryDate: "",
                    quantity: 1,
                  });
                  setSelectedFiles([]);
                  setPreviewUrls([]);
                  setErrorMessage("");
                }}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3 rounded-lg transition"
              >
                Clear Form
              </button>
            </div>

            <p className="text-xs text-gray-600 text-center mt-4">
              Need help? <a href="mailto:support@empicostumes.com" className="text-lime-600 hover:underline">Contact us</a>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
