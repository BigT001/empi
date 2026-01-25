"use client";

import React from "react";
import { Check, AlertCircle, X, Info } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

interface ToastProps {
  message: string;
  subtitle?: string;
  type?: ToastType;
  duration?: number;
  onClose?: () => void;
}

/**
 * Toast/Notification Component
 * 
 * A fixed-position notification that appears at the top-center of the screen
 * with proper z-index stacking to ensure it's always visible above other content.
 * 
 * Features:
 * - Appears at top-center (optimal UX visibility)
 * - Highest z-index layer (99999) to always be on top
 * - Supports multiple toast types (success, error, info, warning)
 * - Auto-dismisses after configurable duration
 * - Smooth slide-in animation from top
 * 
 * @param message - Main message text to display
 * @param subtitle - Optional secondary message (e.g., product name, details)
 * @param type - Toast type: 'success' | 'error' | 'info' | 'warning'
 * @param duration - Auto-dismiss time in milliseconds (default: 3000)
 * @param onClose - Callback when toast is dismissed
 */
export const Toast: React.FC<ToastProps> = ({
  message,
  subtitle,
  type = "success",
  duration = 3000,
  onClose,
}) => {
  React.useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  // Define styles based on toast type
  const getStyles = () => {
    switch (type) {
      case "success":
        return {
          bgGradient: "from-lime-600 to-green-600",
          icon: <Check className="h-6 w-6" />,
          borderColor: "border-lime-500",
          badge: "✓",
        };
      case "error":
        return {
          bgGradient: "from-red-600 to-red-700",
          icon: <X className="h-6 w-6" />,
          borderColor: "border-red-500",
          badge: "✕",
        };
      case "warning":
        return {
          bgGradient: "from-amber-500 to-amber-600",
          icon: <AlertCircle className="h-6 w-6" />,
          borderColor: "border-amber-500",
          badge: "⚠",
        };
      case "info":
      default:
        return {
          bgGradient: "from-blue-600 to-blue-700",
          icon: <Info className="h-6 w-6" />,
          borderColor: "border-blue-500",
          badge: "ℹ",
        };
    }
  };

  const styles = getStyles();

  return (
    <>
      {/* Backdrop to ensure toast is on top and block interactions */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 99998,
          pointerEvents: "none",
        }}
      />
      
      {/* Toast notification - always on top */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 999999,
          pointerEvents: "auto",
        }}
        className="w-11/12 md:w-96 animate-in zoom-in duration-300"
      >
        <div
          className={`bg-gradient-to-r ${styles.bgGradient} text-white rounded-lg shadow-2xl p-6 md:p-7 flex items-center gap-4 border ${styles.borderColor} backdrop-blur-sm`}
        >
          <div className="shrink-0">{styles.icon}</div>
          <div className="grow min-w-0">
            <p className="font-bold text-base md:text-lg leading-tight">
              {styles.badge} {message}
            </p>
            {subtitle && (
              <p className="text-sm md:text-base opacity-95 font-medium line-clamp-2 mt-1">
                {subtitle}
              </p>
            )}
          </div>
          {/* Close button - optional for manual dismiss */}
          {duration === 0 && (
            <button
              onClick={() => onClose?.()}
              className="shrink-0 ml-2 p-1 hover:bg-white/20 rounded-md transition"
              aria-label="Close notification"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </>
  );
};
