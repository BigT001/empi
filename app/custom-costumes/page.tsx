"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Navigation } from "../components/Navigation";
import { Footer } from "../components/Footer";
import { Upload, AlertCircle, CheckCircle, Loader, X } from "lucide-react";
import { useBuyer } from "../context/BuyerContext";

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

      // Append all selected images
      selectedFiles.forEach((file) => {
        uploadFormData.append("designImages", file);
      });

      const response = await fetch("/api/custom-orders", {
        method: "POST",
        body: uploadFormData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to submit custom order");
      }

      const data = await response.json();
      
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
      setSubmitStatus("error");
      setErrorMessage(err.message || "Failed to submit your custom order. Please try again.");
      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      {/* Navigation with Logo */}
      {/* Navigation - Already has integrated fixed header with hide-on-scroll */}
      <Navigation 
        category={localCategory}
        onCategoryChange={onCategoryChange}
        currency={localCurrency}
        onCurrencyChange={onCurrencyChange}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-0 md:px-6 py-12 md:py-16 mt-20 md:mt-32">
        <div className="space-y-12">
          {/* Hero Section */}
          <section className="text-center space-y-4 px-4 md:px-0">
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

          {/* How It Works - Modern Card Design */}
          <section className="space-y-8 px-0 sm:px-0">
            <div className="text-center space-y-2">
              <h2 className="text-3xl md:text-4xl font-black text-gray-900">How It Works</h2>
              <p className="text-gray-600 text-lg">4 Simple Steps to Your Perfect Costume</p>
            </div>
            
            {/* Steps Grid - Responsive */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 px-4 sm:px-0">
              {/* Step 1 */}
              <div className="group relative">
                {/* Connection Arrow - Hidden on Mobile */}
                <div className="hidden lg:block absolute -right-3 top-1/4 w-6 h-1 bg-gradient-to-r from-lime-600 to-lime-400 z-10"></div>
                
                <div className="bg-gradient-to-br from-lime-50 via-white to-white border-2 border-lime-200 rounded-2xl p-4 sm:p-6 md:p-7 shadow-md hover:shadow-xl hover:border-lime-400 transition-all duration-300 hover:-translate-y-2 h-full">
                  {/* Mobile Layout: Icon and Text Side by Side */}
                  <div className="flex sm:flex-col gap-4 sm:gap-0">
                    <div className="w-14 h-14 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-lime-600 to-lime-500 flex items-center justify-center shadow-lg flex-shrink-0">
                      <span className="text-2xl">📸</span>
                    </div>
                    
                    {/* Mobile: Title and Description beside icon */}
                    <div className="flex flex-col justify-center">
                      <h3 className="font-bold text-gray-900 mb-1 text-sm sm:hidden">Submit Your Design</h3>
                      <p className="text-gray-600 leading-relaxed text-xs sm:hidden">Upload a photo, sketch, or describe exactly what you want</p>
                      
                      {/* Desktop: Full layout */}
                      <div className="hidden sm:block">
                        <div className="flex items-start justify-between mb-4">
                          <div className="text-xs font-bold bg-lime-200 text-lime-800 px-3 py-1 rounded-full">Step 1</div>
                        </div>
                        <h3 className="font-bold text-gray-900 mb-2 text-lg">Submit Your Design</h3>
                        <p className="text-gray-600 leading-relaxed text-sm">Upload a photo, sketch, or describe exactly what you want</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="group relative">
                {/* Connection Arrow - Hidden on Mobile */}
                <div className="hidden lg:block absolute -right-3 top-1/4 w-6 h-1 bg-gradient-to-r from-cyan-600 to-cyan-400 z-10"></div>
                
                <div className="bg-gradient-to-br from-cyan-50 via-white to-white border-2 border-cyan-200 rounded-2xl p-4 sm:p-6 md:p-7 shadow-md hover:shadow-xl hover:border-cyan-400 transition-all duration-300 hover:-translate-y-2 h-full">
                  {/* Mobile Layout: Icon and Text Side by Side */}
                  <div className="flex sm:flex-col gap-4 sm:gap-0">
                    <div className="w-14 h-14 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-cyan-600 to-cyan-500 flex items-center justify-center shadow-lg flex-shrink-0">
                      <span className="text-2xl">💬</span>
                    </div>
                    
                    {/* Mobile: Title and Description beside icon */}
                    <div className="flex flex-col justify-center">
                      <h3 className="font-bold text-gray-900 mb-1 text-sm sm:hidden">Get a Quote</h3>
                      <p className="text-gray-600 leading-relaxed text-xs sm:hidden">We review your request and send you a price quote</p>
                      
                      {/* Desktop: Full layout */}
                      <div className="hidden sm:block">
                        <div className="flex items-start justify-between mb-4">
                          <div className="text-xs font-bold bg-cyan-200 text-cyan-800 px-3 py-1 rounded-full">Step 2</div>
                        </div>
                        <h3 className="font-bold text-gray-900 mb-2 text-lg">Get a Quote</h3>
                        <p className="text-gray-600 leading-relaxed text-sm">We review your request and send you a price quote</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="group relative">
                {/* Connection Arrow - Hidden on Mobile */}
                <div className="hidden lg:block absolute -right-3 top-1/4 w-6 h-1 bg-gradient-to-r from-purple-600 to-purple-400 z-10"></div>
                
                <div className="bg-gradient-to-br from-purple-50 via-white to-white border-2 border-purple-200 rounded-2xl p-4 sm:p-6 md:p-7 shadow-md hover:shadow-xl hover:border-purple-400 transition-all duration-300 hover:-translate-y-2 h-full">
                  {/* Mobile Layout: Icon and Text Side by Side */}
                  <div className="flex sm:flex-col gap-4 sm:gap-0">
                    <div className="w-14 h-14 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-purple-600 to-purple-500 flex items-center justify-center shadow-lg flex-shrink-0">
                      <span className="text-2xl">✨</span>
                    </div>
                    
                    {/* Mobile: Title and Description beside icon */}
                    <div className="flex flex-col justify-center">
                      <h3 className="font-bold text-gray-900 mb-1 text-sm sm:hidden">We Create It</h3>
                      <p className="text-gray-600 leading-relaxed text-xs sm:hidden">Our expert makers craft your custom costume to perfection</p>
                      
                      {/* Desktop: Full layout */}
                      <div className="hidden sm:block">
                        <div className="flex items-start justify-between mb-4">
                          <div className="text-xs font-bold bg-purple-200 text-purple-800 px-3 py-1 rounded-full">Step 3</div>
                        </div>
                        <h3 className="font-bold text-gray-900 mb-2 text-lg">We Create It</h3>
                        <p className="text-gray-600 leading-relaxed text-sm">Our expert makers craft your custom costume to perfection</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="group relative">
                <div className="bg-gradient-to-br from-green-50 via-white to-white border-2 border-green-200 rounded-2xl p-4 sm:p-6 md:p-7 shadow-md hover:shadow-xl hover:border-green-400 transition-all duration-300 hover:-translate-y-2 h-full">
                  {/* Mobile Layout: Icon and Text Side by Side */}
                  <div className="flex sm:flex-col gap-4 sm:gap-0">
                    <div className="w-14 h-14 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-green-600 to-green-500 flex items-center justify-center shadow-lg flex-shrink-0">
                      <span className="text-2xl">🎁</span>
                    </div>
                    
                    {/* Mobile: Title and Description beside icon */}
                    <div className="flex flex-col justify-center">
                      <h3 className="font-bold text-gray-900 mb-1 text-sm sm:hidden">Delivered to You</h3>
                      <p className="text-gray-600 leading-relaxed text-xs sm:hidden">Receive your custom costume on your chosen delivery date</p>
                      
                      {/* Desktop: Full layout */}
                      <div className="hidden sm:block">
                        <div className="flex items-start justify-between mb-4">
                          <div className="text-xs font-bold bg-green-200 text-green-800 px-3 py-1 rounded-full">Step 4</div>
                        </div>
                        <h3 className="font-bold text-gray-900 mb-2 text-lg">Delivered to You</h3>
                        <p className="text-gray-600 leading-relaxed text-sm">Receive your custom costume on your chosen delivery date</p>
                      </div>
                    </div>
                  </div>
                </div>
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

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Contact Information Section */}
              <div className="bg-gradient-to-br from-slate-50 to-white rounded-none md:rounded-2xl p-4 md:p-8 md:border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <span className="text-2xl">👤</span>
                  Contact Information
                </h3>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700 mb-2">
                      Full Name <span className="text-red-600 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-600 transition"
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                      Email <span className="text-red-600 font-bold">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-600 transition"
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone Number <span className="text-red-600 font-bold">*</span>
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-600 transition"
                      placeholder="+234 123 456 7890"
                    />
                  </div>
                  <div>
                    <label htmlFor="city" className="block text-sm font-semibold text-gray-700 mb-2">
                      City <span className="text-red-600 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-600 transition"
                      placeholder="Lagos, Abuja, Ibadan..."
                    />
                  </div>
                </div>

                {/* Address and State - Full Width */}
                <div className="grid md:grid-cols-2 gap-6 mt-6">
                  <div>
                    <label htmlFor="address" className="block text-sm font-semibold text-gray-700 mb-2">
                      Delivery Address
                    </label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-600 transition"
                      placeholder="Street address, apartment, etc."
                    />
                  </div>
                  <div>
                    <label htmlFor="state" className="block text-sm font-semibold text-gray-700 mb-2">
                      State
                    </label>
                    <input
                      type="text"
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-600 transition"
                      placeholder="State (optional)"
                    />
                  </div>
                </div>
              </div>

              {/* Order Details Section */}
              <div className="bg-gradient-to-br from-blue-50 to-white rounded-none md:rounded-2xl p-4 md:p-8 md:border border-blue-200 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <span className="text-2xl">📋</span>
                  Order Details
                </h3>
                
                {/* Top Row: Delivery Date and Quantity */}
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label htmlFor="deliveryDate" className="block text-sm font-semibold text-gray-700 mb-2">
                      When Do You Need It?
                    </label>
                    <input
                      type="date"
                      id="deliveryDate"
                      name="deliveryDate"
                      value={formData.deliveryDate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-600 transition"
                    />
                    <p className="text-xs text-gray-500 mt-1">Leave empty if no specific deadline</p>
                  </div>

                  <div>
                    <label htmlFor="quantity" className="block text-sm font-semibold text-gray-700 mb-2">
                      Quantity <span className="text-red-600 font-bold">*</span>
                    </label>
                    <input
                      type="number"
                      id="quantity"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleInputChange}
                      min="1"
                      max="100"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-600 transition"
                      placeholder="1"
                    />
                    {formData.quantity >= 3 && (
                      <div className="mt-3 p-3 bg-gradient-to-r from-lime-50 to-green-50 border border-lime-200 rounded-lg">
                        <p className="text-sm font-semibold text-lime-700 flex items-center gap-2">
                          <span>🎉</span>
                          {(() => {
                            if (formData.quantity >= 10) return "10% Bulk Discount Applied";
                            if (formData.quantity >= 6) return "7% Bulk Discount Applied";
                            if (formData.quantity >= 3) return "5% Bulk Discount Applied";
                            return "No discount";
                          })()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description Section */}
                <div>
                  <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
                    Costume Description <span className="text-red-600 font-bold">*</span>
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-600 transition resize-none"
                    placeholder="Tell us everything about your costume vision:
• Colors, patterns, and materials
• Style and theme (traditional, modern, fantasy, etc.)
• Size and fit preferences
• Special features or unique details
• Any reference images or inspirations

The more detail you provide, the better we can bring your vision to life!"
                  />
                  <p className="text-xs text-gray-500 mt-2">Min 10 characters - describe your vision in detail</p>
                </div>
              </div>

              {/* Design Upload Section */}
              <div className="bg-gradient-to-br from-purple-50 to-white rounded-none md:rounded-2xl p-4 md:p-8 md:border border-purple-200 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <span className="text-2xl">🖼️</span>
                  Design Pictures
                </h3>
                <p className="text-sm text-gray-600 mb-6">Upload up to 5 reference images, sketches, or designs you like. This helps us understand your vision better.</p>
                
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-purple-400 rounded-none md:rounded-xl p-4 md:p-8 text-center cursor-pointer hover:bg-purple-50 transition duration-200"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Upload className="h-12 w-12 text-purple-600 mx-auto mb-3" />
                  <p className="font-semibold text-gray-900 mb-1">Click to upload or drag and drop</p>
                  <p className="text-sm text-gray-600">JPG, PNG, WebP, or GIF • Max 5MB each • Up to 5 images</p>
                </div>

                {/* Image Previews - Carousel */}
                {previewUrls.length > 0 && (
                  <div className="mt-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-700">
                        📸 Uploaded Pictures: <span className="text-purple-600">{previewUrls.length}/5</span>
                      </p>
                    </div>
                    
                    {/* Carousel Container */}
                    <div className="relative bg-gradient-to-b from-gray-800 to-gray-900 rounded-xl overflow-hidden border border-gray-700 shadow-lg">
                      {/* Main Image */}
                      <div className="aspect-video w-full flex items-center justify-center bg-gray-900">
                        <img
                          src={previewUrls[currentImageIndex]}
                          alt={`Design ${currentImageIndex + 1}`}
                          className="h-full w-full object-contain"
                        />
                      </div>

                      {/* Navigation Buttons */}
                      {previewUrls.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              setCurrentImageIndex(
                                currentImageIndex === 0
                                  ? previewUrls.length - 1
                                  : currentImageIndex - 1
                              )
                            }
                            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-900 rounded-full p-2 transition"
                            title="Previous image"
                          >
                            <svg
                              className="w-6 h-6"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 19l-7-7 7-7"
                              />
                            </svg>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setCurrentImageIndex(
                                currentImageIndex === previewUrls.length - 1
                                  ? 0
                                  : currentImageIndex + 1
                              )
                            }
                            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-900 rounded-full p-2 transition"
                            title="Next image"
                          >
                            <svg
                              className="w-6 h-6"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </button>

                          {/* Image Counter */}
                          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                            {currentImageIndex + 1} / {previewUrls.length}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Thumbnail Strip */}
                    {previewUrls.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {previewUrls.map((url, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => setCurrentImageIndex(index)}
                            className={`flex-shrink-0 relative rounded-lg overflow-hidden border-2 transition ${
                              currentImageIndex === index
                                ? "border-lime-600"
                                : "border-gray-300 hover:border-gray-400"
                            }`}
                          >
                            <img
                              src={url}
                              alt={`Thumbnail ${index + 1}`}
                              className="h-16 w-16 object-cover"
                            />
                            {currentImageIndex === index && (
                              <div className="absolute inset-0 ring-2 ring-lime-600 rounded-lg" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Remove Button for Current Image */}
                    <button
                      type="button"
                      onClick={() => removeImage(currentImageIndex)}
                      className="w-full bg-red-50 hover:bg-red-100 text-red-700 font-medium py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Remove This Image
                    </button>
                  </div>
                )}

                {selectedFiles.length < 5 && (
                  <p className="text-xs text-gray-600 mt-3">
                    You can upload {5 - selectedFiles.length} more picture{5 - selectedFiles.length !== 1 ? 's' : ''}
                  </p>
                )}

                {errorMessage && (
                  <div className="mt-4 text-sm text-red-600">
                    {errorMessage}
                  </div>
                )}
              </div>

              {/* Form Actions */}
              <div className="space-y-4 pt-4">
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
                  Our team will carefully review your request and contact you within <strong>24 hours</strong> with a professional quote, timeline, and any questions we might have.
                </p>
              </div>
            </form>
          </section>

          {/* FAQ */}
          <section className="space-y-4 px-4 sm:px-0">
            <h2 className="text-2xl font-bold text-gray-900">Frequently Asked Questions</h2>
            <div className="space-y-3">
              <details className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-4 md:p-6 border-2 border-blue-200 hover:border-blue-300 transition group">
                <summary className="font-semibold text-gray-900 cursor-pointer flex items-center justify-between group-open:text-blue-700">
                  <span>How long does it take to create a custom costume?</span>
                  <span className="text-blue-600 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="text-gray-700 mt-4 text-sm leading-relaxed">Turnaround time depends on the complexity of your design. Simple costumes typically take 3-7 days, while intricate designs may take 2-4 weeks. We'll confirm the timeline when we send your quote.</p>
              </details>

              <details className="bg-gradient-to-br from-green-50 to-white rounded-2xl p-4 md:p-6 border-2 border-green-200 hover:border-green-300 transition group">
                <summary className="font-semibold text-gray-900 cursor-pointer flex items-center justify-between group-open:text-green-700">
                  <span>Can I request revisions?</span>
                  <span className="text-green-600 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="text-gray-700 mt-4 text-sm leading-relaxed">Yes! We offer up to 2 revisions during the creation process to ensure you're happy with your custom costume before final delivery.</p>
              </details>

              <details className="bg-gradient-to-br from-purple-50 to-white rounded-2xl p-4 md:p-6 border-2 border-purple-200 hover:border-purple-300 transition group">
                <summary className="font-semibold text-gray-900 cursor-pointer flex items-center justify-between group-open:text-purple-700">
                  <span>Do you offer rush orders?</span>
                  <span className="text-purple-600 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="text-gray-700 mt-4 text-sm leading-relaxed">Yes, we can accommodate rush orders for an additional fee. Let us know your deadline in your order request, and we'll do our best to help!</p>
              </details>

              <details className="bg-gradient-to-br from-amber-50 to-white rounded-2xl p-4 md:p-6 border-2 border-amber-200 hover:border-amber-300 transition group">
                <summary className="font-semibold text-gray-900 cursor-pointer flex items-center justify-between group-open:text-amber-700">
                  <span>What about delivery?</span>
                  <span className="text-amber-600 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="text-gray-700 mt-4 text-sm leading-relaxed">We offer fast delivery to all areas of Lagos and nationwide shipping. Choose your preferred delivery method during checkout after receiving your quote.</p>
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
                <p className="text-sm text-gray-700 text-center mb-2">
                  Create an account to track your order and chat with our team!
                </p>
                <Link href="/auth">
                  <button className="w-full bg-lime-600 hover:bg-lime-700 text-white font-semibold py-3 rounded-lg transition">
                    Sign Up Now
                  </button>
                </Link>
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    window.scrollTo(0, 0);
                  }}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3 rounded-lg transition"
                >
                  Continue as Guest
                </button>
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
