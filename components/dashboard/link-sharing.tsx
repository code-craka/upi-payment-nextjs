"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LinkSharingProps {
  orderId: string;
  paymentUrl: string;
  onClose?: () => void;
}

export function LinkSharing({
  orderId,
  paymentUrl,
  onClose,
}: LinkSharingProps) {
  const [copied, setCopied] = useState(false);
  const [copyType, setCopyType] = useState<"url" | "whatsapp" | "sms" | null>(
    null
  );

  const copyToClipboard = async (
    text: string,
    type: "url" | "whatsapp" | "sms"
  ) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setCopyType(type);

      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopied(false);
        setCopyType(null);
      }, 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  };

  const getWhatsAppMessage = () => {
    const message = `Hi! Please complete your payment using this secure UPI link: ${paymentUrl}

Order ID: ${orderId}

Click the link to pay instantly through your preferred UPI app.`;

    return `https://wa.me/?text=${encodeURIComponent(message)}`;
  };

  const getSMSMessage = () => {
    const message = `Complete your payment: ${paymentUrl} (Order: ${orderId})`;
    return `sms:?body=${encodeURIComponent(message)}`;
  };

  const getEmailMessage = () => {
    const subject = `Payment Link - Order ${orderId}`;
    const body = `Hi,

Please complete your payment using the secure link below:

${paymentUrl}

Order ID: ${orderId}

This link will redirect you to a secure payment page where you can pay using your preferred UPI app.

Thank you!`;

    return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Share Payment Link
          </h3>
          <p className="text-sm text-gray-600 mt-1">Order ID: {orderId}</p>
        </div>
        {onClose && (
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {/* Direct URL Copy */}
        <div>
          <Label htmlFor="payment-url">Payment URL</Label>
          <div className="flex gap-2 mt-1">
            <Input
              id="payment-url"
              value={paymentUrl}
              readOnly
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={() => copyToClipboard(paymentUrl, "url")}
            >
              {copied && copyType === "url" ? "Copied!" : "Copy"}
            </Button>
          </div>
        </div>

        {/* Quick Share Options */}
        <div>
          <Label>Quick Share</Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
            {/* WhatsApp */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(getWhatsAppMessage(), "_blank")}
              className="flex items-center gap-2"
            >
              <span className="text-green-600">📱</span>
              WhatsApp
            </Button>

            {/* SMS */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(getSMSMessage(), "_blank")}
              className="flex items-center gap-2"
            >
              <span className="text-blue-600">💬</span>
              SMS
            </Button>

            {/* Email */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(getEmailMessage(), "_blank")}
              className="flex items-center gap-2"
            >
              <span className="text-red-600">📧</span>
              Email
            </Button>

            {/* Copy WhatsApp Message */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const message = `Hi! Please complete your payment using this secure UPI link: ${paymentUrl}\n\nOrder ID: ${orderId}\n\nClick the link to pay instantly through your preferred UPI app.`;
                copyToClipboard(message, "whatsapp");
              }}
              className="flex items-center gap-2"
            >
              <span>📋</span>
              {copied && copyType === "whatsapp" ? "Copied!" : "Copy Text"}
            </Button>
          </div>
        </div>

        {/* QR Code Option */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>QR Code</Label>
              <p className="text-xs text-gray-500 mt-1">
                Generate a QR code for easy sharing
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`/pay/${orderId}`, "_blank")}
            >
              View QR Code
            </Button>
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <h4 className="text-sm font-medium text-blue-900 mb-2">
            Sharing Tips:
          </h4>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• Share the payment link directly with your customer</li>
            <li>• Use WhatsApp or SMS for instant delivery</li>
            <li>• The link works on all devices and UPI apps</li>
            <li>• Payment page includes QR code for easy scanning</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
