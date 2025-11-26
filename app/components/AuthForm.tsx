"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useBuyer } from "@/app/context/BuyerContext";
import { LogIn, UserPlus, Mail, Phone, Lock, User, MapPin, Eye, EyeOff } from "lucide-react";
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

  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    password: "",
    fullName: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
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
                address: "Not provided",
                city: "Not provided",
                state: "Not provided",
                postalCode: "Not provided",
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
              });

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
        if (!formData.address?.trim()) throw new Error("Address is required");

        const response = await fetch("/api/buyers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email.toLowerCase(),
            phone: formData.phone,
            password: formData.password,
            fullName: formData.fullName,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            postalCode: formData.postalCode,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Registration failed");
        }

        const newBuyer = await response.json();
        register({
          email: newBuyer.email,
          fullName: newBuyer.fullName,
          phone: newBuyer.phone,
          address: newBuyer.address,
          city: newBuyer.city,
          state: newBuyer.state,
          postalCode: newBuyer.postalCode,
        });

        setSuccess("✅ Account created successfully! Redirecting...");
        setTimeout(() => {
          if (redirectToCheckout) {
            router.push("/checkout");
          } else if (onSuccessfulAuth) {
            onSuccessfulAuth(newBuyer);
          } else {
            router.push("/");
          }
        }, 1500);
      } else {
        // Login with email/phone and password
        const loginIdentifier = loginType === "email" ? formData.email : formData.phone;
        
        if (!loginIdentifier?.trim()) {
          throw new Error(`Please enter your ${loginType}`);
        }
        if (!formData.password?.trim()) {
          throw new Error("Password is required");
        }

        const response = await fetch("/api/buyers", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            [loginType]: loginType === "email" ? loginIdentifier.toLowerCase() : loginIdentifier,
            password: formData.password,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Login failed");
        }

        const buyer = await response.json();
        login(buyer);
        setSuccess("✅ Logged in successfully! Redirecting...");
        setTimeout(() => {
          if (redirectToCheckout) {
            router.push("/checkout");
          } else if (onSuccessfulAuth) {
            onSuccessfulAuth(buyer);
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
      className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 md:p-10 w-full max-w-md max-h-[90vh] overflow-y-auto"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Tabs */}
      <div className="flex gap-3 mb-8">
        <button
          onClick={() => {
            setMode("login");
            setError("");
            setSuccess("");
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-bold transition ${
            mode === "login"
              ? "bg-gradient-to-r from-lime-600 to-lime-500 text-white shadow-lg"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
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
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-bold transition ${
            mode === "register"
              ? "bg-gradient-to-r from-lime-600 to-lime-500 text-white shadow-lg"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <UserPlus className="h-4 w-4" />
          Register
        </button>
      </div>

      {/* Title & Description */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {mode === "login" ? "Welcome Back!" : "Join EMPI"}
        </h1>
        <p className="text-gray-600 text-sm">
          {mode === "login"
            ? "Sign in with your email/phone and password to access your account"
            : "Create a new account to start shopping with EMPI"}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-start gap-3">
          <span className="text-lg mt-0.5">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-start gap-3">
          <span className="text-lg mt-0.5">✅</span>
          <span>{success}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Login: Email/Phone Toggle */}
        {mode === "login" && (
          <div className="flex gap-3 mb-6">
            <button
              type="button"
              onClick={() => setLoginType("email")}
              className={`flex-1 py-2 px-3 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
                loginType === "email"
                  ? "bg-lime-100 text-lime-700 border border-lime-300"
                  : "bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200"
              }`}
            >
              <Mail className="h-4 w-4" />
              Email
            </button>
            <button
              type="button"
              onClick={() => setLoginType("phone")}
              className={`flex-1 py-2 px-3 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
                loginType === "phone"
                  ? "bg-lime-100 text-lime-700 border border-lime-300"
                  : "bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200"
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
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                {loginType === "email" ? (
                  <Mail className="h-4 w-4 text-lime-600" />
                ) : (
                  <Phone className="h-4 w-4 text-lime-600" />
                )}
                {loginType === "email" ? "Email Address" : "Phone Number"} *
              </label>
              <input
                type={loginType === "email" ? "email" : "tel"}
                name={loginType}
                value={loginType === "email" ? formData.email : formData.phone}
                onChange={handleChange}
                placeholder={loginType === "email" ? "your@email.com" : "+234 801 234 5678"}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Lock className="h-4 w-4 text-lime-600" />
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </>
        )}

        {/* Register Fields */}
        {mode === "register" && (
          <>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <User className="h-4 w-4 text-lime-600" />
                Full Name *
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="John Doe"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Mail className="h-4 w-4 text-lime-600" />
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Phone className="h-4 w-4 text-lime-600" />
                Phone Number *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+234 801 234 5678"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Lock className="h-4 w-4 text-lime-600" />
                Password (min 6 characters) *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-lime-600" />
                Address *
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="123 Main Street"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Lagos"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  State
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="Lagos"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Postal Code
              </label>
              <input
                type="text"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleChange}
                placeholder="100001"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent transition"
              />
            </div>
          </>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || oauthLoading}
          className="w-full bg-gradient-to-r from-lime-600 to-lime-500 hover:from-lime-700 hover:to-lime-600 disabled:from-gray-400 disabled:to-gray-400 text-white font-bold py-3 px-4 rounded-lg transition shadow-lg hover:shadow-xl"
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
        {mode === "login" ? "Don't have an account? " : "Already have an account? "}
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
              address: "",
              city: "",
              state: "",
              postalCode: "",
            });
          }}
          className="text-lime-600 hover:text-lime-700 font-bold underline"
        >
          {mode === "login" ? "Register Here" : "Login Here"}
        </button>
      </p>

      {/* Guest/Cancel Option */}
      {onCancel && (
        <div className="mt-6 text-center">
          <button
            onClick={onCancel}
            className="inline-block px-6 py-2 border-2 border-lime-600 text-lime-600 font-bold rounded-lg hover:bg-lime-50 transition"
          >
            Continue as Guest
          </button>
        </div>
      )}
    </div>
  );
}
