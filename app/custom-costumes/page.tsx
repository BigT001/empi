"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Navigation } from "../components/Navigation";
import { MobileHeader } from "../components/MobileHeader";
import { Footer } from "../components/Footer";
import { Upload, AlertCircle, CheckCircle, Loader, X, ArrowRight, Sun, Moon } from "lucide-react";
import { useBuyer } from "../context/BuyerContext";
import { useTheme } from "../context/ThemeContext";

interface CustomCostumesPageProps {
  category?: string;
  onCategoryChange?: (category: string) => void;
  currency?: string;
  onCurrencyChange?: (currency: string) => void;
}

export default function CustomCostumesPage({
  category = "custom",
  onCategoryChange = () => { },
  currency = "NGN",
  onCurrencyChange = () => { },
}: CustomCostumesPageProps) {
  const { buyer } = useBuyer();
  const [localCurrency, setLocalCurrency] = useState(currency);
  const [localCategory, setLocalCategory] = useState(category);
  const { theme, toggleTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [successOrderNumber, setSuccessOrderNumber] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [signupError, setSignupError] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
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
        postalCode: buyer.postalCode || prev.postalCode,
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

  const handleCreateAccount = async () => {
    setSignupError("");

    if (!signupPassword || !confirmPassword) {
      setSignupError("Please enter and confirm your password");
      return;
    }

    if (signupPassword.length < 8) {
      setSignupError("Password must be at least 8 characters long");
      return;
    }

    if (signupPassword !== confirmPassword) {
      setSignupError("Passwords do not match");
      return;
    }

    setIsCreatingAccount(true);
    try {
      const response = await fetch("/api/auth/signup-from-custom-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          postalCode: formData.postalCode || "",
          password: signupPassword,
          customOrderNumber: successOrderNumber,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create account");
      }

      const data = await response.json();
      console.log("[CustomCostumes] ✅ Account created successfully!");

      // Close modal and redirect to dashboard
      setShowSuccessModal(false);
      window.location.href = `/dashboard?order=${successOrderNumber}&signup=success`;
    } catch (err: any) {
      console.error("[CustomCostumes] ❌ Error creating account:", err);
      setSignupError(err.message || "Failed to create account. Please try again.");
    } finally {
      setIsCreatingAccount(false);
    }
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

    // Validate required fields
    const missingFields: string[] = [];
    if (!formData.fullName) missingFields.push("Full Name");
    if (!formData.email) missingFields.push("Email");
    if (!formData.phone) missingFields.push("Phone");
    if (!formData.city) missingFields.push("City");
    if (!formData.description) missingFields.push("Description");

    if (missingFields.length > 0) {
      setErrorMessage(`Please fill in the following fields: ${missingFields.join(", ")}`);
      setIsLoading(false);
      return;
    }

    console.log("[CustomCostumes] ✅ All required fields present:", {
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      city: formData.city,
      description: formData.description,
      images: selectedFiles.length,
    });

    try {
      // Prepare FormData for multipart upload
      const uploadFormData = new FormData();
      uploadFormData.append("fullName", formData.fullName);
      uploadFormData.append("email", formData.email);
      uploadFormData.append("phone", formData.phone);
      uploadFormData.append("address", formData.address);
      uploadFormData.append("city", formData.city);
      uploadFormData.append("state", formData.state);
      uploadFormData.append("postalCode", formData.postalCode);
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

      console.log("[CustomCostumes] 📤 Submitting custom order to unified endpoint...");
      // Use unified endpoint for creating custom orders
      const response = await fetch("/api/orders/unified", {
        method: "POST",
        body: uploadFormData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to submit custom order");
      }

      const data = await response.json();

      console.log("[CustomCostumes] ✅ Order submitted successfully to unified system!");
      console.log("[CustomCostumes] Response:", data);
      console.log("[CustomCostumes] Order Number:", data.orderNumber);

      // If user is logged in, update their profile with any new information
      if (buyer?.id) {
        console.log("[CustomCostumes] 👤 Updating buyer profile with form data...");
        try {
          const profileUpdateData = {
            fullName: formData.fullName,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            postalCode: formData.postalCode,
          };

          const profileResponse = await fetch(`/api/buyers/${buyer.id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(profileUpdateData),
          });

          if (profileResponse.ok) {
            console.log("[CustomCostumes] ✅ Buyer profile updated successfully!");
            const updatedBuyer = await profileResponse.json();
            console.log("[CustomCostumes] Updated buyer:", updatedBuyer);
          } else {
            console.warn("[CustomCostumes] ⚠️ Failed to update buyer profile, but order was submitted");
          }
        } catch (profileError) {
          console.warn("[CustomCostumes] ⚠️ Error updating profile (non-blocking):", profileError);
          // Don't throw - order was successful, this is just a bonus feature
        }
      }

      setSubmitStatus("success");
      setSuccessOrderNumber(data.orderNumber || "");
      setShowSuccessModal(true);
      setSignupPassword("");
      setConfirmPassword("");
      setSignupError("");

      // Don't reset form yet - need it for the modal to display user info
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
    <div className="flex flex-col min-h-screen bg-[#0a0a0a]">
      <Navigation
        category={localCategory}
        onCategoryChange={onCategoryChange}
        currency={localCurrency}
        onCurrencyChange={onCurrencyChange}
      />
      <MobileHeader
        category={localCategory}
        onCategoryChange={onCategoryChange}
        currency={localCurrency}
        onCurrencyChange={onCurrencyChange}
      />

      {/* Theme Toggle Button - REMOVED - Using global toggle in Navigation */}

      {/* Main Content */}
      <main className={`flex-1 w-full flex flex-col items-center overflow-x-hidden transition-colors duration-1000 ${theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-slate-50'
        }`}>
        {/* Cinematic Page Header */}
        <section className={`relative w-full min-h-[50vh] flex items-center justify-center overflow-hidden transition-colors duration-1000 px-6 pt-32 pb-20 ${theme === 'dark' ? 'bg-black text-white' : 'bg-white text-slate-900'
          }`}>
          {/* Animated Background */}
          <div className="absolute inset-0 z-0">
            <div className={`absolute inset-0 z-10 transition-opacity duration-1000 ${theme === 'dark'
              ? 'bg-gradient-to-b from-black/20 via-black/90 to-[#0a0a0a]'
              : 'bg-gradient-to-b from-white/20 via-white/80 to-slate-50'
              }`} />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-lime-500/10 via-transparent to-transparent z-10 animate-pulse" />
            <div className="absolute top-[10%] left-[20%] w-64 h-64 bg-lime-500/10 rounded-full blur-[100px] animate-float opacity-50" />
            <div className={`absolute bottom-[20%] right-[10%] w-96 h-96 rounded-full blur-[120px] animate-float opacity-30 ${theme === 'dark' ? 'bg-purple-500/5' : 'bg-lime-500/5'
              }`} style={{ animationDelay: '-3s' }} />

            {/* Grid Pattern */}
            <div className={`absolute inset-0 opacity-[0.03] transition-opacity duration-1000`}
              style={{ backgroundImage: `radial-gradient(circle, ${theme === 'dark' ? '#84cc16' : '#16a34a'} 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />
          </div>

          <div className="relative z-20 max-w-4xl text-center space-y-8 px-4">
            <div className={`inline-flex items-center gap-3 px-6 py-2 rounded-full border transition-all duration-700 text-[10px] md:text-sm font-black uppercase tracking-[0.4em] mb-4 animate-in fade-in slide-in-from-bottom-4 duration-1000 ${theme === 'dark' ? 'bg-lime-500/10 border-lime-400/20 text-lime-400' : 'bg-lime-500/5 border-lime-500/10 text-lime-600'
              }`}>
              <span className="w-2 h-2 rounded-full bg-lime-500 animate-ping" />
              Bespoke Artisan Tailoring
            </div>

            <h1 className="text-4xl md:text-8xl font-black leading-[1.1] tracking-tight animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-200 font-playfair">
              Your Vision <br />
              <span className={`text-transparent bg-clip-text bg-gradient-to-r transition-all duration-1000 ${theme === 'dark'
                ? 'from-lime-300 via-lime-500 to-lime-600'
                : 'from-lime-600 via-lime-700 to-green-800'
                }`}>Perfectly Crafted.</span>
            </h1>

            <p className={`text-base md:text-lg max-w-xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-400 transition-colors duration-1000 ${theme === 'dark' ? 'text-gray-400' : 'text-slate-600'
              }`}>
              Partner with EMPI to bring your custom costume designs to life. Precise, bespoke, and tailored to your every requirement.
            </p>

            <button
              onClick={() => document.getElementById('custom-form')?.scrollIntoView({ behavior: 'smooth' })}
              className="group relative mt-8 px-10 py-4 bg-lime-600 hover:bg-lime-500 text-white font-black rounded-full transition-all duration-500 shadow-[0_0_20px_rgba(132,204,22,0.2)] hover:shadow-[0_0_40px_rgba(132,204,22,0.4)] animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-600"
            >
              <span className="relative z-10 uppercase tracking-widest text-xs">Start Your Order</span>
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </button>
          </div>
        </section>

        <div className="max-w-6xl w-full mx-auto px-4 md:px-6 -mt-8 md:-mt-12 z-30 pb-12 space-y-12">
          {/* Status Message */}
          {submitStatus === "success" && (
            <div className="bg-lime-900/10 backdrop-blur-2xl border border-lime-500/20 rounded-[2.5rem] p-8 md:p-12 flex flex-col md:flex-row gap-8 items-center text-center md:text-left shadow-2xl animate-in fade-in zoom-in duration-700">
              <div className="w-20 h-20 rounded-full bg-lime-500/20 flex items-center justify-center border border-lime-500/40 shadow-[0_0_30px_rgba(132,204,22,0.2)]">
                <CheckCircle className="h-10 w-10 text-lime-400" />
              </div>
              <div>
                <h3 className="text-3xl font-black text-white mb-2">Application Transmitted</h3>
                <p className="text-lime-300/50 text-lg">Our master crafters are reviewing your design. Expect a concierge response within 24 hours.</p>
              </div>
            </div>
          )}


          {/* Form Section */}
          <section id="custom-form" className="relative group">
            <div className="absolute -inset-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-lime-500/5 via-transparent to-transparent blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000 -z-10" />

            <div className={`glass-morphism rounded-[3.5rem] border transition-all duration-1000 shadow-[0_0_100px_rgba(0,0,0,0.4)] ${theme === 'dark' ? 'border-white/10 overflow-hidden' : 'border-black/5 overflow-hidden'
              }`}>
              {/* Form Header */}
              <div className={`border-b transition-colors duration-1000 px-6 md:px-12 py-8 flex flex-col md:flex-row justify-between items-center gap-6 ${theme === 'dark' ? 'bg-white/[0.02] border-white/10' : 'bg-black/[0.02] border-black/5'
                }`}>
                <div>
                  <h2 className={`text-2xl md:text-3xl font-black tracking-tight transition-colors duration-1000 font-playfair ${theme === 'dark' ? 'text-white' : 'text-slate-900'
                    }`}>Custom Order Form</h2>
                  <p className="text-lime-500 text-[9px] font-black uppercase tracking-[0.2em] mt-1">Submit your design requirements below</p>
                </div>

                <div className="flex items-center gap-4">
                  {['info', 'design', 'review'].map((step, idx) => (
                    <div key={step} className="flex items-center">
                      <div className={`w-3 h-3 rounded-full transition-all duration-1000 ${currentStep === step ? 'bg-lime-400 ring-8 ring-lime-400/10 scale-125' :
                        idx < ['info', 'design', 'review'].indexOf(currentStep) ? 'bg-lime-900 shadow-inner' :
                          (theme === 'dark' ? 'bg-white/10' : 'bg-black/10')
                        }`} />
                      {idx < 2 && <div className={`w-12 h-[1px] mx-2 ${theme === 'dark' ? 'bg-white/10' : 'bg-black/10'}`} />}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-8 md:p-16">
                {submitStatus === "error" && (
                  <div className="mb-12 bg-red-950/20 backdrop-blur-xl border border-red-500/30 rounded-3xl p-6 flex gap-6 items-center animate-in slide-in-from-top-4 duration-500">
                    <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/40 flex-shrink-0">
                      <AlertCircle className="h-6 w-6 text-red-400" />
                    </div>
                    <p className="text-red-200 text-sm font-bold uppercase tracking-widest">{errorMessage}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-16">
                  {currentStep === 'info' && (
                    <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-700">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {/* Identity Group */}
                        <div className="space-y-4">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Full Name</label>
                          <input
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleInputChange}
                            required
                            className={`w-full rounded-2xl px-6 py-4 focus:outline-none focus:border-lime-500/50 transition-all duration-700 placeholder:text-gray-400 text-sm ${theme === 'dark'
                              ? 'bg-white/[0.03] border border-white/10 text-white focus:bg-white/[0.05]'
                              : 'bg-black/[0.03] border border-black/10 text-slate-900 focus:bg-black/[0.05]'
                              }`}
                            placeholder="John Doe"
                          />
                        </div>
                        <div className="space-y-4">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Email Address</label>
                          <input
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                            className={`w-full rounded-2xl px-6 py-4 focus:outline-none focus:border-lime-500/50 transition-all duration-700 placeholder:text-gray-400 text-sm ${theme === 'dark'
                              ? 'bg-white/[0.03] border border-white/10 text-white focus:bg-white/[0.05]'
                              : 'bg-black/[0.03] border border-black/10 text-slate-900 focus:bg-black/[0.05]'
                              }`}
                            placeholder="john@example.com"
                          />
                        </div>
                        <div className="space-y-4">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Phone Number</label>
                          <input
                            name="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={handleInputChange}
                            required
                            className={`w-full rounded-2xl px-6 py-4 focus:outline-none focus:border-lime-500/50 transition-all duration-700 placeholder:text-gray-400 text-sm ${theme === 'dark'
                              ? 'bg-white/[0.03] border border-white/10 text-white focus:bg-white/[0.05]'
                              : 'bg-black/[0.03] border border-black/10 text-slate-900 focus:bg-black/[0.05]'
                              }`}
                            placeholder="+234 ..."
                          />
                        </div>
                        <div className="space-y-4">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">City</label>
                          <input
                            name="city"
                            value={formData.city}
                            onChange={handleInputChange}
                            required
                            className={`w-full rounded-2xl px-6 py-4 focus:outline-none focus:border-lime-500/50 transition-all duration-700 placeholder:text-gray-400 text-sm ${theme === 'dark'
                              ? 'bg-white/[0.03] border border-white/10 text-white focus:bg-white/[0.05]'
                              : 'bg-black/[0.03] border border-black/10 text-slate-900 focus:bg-black/[0.05]'
                              }`}
                            placeholder="Lagos"
                          />
                        </div>
                        <div className="space-y-4">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">State</label>
                          <input
                            name="state"
                            value={formData.state}
                            onChange={handleInputChange}
                            className={`w-full rounded-2xl px-6 py-4 focus:outline-none focus:border-lime-500/50 transition-all duration-700 placeholder:text-gray-400 text-sm ${theme === 'dark'
                              ? 'bg-white/[0.03] border border-white/10 text-white focus:bg-white/[0.05]'
                              : 'bg-black/[0.03] border border-black/10 text-slate-900 focus:bg-black/[0.05]'
                              }`}
                            placeholder="Lagos State"
                          />
                        </div>
                        <div className="space-y-4">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Postal Code</label>
                          <input
                            name="postalCode"
                            value={formData.postalCode}
                            onChange={handleInputChange}
                            className={`w-full rounded-2xl px-6 py-4 focus:outline-none focus:border-lime-500/50 transition-all duration-700 placeholder:text-gray-400 text-sm ${theme === 'dark'
                              ? 'bg-white/[0.03] border border-white/10 text-white focus:bg-white/[0.05]'
                              : 'bg-black/[0.03] border border-black/10 text-slate-900 focus:bg-black/[0.05]'
                              }`}
                            placeholder="100001"
                          />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Delivery Address</label>
                        <input
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          className={`w-full rounded-2xl px-6 py-4 focus:outline-none focus:border-lime-500/50 transition-all duration-700 placeholder:text-gray-400 text-sm ${theme === 'dark'
                            ? 'bg-white/[0.03] border border-white/10 text-white focus:bg-white/[0.05]'
                            : 'bg-black/[0.03] border border-black/10 text-slate-900 focus:bg-black/[0.05]'
                            }`}
                          placeholder="No. 12 Street, Lagos"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (formData.fullName && formData.email && formData.phone && formData.city) {
                            setCurrentStep('design');
                            window.scrollTo({ top: document.getElementById('custom-form')?.offsetTop ? document.getElementById('custom-form')!.offsetTop - 100 : 0, behavior: 'smooth' });
                          } else {
                            setErrorMessage("Please complete all required identity fields.");
                            setSubmitStatus("error");
                          }
                        }}
                        className={`group relative w-full font-black py-8 rounded-[2.5rem] transition-all duration-700 flex items-center justify-center gap-6 border ${theme === 'dark'
                          ? 'bg-white/5 hover:bg-white/10 text-white border-white/10'
                          : 'bg-black/5 hover:bg-black/10 text-slate-900 border-black/10'
                          }`}
                      >
                        <span className="uppercase tracking-[0.2em] text-xs font-bold">Next: Design Details</span>
                        <ArrowRight className="h-5 w-5 group-hover:translate-x-2 transition-transform duration-500" />
                      </button>
                    </div>
                  )}

                  {currentStep === 'design' && (
                    <div className="space-y-16 animate-in fade-in slide-in-from-right-8 duration-1000">
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Describe Your Vision</label>
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          rows={6}
                          required
                          className={`w-full rounded-[2.5rem] px-10 py-8 focus:outline-none focus:border-lime-500/50 transition-all duration-700 resize-none text-sm leading-relaxed ${theme === 'dark'
                            ? 'bg-white/[0.03] border border-white/10 text-white focus:bg-white/[0.05] placeholder:text-gray-800'
                            : 'bg-black/[0.03] border border-black/10 text-slate-900 focus:bg-black/[0.05] placeholder:text-gray-400'
                            }`}
                          placeholder="Detail the materials, color palette, inspiration, and technical requirements of your design unit..."
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-4">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-2">Target Completion Date</label>
                          <input
                            type="date"
                            name="deliveryDate"
                            value={formData.deliveryDate}
                            onChange={handleInputChange}
                            className={`w-full rounded-2xl px-8 py-5 focus:outline-none focus:border-lime-500/50 transition-all duration-700 [color-scheme:dark] font-bold ${theme === 'dark'
                              ? 'bg-white/[0.03] border border-white/10 text-white'
                              : 'bg-black/[0.03] border border-black/10 text-slate-900'
                              }`}
                          />
                        </div>
                        <div className="space-y-4">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-2">Unit Quantity</label>
                          <input
                            type="number"
                            name="quantity"
                            min="1"
                            value={formData.quantity}
                            onChange={handleInputChange}
                            className={`w-full rounded-2xl px-8 py-5 focus:outline-none focus:border-lime-500/50 transition-all duration-700 font-black ${theme === 'dark'
                              ? 'bg-white/[0.03] border border-white/10 text-white'
                              : 'bg-black/[0.03] border border-black/10 text-slate-900'
                              }`}
                          />
                        </div>
                      </div>

                      {/* Asset Upload */}
                      <div className="space-y-8">
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className={`group border-2 border-dashed rounded-[2.5rem] p-16 text-center cursor-pointer hover:border-lime-500/40 transition-all duration-700 shadow-2xl ${theme === 'dark'
                            ? 'border-white/10 bg-white/[0.01] hover:bg-lime-500/5'
                            : 'border-black/10 bg-black/[0.01] hover:bg-lime-500/5'
                            }`}
                        >
                          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileSelect} className="hidden" />
                          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-all duration-700 ${theme === 'dark' ? 'bg-white/5 group-hover:bg-lime-500/20' : 'bg-black/5 group-hover:bg-lime-500/10'
                            }`}>
                            <Upload className="h-6 w-6 text-lime-400" />
                          </div>
                          <p className={`font-black text-xs uppercase tracking-[0.3em] transition-colors duration-1000 ${theme === 'dark' ? 'text-white' : 'text-slate-900'
                            }`}>Transmit Visual Assets</p>
                          <p className="text-gray-500 text-[10px] uppercase tracking-widest mt-2 font-medium">JPG, PNG, WEBP • MAX 5MB / UNIT</p>
                        </div>

                        {previewUrls.length > 0 && (
                          <div className="flex gap-4 flex-wrap animate-in fade-in duration-700">
                            {previewUrls.map((url, idx) => (
                              <div key={idx} className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-lime-500/20 group hover:border-lime-400 group shadow-xl transition-all duration-500 hover:scale-105">
                                <img src={url} alt="Reference" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                                  className="absolute top-1 right-1 w-7 h-7 bg-red-500 hover:bg-red-400 text-white rounded-xl flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-all duration-500 shadow-xl"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col md:flex-row gap-6">
                        <button
                          type="button"
                          onClick={() => setCurrentStep('info')}
                          className={`flex-1 font-black py-8 rounded-[2.5rem] transition-all duration-700 uppercase tracking-widest text-xs border ${theme === 'dark'
                            ? 'bg-white/5 hover:bg-white/10 text-white border-white/10'
                            : 'bg-black/5 hover:bg-black/10 text-slate-900 border-black/10'
                            }`}
                        >
                          Identity Details
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (formData.description && selectedFiles.length > 0) {
                              setCurrentStep('review');
                              window.scrollTo({ top: document.getElementById('custom-form')?.offsetTop ? document.getElementById('custom-form')!.offsetTop - 100 : 0, behavior: 'smooth' });
                            } else {
                              setErrorMessage("Please provide a description and at least one visual asset.");
                              setSubmitStatus("error");
                            }
                          }}
                          className={`flex-[2] group relative font-black py-8 rounded-[2.5rem] transition-all duration-700 flex items-center justify-center gap-6 border ${theme === 'dark'
                            ? 'bg-white/5 hover:bg-white/10 text-white border-white/10'
                            : 'bg-black/5 hover:bg-black/10 text-slate-900 border-black/10'
                            }`}
                        >
                          <span className="uppercase tracking-[0.3em] text-xs">Review & Transmit</span>
                          <ArrowRight className="h-6 w-6 group-hover:translate-x-3 transition-transform duration-500" />
                        </button>
                      </div>
                    </div>
                  )}

                  {currentStep === 'review' && (
                    <div className="space-y-16 animate-in fade-in slide-in-from-right-8 duration-1000">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                        <div className="space-y-8">
                          <h3 className="text-lime-500 text-[10px] font-black uppercase tracking-[0.4em] border-b border-lime-500/20 pb-6">Artisan Identity</h3>
                          <div className="space-y-6">
                            <p className={`text-2xl font-black transition-colors duration-1000 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{formData.fullName}</p>
                            <div className="space-y-2">
                              <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em]">{formData.email}</p>
                              <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em]">{formData.phone}</p>
                              <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em]">{formData.city}, {formData.state}</p>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-8">
                          <h3 className="text-lime-500 text-[10px] font-black uppercase tracking-[0.4em] border-b border-lime-500/20 pb-6">Project Logistics</h3>
                          <div className="space-y-6">
                            <div className="flex justify-between items-center bg-black/5 p-4 rounded-2xl">
                              <span className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em]">Units Requested</span>
                              <span className={`text-lg font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{formData.quantity}</span>
                            </div>
                            <div className="flex justify-between items-center bg-black/5 p-4 rounded-2xl">
                              <span className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em]">Target Date</span>
                              <span className={`text-lg font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{formData.deliveryDate || 'NOT SPECIFIED'}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-8">
                        <h3 className="text-lime-500 text-[10px] font-black uppercase tracking-[0.4em] border-b border-lime-500/20 pb-6">Creative Blueprint</h3>
                        <p className={`text-lg leading-relaxed font-medium italic p-8 rounded-3xl ${theme === 'dark' ? 'bg-white/5 text-gray-300' : 'bg-black/5 text-slate-700'
                          }`}>"{formData.description}"</p>
                      </div>

                      <div className="flex flex-col md:flex-row gap-6 pt-8">
                        <button
                          type="button"
                          onClick={() => setCurrentStep('design')}
                          className={`flex-1 font-black py-8 rounded-[2.5rem] transition-all duration-700 uppercase tracking-widest text-xs border ${theme === 'dark'
                            ? 'bg-white/5 hover:bg-white/10 text-white border-white/10'
                            : 'bg-black/5 hover:bg-black/10 text-slate-900 border-black/10'
                            }`}
                        >
                          Modify Blueprint
                        </button>
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="flex-[2] group relative bg-lime-600 hover:bg-lime-500 disabled:bg-gray-800 text-white font-black py-8 rounded-[2.5rem] transition-all duration-1000 flex items-center justify-center gap-6 shadow-[0_30px_60px_rgba(0,0,0,0.5)] hover:shadow-[0_40px_80px_rgba(132,204,22,0.3)]"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                          {isLoading ? (
                            <>
                              <Loader className="h-6 w-6 animate-spin" />
                              <span className="uppercase tracking-[0.3em] text-xs">Transmitting...</span>
                            </>
                          ) : (
                            <>
                              <span className="text-xl">✨</span>
                              <span className="uppercase tracking-[0.3em] text-xs">Execute Design Request</span>
                              <ArrowRight className="h-6 w-6 group-hover:translate-x-3 transition-transform duration-500" />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  <p className="text-center text-[9px] text-gray-700 uppercase tracking-[0.4em] font-black leading-loose">
                    BY SUBMITTING YOU INITIATE A FORMAL BESPOKE CONSULTATION <br />
                    DATA ENCRYPTED VIA EMPI SECURE CHANNELS
                  </p>
                </form>
              </div>
            </div>
          </section>

          {/* Cinematic Accents (Floating Particles) */}
          <div className="fixed inset-0 pointer-events-none z-40">
            <div className="absolute top-1/4 left-10 w-2 h-2 bg-lime-500/20 rounded-full animate-float blur-sm" />
            <div className="absolute top-3/4 right-20 w-3 h-3 bg-lime-500/10 rounded-full animate-float blur-md" style={{ animationDelay: '-2s' }} />
            <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-lime-500/5 rounded-full animate-float blur-lg" style={{ animationDelay: '-5s' }} />
          </div>

        </div>
      </main>

      <Footer />

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[100] flex items-center justify-center p-6 animate-in fade-in duration-700">
          <div className={`relative border rounded-[4rem] shadow-[0_0_150px_rgba(0,0,0,0.8)] max-w-xl w-full p-16 text-center animate-in zoom-in-95 duration-700 transition-colors duration-1000 ${theme === 'dark' ? 'bg-[#111] border-white/10' : 'bg-white border-black/5'
            }`}>
            <div className="w-28 h-28 bg-lime-500/20 rounded-full flex items-center justify-center mx-auto mb-10 border border-lime-500/40 shadow-[0_0_50px_rgba(132,204,22,0.3)] animate-bounce">
              <CheckCircle className="h-14 w-14 text-lime-400" />
            </div>
            <h2 className={`text-5xl font-black uppercase tracking-tighter mb-6 transition-colors duration-1000 ${theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}>Transmission Successful</h2>
            <p className="text-gray-500 text-lg mb-14 font-medium leading-relaxed">Your bespoke artisan brief has been secured and assigned to our master design laboratory.</p>

            {buyer && buyer.email ? (
              <div className="space-y-4">
                <Link href={`/dashboard?order=${successOrderNumber}`}>
                  <button className="w-full bg-lime-600 hover:bg-lime-500 text-white font-black py-5 rounded-[2rem] transition-all duration-500 uppercase tracking-widest text-xs shadow-2xl">
                    View Project Dashboard
                  </button>
                </Link>
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    // Reset Logic
                    setFormData({ fullName: "", email: "", phone: "", address: "", city: "", state: "", postalCode: "", description: "", deliveryDate: "", quantity: 1 });
                    setSelectedFiles([]);
                    setPreviewUrls([]);
                    setCurrentStep("info");
                    window.scrollTo(0, 0);
                  }}
                  className="w-full bg-white/5 hover:bg-white/10 text-white/60 font-black py-5 rounded-[2rem] transition-all duration-500 uppercase tracking-widest text-xs"
                >
                  Continue Browsing
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="p-6 bg-lime-500/5 border border-lime-500/20 rounded-3xl">
                  <p className="text-[10px] text-lime-400 font-bold uppercase tracking-[0.2em] mb-4">Secured Account Creation</p>
                  <div className="space-y-4 text-left">
                    <input type="password" placeholder="CREATE PROJECT PASSWORD" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white text-xs placeholder:text-gray-800" />
                    <input type="password" placeholder="CONFIRM PASSWORD" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white text-xs placeholder:text-gray-800" />
                  </div>
                </div>
                <button
                  onClick={handleCreateAccount}
                  disabled={isCreatingAccount}
                  className="w-full bg-lime-600 hover:bg-lime-500 text-white font-black py-5 rounded-[2rem] transition-all duration-500 uppercase tracking-widest text-xs shadow-2xl disabled:bg-gray-800"
                >
                  {isCreatingAccount ? "Securing Account..." : "Create Account & Track Order"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[100] flex items-center justify-center p-6 animate-in fade-in duration-700">
          <div className={`border rounded-[4rem] shadow-[0_0_150px_rgba(0,0,0,0.8)] max-w-xl w-full p-16 text-center animate-in zoom-in-95 duration-700 transition-colors duration-1000 ${theme === 'dark' ? 'bg-[#111] border-red-500/20' : 'bg-white border-red-500/20'
            }`}>
            <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-10 border border-red-500/40">
              <AlertCircle className="h-12 w-12 text-red-500" />
            </div>
            <h2 className={`text-4xl font-black uppercase tracking-tighter mb-6 transition-colors duration-1000 ${theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}>Transmission Error</h2>
            <div className="bg-red-500/5 border border-red-500/20 rounded-3xl p-8 mb-12">
              <p className="text-red-400 text-sm font-bold uppercase tracking-[0.2em]">{errorMessage}</p>
            </div>
            <button
              onClick={() => setShowErrorModal(false)}
              className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-6 rounded-[2.5rem] transition-all duration-500 uppercase tracking-[0.3em] text-xs shadow-2xl"
            >
              Rectify Visual Brief
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

