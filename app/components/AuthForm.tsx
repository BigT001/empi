"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useBuyer } from "@/app/context/BuyerContext";
import { useCurrency } from "@/app/context/CurrencyContext";
import { LogIn, UserPlus, Mail, Phone, Lock, User, Eye, EyeOff } from "lucide-react";
import { signIn } from "next-auth/react";

interface AuthFormProps {
  onSuccessfulAuth?: (buyer: any) => void;
  onCancel?: () => void;
  redirectToCheckout?: boolean;
  showHeader?: boolean;
  showFooter?: boolean;
}

export function AuthForm({ onSuccessfulAuth, onCancel, redirectToCheckout = false, showHeader = false, showFooter = false }: AuthFormProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loginType, setLoginType] = useState<"email" | "phone">("email");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOAuthLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { register, login } = useBuyer();
  const { setCurrency } = useCurrency();

  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    password: "",
    fullName: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError("");
    setSuccess("");
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePhone = (phone: string) => {
    return /^[\d\s\-\+\(\)]{10,}$/.test(phone);
  };

  const handleOAuthSignIn = async (provider: "google") => {
    setOAuthLoading(true);
    try {
      const result = await signIn(provider, { redirect: false });
      if (result?.error) {
        throw new Error(result.error);
      }
      
      if (result?.ok) {
        const response = await fetch("/api/auth/session");
        if (response.ok) {
          const session = await response.json();
          if (session?.user) {
            const buyerResponse = await fetch("/api/buyers", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: session.user.email,
                fullName: session.user.name || "User",
                password: "",
                phone: "",
                oauthProvider: provider,
              }),
            });

            if (buyerResponse.ok) {
              const buyer = await buyerResponse.json();
              login({
                id: buyer._id || buyer.id,
                email: buyer.email,
                fullName: buyer.fullName,
                phone: buyer.phone,
                address: buyer.address,
                city: buyer.city,
                state: buyer.state,
                postalCode: buyer.postalCode,
                createdAt: buyer.createdAt,
                preferredCurrency: buyer.preferredCurrency || "NGN",
              });

              // Load the user's preferred currency
              if (buyer.preferredCurrency) {
                setCurrency(buyer.preferredCurrency);
              }

              if (redirectToCheckout) {
                router.push("/checkout");
              } else if (onSuccessfulAuth) {
                onSuccessfulAuth(buyer);
              }
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "OAuth sign-in failed");
    } finally {
      setOAuthLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (mode === "register") {
        // Validation
        if (!formData.fullName?.trim()) throw new Error("Full name is required");
        if (!formData.email?.trim()) throw new Error("Email is required");
        if (!validateEmail(formData.email)) throw new Error("Please enter a valid email");
        if (!formData.phone?.trim()) throw new Error("Phone number is required");
        if (!validatePhone(formData.phone)) throw new Error("Please enter a valid phone number");
        if (!formData.password?.trim()) throw new Error("Password is required");
        if (formData.password.length < 6) throw new Error("Password must be at least 6 characters");

        const response = await fetch("/api/buyers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email.toLowerCase(),
            phone: formData.phone,
            password: formData.password,
            fullName: formData.fullName,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Registration failed");
        }

        const newBuyer = await response.json();
        const buyerProfile = {
          id: newBuyer._id || newBuyer.id,
          email: newBuyer.email,
          fullName: newBuyer.fullName,
          phone: newBuyer.phone,
          address: newBuyer.address,
          city: newBuyer.city,
          state: newBuyer.state,
          postalCode: newBuyer.postalCode,
          createdAt: newBuyer.createdAt,
          preferredCurrency: newBuyer.preferredCurrency || "NGN",
        };
        login(buyerProfile);
        
        // Set the user's preferred currency
        if (newBuyer.preferredCurrency) {
          setCurrency(newBuyer.preferredCurrency);
        }

        setSuccess("✅ Account created successfully! Redirecting...");
        setTimeout(() => {
          if (redirectToCheckout) {
            router.push("/checkout");
          } else if (onSuccessfulAuth) {
            onSuccessfulAuth(buyerProfile);
          } else {
            router.push("/");
          }
        }, 1500);
      } else {
        // 🔒 LOGIN FLOW - Secure approach
        const loginIdentifier = loginType === "email" ? formData.email : formData.phone;
        
        if (!loginIdentifier?.trim()) {
          throw new Error(`Please enter your ${loginType}`);
        }
        if (!formData.password?.trim()) {
          throw new Error("Password is required");
        }

        // 1️⃣ Authenticate with API (sets HTTP-only session cookie)
        const loginPayload = {
          [loginType]: loginType === "email" ? loginIdentifier.toLowerCase() : loginIdentifier,
          password: formData.password,
        };
        
        console.log("📝 Login payload:", loginPayload);
        
        const loginResponse = await fetch("/api/buyers", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include", // Important: include cookies
          body: JSON.stringify(loginPayload),
        });

        if (!loginResponse.ok) {
          const errorData = await loginResponse.json();
          console.error("❌ Login error response:", errorData);
          throw new Error(errorData.error || "Login failed");
        }

        console.log("✅ Login successful");

        // 2️⃣ Fetch fresh profile from secure /api/auth/me endpoint
        // This validates the session and gets the latest data from database
        const meResponse = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include", // Include HTTP-only session cookie
        });

        if (!meResponse.ok) {
          throw new Error("Failed to load user profile");
        }

        const meData = await meResponse.json();
        const buyerProfile = meData.buyer;
        
        // 3️⃣ Store profile in React context (which stores minimal data to localStorage)
        login(buyerProfile);
        
        // Load the user's preferred currency
        if (buyerProfile.preferredCurrency) {
          setCurrency(buyerProfile.preferredCurrency);
        }

        setSuccess("✅ Logged in successfully! Redirecting...");
        setTimeout(() => {
          if (redirectToCheckout) {
            router.push("/checkout");
          } else if (onSuccessfulAuth) {
            onSuccessfulAuth(buyerProfile);
          } else {
            router.push("/");
          }
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      console.error("Auth error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="bg-white rounded-2xl shadow-2xl border border-gray-200/30 p-8 w-full max-w-md transition-all duration-300"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => {
            setMode("login");
            setError("");
            setSuccess("");
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition duration-300 ${
            mode === "login"
              ? "bg-gradient-to-r from-lime-600 to-lime-500 text-white shadow-lg hover:shadow-xl"
              : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
          }`}
        >
          <LogIn className="h-4 w-4" />
          Login
        </button>
        <button
          onClick={() => {
            setMode("register");
            setError("");
            setSuccess("");
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition duration-300 ${
            mode === "register"
              ? "bg-gradient-to-r from-lime-600 to-lime-500 text-white shadow-lg hover:shadow-xl"
              : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
          }`}
        >
          <UserPlus className="h-4 w-4" />
          Register
        </button>
      </div>

      {/* Title & Description */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          {mode === "login" ? "Welcome Back!" : "Join EMPI"}
        </h1>
        <p className="text-gray-500 text-sm leading-snug">
          {mode === "login"
            ? "Sign in to your account to continue shopping"
            : "Create an account to get started"}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-start gap-2 text-sm">
          <span className="text-base mt-0.5 flex-shrink-0">⚠️</span>
          <span className="leading-snug">{error}</span>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 flex items-start gap-2 text-sm">
          <span className="text-base mt-0.5 flex-shrink-0">✅</span>
          <span className="leading-snug">{success}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Login: Email/Phone Toggle */}
        {mode === "login" && (
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => setLoginType("email")}
              className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm transition flex items-center justify-center gap-2 ${
                loginType === "email"
                  ? "bg-lime-100 text-lime-700 border border-lime-300 shadow-sm"
                  : "bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100"
              }`}
            >
              <Mail className="h-4 w-4" />
              Email
            </button>
            <button
              type="button"
              onClick={() => setLoginType("phone")}
              className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm transition flex items-center justify-center gap-2 ${
                loginType === "phone"
                  ? "bg-lime-100 text-lime-700 border border-lime-300 shadow-sm"
                  : "bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100"
              }`}
            >
              <Phone className="h-4 w-4" />
              Phone
            </button>
          </div>
        )}

        {/* Login Fields */}
        {mode === "login" && (
          <>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1 uppercase tracking-wide">
                {loginType === "email" ? (
                  <Mail className="h-3 w-3 text-lime-600" />
                ) : (
                  <Phone className="h-3 w-3 text-lime-600" />
                )}
                {loginType === "email" ? "Email" : "Phone"} *
              </label>
              <input
                type={loginType === "email" ? "email" : "tel"}
                name={loginType}
                value={loginType === "email" ? formData.email : formData.phone}
                onChange={handleChange}
                placeholder={loginType === "email" ? "you@example.com" : "+234 801 234 5678"}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent transition text-xs placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1 uppercase tracking-wide">
                <Lock className="h-3 w-3 text-lime-600" />
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent transition text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                >
                  {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                </button>
              </div>
            </div>
          </>
        )}

        {/* Register Fields */}
        {mode === "register" && (
          <>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1 uppercase tracking-wide">
                <User className="h-3 w-3 text-lime-600" />
                Full Name *
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Your full name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent transition text-xs placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1 uppercase tracking-wide">
                <Mail className="h-3 w-3 text-lime-600" />
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent transition text-xs placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1 uppercase tracking-wide">
                <Phone className="h-3 w-3 text-lime-600" />
                Phone *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+234 801 234 5678"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent transition text-xs placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1 uppercase tracking-wide">
                <Lock className="h-3 w-3 text-lime-600" />
                Password (6+ chars) *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent transition text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                >
                  {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                </button>
              </div>
            </div>
          </>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || oauthLoading}
          className="w-full bg-gradient-to-r from-lime-600 to-lime-500 hover:from-lime-700 hover:to-lime-600 disabled:from-gray-400 disabled:to-gray-400 text-white font-bold py-3 px-4 rounded-xl transition duration-300 shadow-lg hover:shadow-xl mt-6 text-base"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
              Processing...
            </span>
          ) : mode === "login" ? (
            "Sign In"
          ) : (
            "Create Account"
          )}
        </button>
      </form>

      {/* Toggle Mode */}
      <p className="text-center text-sm text-gray-600 mt-6">
        {mode === "login" ? "No account? " : "Have an account? "}
        <button
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setError("");
            setSuccess("");
            setFormData({
              email: "",
              phone: "",
              password: "",
              fullName: "",
            });
          }}
          className="text-lime-600 hover:text-lime-700 font-semibold transition"
        >
          {mode === "login" ? "Sign up" : "Sign in"}
        </button>
      </p>
    </div>
  );
}
