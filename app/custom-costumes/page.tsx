"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Header } from "../components/Header";
import { Navigation } from "../components/Navigation";
import { Footer } from "../components/Footer";
import { Upload, AlertCircle, CheckCircle, Loader } from "lucide-react";

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
  const [localCurrency, setLocalCurrency] = useState(currency);
  const [localCategory, setLocalCategory] = useState(category);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    costumeType: "traditional",
    description: "",
    budget: "",
    deliveryDate: "",
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      setErrorMessage("Please upload an image file (JPG, PNG, WebP, or GIF)");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("File size must be less than 5MB");
      return;
    }

    setSelectedFile(file);
    setErrorMessage("");

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSubmitStatus("idle");
    setErrorMessage("");

    try {
      // Prepare FormData for multipart upload
      const uploadFormData = new FormData();
      uploadFormData.append("fullName", formData.fullName);
      uploadFormData.append("email", formData.email);
      uploadFormData.append("phone", formData.phone);
      uploadFormData.append("address", formData.address);
      uploadFormData.append("city", formData.city);
      uploadFormData.append("state", formData.state);
      uploadFormData.append("costumeType", formData.costumeType);
      uploadFormData.append("description", formData.description);
      uploadFormData.append("budget", formData.budget);
      uploadFormData.append("deliveryDate", formData.deliveryDate);

      if (selectedFile) {
        uploadFormData.append("file", selectedFile);
      }

      const response = await fetch("/api/custom-orders", {
        method: "POST",
        body: uploadFormData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to submit custom order");
      }

      setSubmitStatus("success");
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        costumeType: "traditional",
        description: "",
        budget: "",
        deliveryDate: "",
      });
      setSelectedFile(null);
      setPreviewUrl(null);

      // Auto-hide success message after 5 seconds
      setTimeout(() => setSubmitStatus("idle"), 5000);
    } catch (err: any) {
      setSubmitStatus("error");
      setErrorMessage(err.message || "Failed to submit your custom order. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      {/* Header with Logo and Navigation */}
      <header className="border-b border-gray-100 sticky top-0 z-40 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto w-full px-2 md:px-6 py-2 md:py-4 flex items-center justify-center gap-2 md:justify-between md:gap-8">
          <Header />
          <nav className="flex items-center flex-1">
            <Navigation 
              category={localCategory}
              onCategoryChange={onCategoryChange}
              currency={localCurrency}
              onCurrencyChange={onCurrencyChange}
            />
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="space-y-12">
          {/* Hero Section */}
          <section className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900">Design Your Perfect Costume</h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
              Can't find what you're looking for? No problem! EMPI creates custom costumes on demand. Upload your design, describe your vision, and our professional costume makers in Lagos will bring it to life exactly as you imagine it.
            </p>
          </section>

          {/* How It Works */}
          <section className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-900 text-center">How It Works</h2>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-lime-50 rounded-lg p-6 border border-lime-200 text-center">
                <div className="bg-lime-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-lg font-bold">1</div>
                <h3 className="font-semibold text-gray-900 mb-2">Submit Your Design</h3>
                <p className="text-sm text-gray-700">Upload a photo, sketch, or describe exactly what you want</p>
              </div>
              <div className="bg-lime-50 rounded-lg p-6 border border-lime-200 text-center">
                <div className="bg-lime-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-lg font-bold">2</div>
                <h3 className="font-semibold text-gray-900 mb-2">Get a Quote</h3>
                <p className="text-sm text-gray-700">We review your request and send you a price quote</p>
              </div>
              <div className="bg-lime-50 rounded-lg p-6 border border-lime-200 text-center">
                <div className="bg-lime-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-lg font-bold">3</div>
                <h3 className="font-semibold text-gray-900 mb-2">We Create It</h3>
                <p className="text-sm text-gray-700">Our expert makers craft your custom costume to perfection</p>
              </div>
              <div className="bg-lime-50 rounded-lg p-6 border border-lime-200 text-center">
                <div className="bg-lime-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-lg font-bold">4</div>
                <h3 className="font-semibold text-gray-900 mb-2">Delivered to You</h3>
                <p className="text-sm text-gray-700">Receive your custom costume on your chosen delivery date</p>
              </div>
            </div>
          </section>

          {/* Order Form */}
          <section className="bg-gray-50 rounded-lg p-8 border border-gray-200">
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

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Contact Information */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Your Contact Information</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-600"
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-600"
                      placeholder="your@email.com"
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-600"
                      placeholder="+234 XXX XXX XXXX"
                    />
                  </div>
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                      City <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-600"
                      placeholder="e.g., Lagos"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                    Delivery Address
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-600"
                    placeholder="Your delivery address"
                  />
                </div>
              </div>

              {/* Costume Details */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Costume Details</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="costumeType" className="block text-sm font-medium text-gray-700 mb-1">
                      Costume Type <span className="text-red-600">*</span>
                    </label>
                    <select
                      id="costumeType"
                      name="costumeType"
                      value={formData.costumeType}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-600"
                    >
                      <option value="traditional">Traditional (e.g., Yoruba, Igbo, Hausa)</option>
                      <option value="modern">Modern Casual</option>
                      <option value="themed">Themed (Movie, TV, Fantasy)</option>
                      <option value="character">Character (Cartoon, Comic, Game)</option>
                      <option value="children">Children's Costume</option>
                      <option value="event">Event/Party Costume</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="deliveryDate" className="block text-sm font-medium text-gray-700 mb-1">
                      When Do You Need It?
                    </label>
                    <input
                      type="date"
                      id="deliveryDate"
                      name="deliveryDate"
                      value={formData.deliveryDate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-600"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Describe Your Costume <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    rows={5}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-600"
                    placeholder="Describe your custom costume in detail: colors, materials, style, size, special features, etc. The more details, the better we can understand your vision!"
                  />
                </div>

                <div className="mt-4">
                  <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-1">
                    Budget Range (NGN)
                  </label>
                  <div className="flex gap-2">
                    <select
                      id="budget"
                      name="budget"
                      value={formData.budget}
                      onChange={handleInputChange}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-600"
                    >
                      <option value="">Select a budget range</option>
                      <option value="10000-25000">₦10,000 - ₦25,000</option>
                      <option value="25000-50000">₦25,000 - ₦50,000</option>
                      <option value="50000-100000">₦50,000 - ₦100,000</option>
                      <option value="100000-200000">₦100,000 - ₦200,000</option>
                      <option value="200000+">₦200,000+</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Design Upload */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Upload Design (Optional)</h3>
                <p className="text-sm text-gray-600 mb-4">Upload a photo of a design you like, a sketch, or reference image</p>
                
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-lime-600 rounded-lg p-8 text-center cursor-pointer hover:bg-lime-50 transition"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Upload className="h-10 w-10 text-lime-600 mx-auto mb-2" />
                  <p className="font-medium text-gray-900">Click to upload or drag and drop</p>
                  <p className="text-sm text-gray-600">JPG, PNG, WebP, or GIF (max 5MB)</p>
                </div>

                {previewUrl && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                    <img src={previewUrl} alt="Design preview" className="h-40 rounded-lg object-cover" />
                  </div>
                )}

                {errorMessage && (
                  <div className="mt-4 text-sm text-red-600">
                    {errorMessage}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-lime-600 hover:bg-lime-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader className="h-5 w-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Custom Order Request"
                )}
              </button>

              <p className="text-xs text-gray-600 text-center">
                Our team will review your request and contact you within 24 hours with a quote and timeline.
              </p>
            </form>
          </section>

          {/* FAQ */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Frequently Asked Questions</h2>
            <div className="space-y-3">
              <details className="bg-gray-50 rounded-lg p-4 border border-gray-200 group">
                <summary className="font-semibold text-gray-900 cursor-pointer">How long does it take to create a custom costume?</summary>
                <p className="text-gray-700 mt-2 text-sm">Turnaround time depends on the complexity of your design. Simple costumes typically take 3-7 days, while intricate designs may take 2-4 weeks. We'll confirm the timeline when we send your quote.</p>
              </details>

              <details className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <summary className="font-semibold text-gray-900 cursor-pointer">Can I request revisions?</summary>
                <p className="text-gray-700 mt-2 text-sm">Yes! We offer up to 2 revisions during the creation process to ensure you're happy with your custom costume before final delivery.</p>
              </details>

              <details className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <summary className="font-semibold text-gray-900 cursor-pointer">Do you offer rush orders?</summary>
                <p className="text-gray-700 mt-2 text-sm">Yes, we can accommodate rush orders for an additional fee. Let us know your deadline in your order request, and we'll do our best to help!</p>
              </details>

              <details className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <summary className="font-semibold text-gray-900 cursor-pointer">What about delivery?</summary>
                <p className="text-gray-700 mt-2 text-sm">We offer fast delivery to all areas of Lagos and nationwide shipping. Choose your preferred delivery method during checkout after receiving your quote.</p>
              </details>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
