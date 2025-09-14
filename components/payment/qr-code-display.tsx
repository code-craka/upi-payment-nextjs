"use client";

import { useState, useEffect } from "react";
import { Copy, Download, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QRCodeDisplayProps {
  upiLink: string;
  amount: number;
  merchantName: string;
}

export default function QRCodeDisplay({
  upiLink,
  amount,
  merchantName,
}: QRCodeDisplayProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    // Generate QR code using a free QR code API
    const generateQRCode = async () => {
      try {
        // Using QR Server API (free service)
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiLink)}`;
        setQrCodeUrl(qrUrl);
      } catch (error) {
        console.error("Failed to generate QR code:", error);
      } finally {
        setIsLoading(false);
      }
    };

    generateQRCode();
  }, [upiLink]);

  const copyUpiLink = async () => {
    try {
      await navigator.clipboard.writeText(upiLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (error) {
      console.error("Failed to copy UPI link:", error);
    }
  };

  const downloadQRCode = () => {
    if (qrCodeUrl) {
      const link = document.createElement("a");
      link.href = qrCodeUrl;
      link.download = `payment-qr-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="space-y-4">
      {/* QR Code */}
      <div className="flex justify-center">
        <div className="bg-white p-4 rounded-lg border-2 border-gray-200 shadow-sm">
          {isLoading ? (
            <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : qrCodeUrl ? (
            <img
              src={qrCodeUrl}
              alt="UPI Payment QR Code"
              className="w-48 h-48 rounded-lg"
              onError={() => {
                console.error("Failed to load QR code image");
                setQrCodeUrl("");
              }}
            />
          ) : (
            <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-500">
                <Smartphone className="h-8 w-8 mx-auto mb-2" />
                <div className="text-sm">QR Code unavailable</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* QR Code Actions */}
      {qrCodeUrl && (
        <div className="flex gap-2 justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={downloadQRCode}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download QR
          </Button>
        </div>
      )}

      {/* Manual Instructions */}
      <div className="space-y-3">
        <div className="text-center">
          <h4 className="font-medium text-gray-900 mb-2">
            Scan QR Code or Pay Manually
          </h4>
        </div>

        {/* UPI Link */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700">
            UPI Payment Link:
          </div>
          <div className="flex gap-2">
            <div className="flex-1 p-3 bg-gray-50 rounded-lg border text-sm font-mono break-all">
              {upiLink}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={copyUpiLink}
              className="px-3 shrink-0"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          {copiedLink && (
            <div className="text-sm text-green-600 text-center">
              UPI link copied to clipboard!
            </div>
          )}
        </div>

        {/* Manual Payment Steps */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h5 className="font-medium text-blue-900 mb-2">
            Manual Payment Steps:
          </h5>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Open any UPI app on your phone</li>
            <li>Scan the QR code above, or</li>
            <li>Copy and paste the UPI link in your app, or</li>
            <li>Enter the UPI ID and amount manually:</li>
          </ol>

          <div className="mt-3 p-3 bg-white rounded border">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium text-gray-700">UPI ID:</div>
                <div className="font-mono text-blue-600 break-all">
                  {upiLink.match(/pa=([^&]+)/)?.[1] || "N/A"}
                </div>
              </div>
              <div>
                <div className="font-medium text-gray-700">Amount:</div>
                <div className="font-mono text-green-600">
                  ₹{amount.toLocaleString("en-IN")}
                </div>
              </div>
            </div>
            <div className="mt-2">
              <div className="font-medium text-gray-700">Note:</div>
              <div className="text-gray-600">Payment to {merchantName}</div>
            </div>
          </div>
        </div>

        {/* Important Note */}
        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
          <div className="text-sm text-yellow-800">
            <div className="font-medium mb-1">⚠️ Important:</div>
            <div>
              After completing the payment, make sure to submit your UTR number
              above for verification.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
