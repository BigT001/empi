'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/app/context/AdminContext';
import { LogIn, Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, admin, isLoading, sessionError } = useAdmin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (admin && !isLoading) {
      router.push('/admin');
    }
  }, [admin, isLoading, router]);

  // Note: We don't display sessionError on login page because it shows
  // "Session expired" on initial load (before any login attempt), which is confusing.
  // Only show errors from actual login attempts via the setError state.

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (!email.trim()) {
        throw new Error('Email is required');
      }
      if (!password.trim()) {
        throw new Error('Password is required');
      }

      // Email validation
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error('Please enter a valid email address');
      }

      await login(email, password);
      router.push('/admin');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      
      // Extract remaining attempts from error message if present
      const attemptsMatch = errorMessage.match(/\((\d+)\s+attempts?\s+remaining\)/);
      if (attemptsMatch) {
        setRemainingAttempts(parseInt(attemptsMatch[1]));
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-lime-50 to-lime-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="animate-spin">
              <LogIn className="h-8 w-8 text-lime-600" />
            </div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-lime-50 to-lime-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <LogIn className="h-8 w-8 text-lime-600" />
            <h1 className="text-3xl font-bold text-gray-900">Admin Login</h1>
          </div>
          <p className="text-gray-600">Access the admin dashboard</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error Messages */}
          {error && (
            <div className={`p-4 rounded-lg flex items-start gap-3 ${
              error.includes('rate limit') || error.includes('locked') || error.includes('Too many')
                ? 'bg-red-50 border border-red-200 text-red-700'
                : error.includes('disabled')
                ? 'bg-orange-50 border border-orange-200 text-orange-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div className="text-sm flex-1">
                <p className="font-semibold mb-1">{
                  error.includes('rate limit') || error.includes('Too many') ? 'Account Temporarily Locked' :
                  error.includes('disabled') ? 'Account Disabled' :
                  'Login Failed'
                }</p>
                <p>{error}</p>
                {remainingAttempts !== null && remainingAttempts > 0 && (
                  <p className="mt-2 text-xs opacity-90">
                    ⚠️ {remainingAttempts} attempt{remainingAttempts !== 1 ? 's' : ''} remaining
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Email Field */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 transition"
              disabled={submitting}
              autoComplete="email"
            />
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 transition pr-10"
                disabled={submitting}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-gray-600 hover:text-gray-900"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-lime-600 hover:bg-lime-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition mt-6"
          >
            {submitting ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-600 text-center">
            This page is for authorized administrators only.
          </p>
          <p className="text-xs text-gray-500 text-center mt-2">
            🔒 Your credentials are secure and encrypted
          </p>
        </div>
      </div>
    </div>
  );
}
