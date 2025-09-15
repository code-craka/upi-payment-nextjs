"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink, Smartphone } from "lucide-react";
import { UPI_APPS, getAppStoreUrl } from "@/lib/utils/upi-links";
import { UPIRedirectHandler } from "@/lib/utils/network-handler";
import { UPIAppError } from "@/components/error/network-error";
import { useToast } from "@/components/error/error-messages";

interface UpiButtonsProps {
  upiLinks: Record<string, string>;
  enabledApps: string[];
  settings: {
    enabledUpiApps: {
      gpay: boolean;
      phonepe: boolean;
      paytm: boolean;
      bhim: boolean;
    };
  };
}

interface UpiAppInfo {
  name: string;
  icon: string;
  color: string;
  textColor: string;
}

const UPI_APP_INFO: Record<string, UpiAppInfo> = {
  gpay: {
    name: "Google Pay",
    icon: "🟢",
    color: "bg-blue-600 hover:bg-blue-700",
    textColor: "text-white",
  },
  phonepe: {
    name: "PhonePe",
    icon: "📱",
    color: "bg-purple-600 hover:bg-purple-700",
    textColor: "text-white",
  },
  paytm: {
    name: "Paytm",
    icon: "💙",
    color: "bg-blue-500 hover:bg-blue-600",
    textColor: "text-white",
  },
  bhim: {
    name: "BHIM",
    icon: "🏛️",
    color: "bg-orange-600 hover:bg-orange-700",
    textColor: "text-white",
  },
};

export default function UpiButtons({
  upiLinks,
  enabledApps,
  settings,
}: UpiButtonsProps) {
  const [clickedApp, setClickedApp] = useState<string | null>(null);
  const [showManualFallback, setShowManualFallback] = useState(false);
  const [failedApp, setFailedApp] = useState<string | null>(null);
  const { showToast } = useToast();

  const handleUpiAppClick = async (app: string, upiLink: string) => {
    setClickedApp(app);
    setFailedApp(null);

    try {
      await UPIRedirectHandler.redirectToUPIApp(
        app as "gpay" | "phonepe" | "paytm" | "bhim",
        upiLink,
        {
          fallbackDelay: 3000,
          onFallback: () => {
            setFailedApp(app);
            showToast({
              type: "warning",
              title: `${UPI_APP_INFO[app]?.name || app} Not Available`,
              message:
                "The app couldn't be opened. Try manual payment or install the app.",
            });
          },
          onError: (error) => {
            console.error(`Failed to open ${app}:`, error);
            setFailedApp(app);
            showToast({
              type: "error",
              title: "Payment App Error",
              message:
                "There was an error opening the payment app. Please try again or use manual payment.",
            });
          },
        }
      );
    } catch (error) {
      console.error(`UPI redirect error for ${app}:`, error);
      setFailedApp(app);
      showToast({
        type: "error",
        title: "Connection Error",
        message:
          "Unable to connect to the payment app. Please check your connection and try again.",
      });
    } finally {
      // Reset clicked state after a delay
      setTimeout(() => {
        setClickedApp(null);
      }, 2000);
    }
  };

  const getFilteredApps = () => {
    return enabledApps.filter((app) => {
      // Check if app is enabled in system settings
      if (app in settings.enabledUpiApps) {
        return settings.enabledUpiApps[
          app as keyof typeof settings.enabledUpiApps
        ];
      }
      return false;
    });
  };

  const filteredApps = getFilteredApps();

  if (filteredApps.length === 0) {
    return (
      <div className="text-center py-8">
        <Smartphone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No UPI apps are currently enabled.</p>
        <p className="text-sm text-gray-500 mt-2">
          Please use the manual UPI option below.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3">
        {filteredApps.map((app) => {
          const appInfo = UPI_APP_INFO[app];
          const upiLink = upiLinks[app] || upiLinks.standard;
          const isClicked = clickedApp === app;

          if (!appInfo) return null;

          return (
            <Button
              key={app}
              onClick={() => handleUpiAppClick(app, upiLink)}
              disabled={isClicked}
              className={`w-full h-16 sm:h-14 text-base sm:text-lg font-medium ${appInfo.color} ${appInfo.textColor}
                         transition-all duration-200 transform hover:scale-105 active:scale-95 touch-manipulation
                         ${isClicked ? "opacity-75 cursor-not-allowed" : ""}`}
            >
              <div className="flex items-center justify-center gap-2 sm:gap-3">
                <span className="text-xl sm:text-2xl">{appInfo.icon}</span>
                <span className="text-center">
                  {isClicked ? "Opening..." : `Pay with ${appInfo.name}`}
                </span>
                <ExternalLink className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
            </Button>
          );
        })}
      </div>

      {/* Standard UPI Link */}
      <div className="pt-4 border-t border-gray-200">
        <Button
          variant="outline"
          onClick={() => handleUpiAppClick("standard", upiLinks.standard)}
          disabled={clickedApp === "standard"}
          className="w-full h-14 sm:h-12 text-base font-medium border-2 hover:bg-gray-50 touch-manipulation"
        >
          <div className="flex items-center justify-center gap-2">
            <span className="text-lg">🔗</span>
            <span className="text-center">
              {clickedApp === "standard"
                ? "Opening..."
                : "Open with Any UPI App"}
            </span>
            <ExternalLink className="h-4 w-4" />
          </div>
        </Button>
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">How to pay:</h4>
        <ol className="text-sm text-blue-800 space-y-1">
          <li>1. Click on your preferred UPI app above</li>
          <li>2. Complete the payment in the app</li>
          <li>3. Return here and submit your UTR number</li>
          <li>4. Your payment will be verified shortly</li>
        </ol>
      </div>

      {/* Troubleshooting */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <details className="text-sm">
          <summary className="font-medium text-gray-700 cursor-pointer">
            App not opening? Click here for help
          </summary>
          <div className="mt-2 text-gray-600 space-y-2">
            <p>• Make sure your UPI app is installed and updated</p>
            <p>• Try using the &quot;Open with Any UPI App&quot; option</p>
            <p>• Use the manual UPI option with QR code</p>
            <p>• Copy the UPI ID and amount to pay manually</p>
          </div>
        </details>
      </div>
    </div>
  );
}
