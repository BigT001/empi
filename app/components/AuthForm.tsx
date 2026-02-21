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
    firstName: "",
    lastName: "",
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
              } else {
                router.push("/dashboard");
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
        if (!formData.firstName?.trim()) throw new Error("First name is required");
        if (!formData.lastName?.trim()) throw new Error("Last name is required");
        if (!formData.email?.trim()) throw new Error("Email is required");
        if (!validateEmail(formData.email)) throw new Error("Please enter a valid email");
        if (!formData.phone?.trim()) throw new Error("Phone number is required");
        if (!validatePhone(formData.phone)) throw new Error("Please enter a valid phone number");
        if (!formData.password?.trim()) throw new Error("Password is required");
        if (formData.password.length < 6) throw new Error("Password must be at least 6 characters");

        // Construct full name from first and last name
        const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`;

        const response = await fetch("/api/buyers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email.toLowerCase(),
            phone: formData.phone,
            password: formData.password,
            fullName: fullName,
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
            router.push("/dashboard");
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
            router.push("/dashboard");
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
      className="bg-white/80 dark:bg-black/40 backdrop-blur-xl rounded-3xl border border-gray-100 dark:border-white/5 p-4 md:p-10 w-full max-w-md transition-all duration-300"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Tabs */}
      <div className="flex bg-gray-50/50 dark:bg-white/5 p-1.5 rounded-2xl mb-10 border border-gray-100 dark:border-white/5">
        <button
          type="button"
          onClick={() => {
            setMode("login");
            setError("");
            setSuccess("");
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all duration-500 scale-100 active:scale-95 ${mode === "login"
            ? "bg-white dark:bg-lime-500 text-lime-600 dark:text-white shadow-xl shadow-lime-500/10"
            : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            }`}
        >
          <LogIn className="h-3.5 w-3.5" />
          Login
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("register");
            setError("");
            setSuccess("");
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all duration-500 scale-100 active:scale-95 ${mode === "register"
            ? "bg-white dark:bg-lime-500 text-lime-600 dark:text-white shadow-xl shadow-lime-500/10"
            : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            }`}
        >
          <UserPlus className="h-3.5 w-3.5" />
          Register
        </button>
      </div>

      {/* Title & Description */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2 font-playfair tracking-tight">
          {mode === "login" ? "Welcome Back" : "Create Account"}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-widest leading-relaxed">
          {mode === "login"
            ? "Sign in to access your EMPI dashboard"
            : "Join the elite costume community"}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/20 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-4 flex items-start gap-2 text-sm">
          <span className="text-base mt-0.5 flex-shrink-0">⚠️</span>
          <span className="leading-snug">{error}</span>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/20 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg mb-4 flex items-start gap-2 text-sm">
          <span className="text-base mt-0.5 flex-shrink-0">✅</span>
          <span className="leading-snug">{success}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Login: Email/Phone Toggle */}
        {mode === "login" && (
          <div className="flex bg-gray-50/50 dark:bg-white/5 p-1 rounded-xl mb-6 border border-gray-100 dark:border-white/5">
            <button
              type="button"
              onClick={() => setLoginType("email")}
              className={`flex-1 py-1.5 px-3 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 ${loginType === "email"
                ? "bg-white dark:bg-zinc-800 text-lime-600 dark:text-white shadow-sm"
                : "text-gray-400 dark:text-gray-500"
                }`}
            >
              <Mail className="h-3 w-3" />
              Email
            </button>
            <button
              type="button"
              onClick={() => setLoginType("phone")}
              className={`flex-1 py-1.5 px-3 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 ${loginType === "phone"
                ? "bg-white dark:bg-zinc-800 text-lime-600 dark:text-white shadow-sm"
                : "text-gray-400 dark:text-gray-500"
                }`}
            >
              <Phone className="h-3 w-3" />
              Phone
            </button>
          </div>
        )}

        {/* Login Fields */}
        {mode === "login" && (
          <>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1 uppercase tracking-wide">
                {loginType === "email" ? (
                  <Mail className="h-3 w-3 text-lime-600 dark:text-lime-400" />
                ) : (
                  <Phone className="h-3 w-3 text-lime-600 dark:text-lime-400" />
                )}
                {loginType === "email" ? "Email" : "Phone"} *
              </label>
              <input
                type={loginType === "email" ? "email" : "tel"}
                name={loginType}
                value={loginType === "email" ? formData.email : formData.phone}
                onChange={handleChange}
                placeholder={loginType === "email" ? "Email Address" : "Phone Number"}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-xl focus:border-lime-500/50 focus:bg-white dark:focus:bg-black/40 transition-all text-xs placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1 uppercase tracking-wide">
                <Lock className="h-3 w-3 text-lime-600 dark:text-lime-400" />
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Password"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-xl focus:border-lime-500/50 focus:bg-white dark:focus:bg-black/40 transition-all text-xs text-gray-900 dark:text-white outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          </>
        )}

        {/* Register Fields */}
        {mode === "register" && (
          <>
            {/* First Name and Last Name in a Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1 uppercase tracking-wide">
                  <User className="h-3 w-3 text-lime-600 dark:text-lime-400" />
                  First Name *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="First Name"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-xl focus:border-lime-500/50 focus:bg-white dark:focus:bg-black/40 transition-all text-xs placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1 uppercase tracking-wide">
                  <User className="h-3 w-3 text-lime-600 dark:text-lime-400" />
                  Last Name *
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Last Name"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-xl focus:border-lime-500/50 focus:bg-white dark:focus:bg-black/40 transition-all text-xs placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1 uppercase tracking-wide">
                <Mail className="h-3 w-3 text-lime-600 dark:text-lime-400" />
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email Address"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-xl focus:border-lime-500/50 focus:bg-white dark:focus:bg-black/40 transition-all text-xs placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1 uppercase tracking-wide">
                <Phone className="h-3 w-3 text-lime-600 dark:text-lime-400" />
                Phone *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Phone Number"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-xl focus:border-lime-500/50 focus:bg-white dark:focus:bg-black/40 transition-all text-xs placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1 uppercase tracking-wide">
                <Lock className="h-3 w-3 text-lime-600 dark:text-lime-400" />
                Password (6+ chars) *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create Password"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-xl focus:border-lime-500/50 focus:bg-white dark:focus:bg-black/40 transition-all text-xs text-gray-900 dark:text-white outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          </>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || oauthLoading}
          className="relative group w-full bg-lime-600 hover:bg-lime-500 disabled:bg-gray-800 text-white font-black py-4 px-6 rounded-2xl transition-all duration-500 shadow-xl shadow-lime-500/10 hover:shadow-lime-500/20 mt-8 text-xs uppercase tracking-[0.2em] active:scale-95 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
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
      <p className="text-center text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-500 mt-10">
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
              firstName: "",
              lastName: "",
            });
          }}
          className="text-lime-600 dark:text-lime-400 hover:text-lime-700 dark:hover:text-lime-300 transition-colors ml-1"
        >
          {mode === "login" ? "Sign up" : "Sign in"}
        </button>
      </p>
    </div>
  );
}
