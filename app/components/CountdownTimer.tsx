"use client";

import { useEffect, useState } from "react";
import { Clock, AlertCircle } from "lucide-react";

interface CountdownTimerProps {
  deadlineDate?: Date | string;
  timerStartedAt?: Date | string;
  status?: "pending" | "approved" | "in-progress" | "ready" | "completed" | "rejected";
  orderId?: string;
  compact?: boolean; // Compact view for card header
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  totalSeconds: number;
}

export function CountdownTimer({
  deadlineDate,
  timerStartedAt,
  status = "pending",
  orderId,
  compact = false,
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    // Don't show timer if not started or if already completed
    if (!timerStartedAt || !deadlineDate || status === "completed" || status === "rejected") {
      return;
    }

    const calculateTimeLeft = () => {
      const now = new Date();
      const deadline = new Date(deadlineDate);

      const difference = deadline.getTime() - now.getTime();

      if (difference <= 0) {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isExpired: true,
          totalSeconds: 0,
        });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({
        days,
        hours,
        minutes,
        seconds,
        isExpired: false,
        totalSeconds: Math.floor(difference / 1000),
      });
    };

    // Calculate immediately
    calculateTimeLeft();

    // Update every second
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [deadlineDate, timerStartedAt, status]);

  if (!timerStartedAt || !deadlineDate || !timeLeft) {
    return null;
  }

  if (compact) {
    // Compact view for card header
    return (
      <div className="flex items-center gap-2">
        {timeLeft.isExpired ? (
          <div className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-semibold">
            <AlertCircle className="h-3 w-3" />
            Deadline Passed
          </div>
        ) : (
          <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
            <Clock className="h-3 w-3" />
            {timeLeft.days > 0 && `${timeLeft.days}d `}
            {String(timeLeft.hours).padStart(2, "0")}:{String(timeLeft.minutes).padStart(2, "0")}
          </div>
        )}
      </div>
    );
  }

  // Full view for expanded card
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="h-5 w-5 text-blue-600" />
        <h4 className="font-semibold text-gray-900">Delivery Countdown</h4>
      </div>

      {timeLeft.isExpired ? (
        <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <div>
            <p className="font-bold text-red-900">Deadline Passed</p>
            <p className="text-xs text-red-700">Please contact admin for extension</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-white rounded-lg p-3 text-center border border-blue-100">
            <div className="text-2xl font-bold text-blue-600">
              {timeLeft.days}
            </div>
            <div className="text-xs text-gray-600 font-semibold mt-1">DAYS</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center border border-blue-100">
            <div className="text-2xl font-bold text-blue-600">
              {String(timeLeft.hours).padStart(2, "0")}
            </div>
            <div className="text-xs text-gray-600 font-semibold mt-1">HRS</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center border border-blue-100">
            <div className="text-2xl font-bold text-blue-600">
              {String(timeLeft.minutes).padStart(2, "0")}
            </div>
            <div className="text-xs text-gray-600 font-semibold mt-1">MIN</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center border border-blue-100">
            <div className="text-2xl font-bold text-blue-600">
              {String(timeLeft.seconds).padStart(2, "0")}
            </div>
            <div className="text-xs text-gray-600 font-semibold mt-1">SEC</div>
          </div>
        </div>
      )}

      {/* Progress bar */}
      <div className="mt-3">
        <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-400 to-indigo-600 transition-all duration-1000"
            style={{
              width: `${Math.max(0, Math.min(100, (timeLeft.totalSeconds / (30 * 24 * 60 * 60)) * 100))}%`,
            }}
          ></div>
        </div>
      </div>

      {timeLeft.days === 0 && timeLeft.hours <= 1 && (
        <div className="mt-2 text-xs text-red-600 font-semibold flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Deadline approaching!
        </div>
      )}
    </div>
  );
}
