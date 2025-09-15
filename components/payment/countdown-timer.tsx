"use client";

import { useState, useEffect } from "react";
import { Clock, AlertTriangle } from "lucide-react";

interface CountdownTimerProps {
  expiresAt: Date;
  onExpire: () => void;
}

export default function CountdownTimer({
  expiresAt,
  onExpire,
}: CountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const expiry = expiresAt.getTime();
      const remaining = Math.max(0, expiry - now);

      if (remaining === 0 && !isExpired) {
        setIsExpired(true);
        onExpire();
      }

      return remaining;
    };

    // Initial calculation
    setTimeRemaining(calculateTimeRemaining());

    // Set up interval to update every second
    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining();
      setTimeRemaining(remaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpire, isExpired]);

  // Format time remaining
  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return {
      minutes,
      seconds,
      display: `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`,
    };
  };

  const { minutes, seconds, display } = formatTime(timeRemaining);
  const isUrgent = minutes < 2; // Show warning when less than 2 minutes remain
  const isVeryUrgent = minutes < 1; // Show critical warning when less than 1 minute remains

  if (isExpired) {
    return (
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 text-red-600 mb-2">
          <AlertTriangle className="h-5 w-5" />
          <span className="font-semibold">Payment Expired</span>
        </div>
        <p className="text-sm text-gray-600">
          This payment link has expired. Please contact the merchant for a new
          link.
        </p>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-2 mb-2">
        <Clock
          className={`h-5 w-5 ${isUrgent ? "text-red-500" : "text-blue-500"}`}
        />
        <span className="text-sm font-medium text-gray-700">
          Time Remaining
        </span>
      </div>

      <div
        className={`text-2xl sm:text-3xl font-bold mb-2 ${
          isVeryUrgent
            ? "text-red-600 animate-pulse"
            : isUrgent
              ? "text-orange-500"
              : "text-blue-600"
        }`}
      >
        {display}
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3 mb-2">
        <div
          className={`h-2 sm:h-3 rounded-full transition-all duration-1000 ${
            isVeryUrgent
              ? "bg-red-500"
              : isUrgent
                ? "bg-orange-500"
                : "bg-blue-500"
          }`}
          style={{
            width: `${Math.max(0, (timeRemaining / (9 * 60 * 1000)) * 100)}%`,
          }}
        />
      </div>

      <p
        className={`text-sm ${
          isUrgent ? "text-red-600 font-medium" : "text-gray-600"
        }`}
      >
        {isVeryUrgent
          ? "⚠️ Payment will expire soon!"
          : isUrgent
            ? "⏰ Please complete payment quickly"
            : "Complete your payment before the timer expires"}
      </p>
    </div>
  );
}
