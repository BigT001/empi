"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useBuyer } from "@/app/context/BuyerContext";
import { LogIn, UserPlus, Eye, EyeOff } from "lucide-react";

interface AuthFormProps {
  onSuccessfulAuth?: (buyer: any) => void;
  onCancel?: () => void;
  redirectToCheckout?: boolean;
}

export function AuthForm({ onSuccessfulAuth, onCancel, redirectToCheckout = false }: AuthFormProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("register");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError("");
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePhone = (phone: string) => {
    return /^[\d\s\-\+\(\)]{10,}$/.test(phone);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
  if (mode === "register") {
        // Validation
        if (!formData.email?.trim()) throw new Error("Email is required");
        if (!validateEmail(formData.email)) throw new Error("Please enter a valid email");
        if (!formData.phone?.trim()) throw new Error("Phone number is required");
        if (!validatePhone(formData.phone)) throw new Error("Please enter a valid phone number");
        if (!formData.password?.trim()) throw new Error("Password is required");
        if (formData.password.length < 6) throw new Error("Password must be at least 6 characters");

        // Register with password - call API
        const response = await fetch("/api/buyers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email.toLowerCase(),
            phone: formData.phone,
            password: formData.password,
            fullName: formData.fullName || "User", // Default to "User" if not provided
            address: formData.address || "Not provided",
            city: formData.city || "Not provided",
            state: formData.state || "Not provided",
            postalCode: formData.postalCode || "Not provided",
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Registration failed");
        }

        const newBuyer = await response.json();
        console.log("✅ Registration successful:", newBuyer);
        
        // Map response to BuyerProfile format
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
        };
        
  // Store in context (mark as logged in)
  login(buyerProfile);

        if (redirectToCheckout) {
          router.push("/checkout");
        } else if (onSuccessfulAuth) {
          onSuccessfulAuth(buyerProfile);
        }
      } else {
        // Login (allow email or phone)
        if (!formData.email?.trim() && !formData.phone?.trim()) throw new Error("Email or phone is required");

        if (formData.email?.trim() && !validateEmail(formData.email)) throw new Error("Please enter a valid email");
        if (formData.phone?.trim() && !validatePhone(formData.phone)) throw new Error("Please enter a valid phone number");
        if (!formData.password?.trim()) throw new Error("Password is required");

        const payload: any = { password: formData.password };
        if (formData.email?.trim()) payload.email = formData.email.toLowerCase();
        if (formData.phone?.trim()) payload.phone = formData.phone;

        const response = await fetch("/api/buyers", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Login failed");
        }

        const buyer = await response.json();
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
      {/* Toggle Tabs */}
      <div className="flex gap-4 mb-6 border-b-2 border-gray-200">
        <button
          onClick={() => {
            setMode("register");
            setError("");
          }}
          className={`pb-3 px-4 font-semibold text-sm transition flex items-center gap-2 ${
            mode === "register"
              ? "text-lime-600 border-b-2 border-lime-600 -mb-[2px]"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <UserPlus className="h-4 w-4" />
          Register
        </button>
        <button
          onClick={() => {
            setMode("login");
            setError("");
          }}
          className={`pb-3 px-4 font-semibold text-sm transition flex items-center gap-2 ${
            mode === "login"
              ? "text-lime-600 border-b-2 border-lime-600 -mb-[2px]"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <LogIn className="h-4 w-4" />
          Login
        </button>
      </div>

      {mode === "register" ? (
        <>
          <h2 className="text-2xl font-bold mb-2">Create Account</h2>
          <p className="text-gray-600 text-sm mb-6">
            Register to track your orders and view your invoice history.
          </p>

          <form id="auth-form" onSubmit={handleSubmit} className="space-y-4 mb-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                First Name
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Enter your name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email (optional)
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Phone Number *
              </label>
              <div className="flex gap-2">
                <select className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 bg-white">
                  <option>+234</option>
                  <option>+1</option>
                  <option>+44</option>
                  <option>+27</option>
                  <option>+254</option>
                  <option>+233</option>
                </select>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="812 345 6789"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Minimum 6 characters"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 pr-10"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-600 hover:text-gray-900"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </form>
        </>
      ) : (
        <>
          <h2 className="text-2xl font-bold mb-2">Login</h2>
          <p className="text-gray-600 text-sm mb-6">
            Sign in to view your past orders and invoices.
          </p>

          <form id="auth-form" onSubmit={handleSubmit} className="space-y-4 mb-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Or Phone Number
              </label>
              <div className="flex gap-2">
                <select className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 bg-white">
                  <option>+234</option>
                  <option>+1</option>
                  <option>+44</option>
                  <option>+27</option>
                  <option>+254</option>
                  <option>+233</option>
                </select>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="812 345 6789"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 pr-10"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-600 hover:text-gray-900"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </form>
        </>
      )}

      {/* Action Buttons - Side by Side */}
      <div className="flex gap-3">
        <button
          type="submit"
          form="auth-form"
          disabled={loading}
          className="flex-1 bg-lime-600 hover:bg-lime-700 disabled:bg-gray-400 text-white font-semibold py-2 rounded-lg transition"
        >
          {mode === "register" ? "Register" : "Login"}
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            className="flex-1 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-2 rounded-lg transition"
          >
            Continue as Guest
          </button>
        )}
      </div>
    </div>
  );
}
